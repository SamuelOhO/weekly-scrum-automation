#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import { URL } from "url";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 8787;
const UPSTAGE_API_KEY =
  process.env.UPSTAGE_API_KEY ||
  process.env.VITE_UPSTAGE_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.CLAUDE_API_KEY ||
  process.env.VITE_CLAUDE_API_KEY;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const promptPath = path.resolve(__dirname, "../prompts/week_summary.txt");
let systemPrompt = "너는 주간 회의 노트를 짧게 요약하는 비서야.";
try {
  systemPrompt = readFileSync(promptPath, "utf-8");
  console.log(`[proxy] system prompt loaded from ${promptPath}`);
} catch (err) {
  console.warn(`[proxy] prompt file load failed, using default: ${err.message}`);
}

if (!UPSTAGE_API_KEY) {
  console.error("UPSTAGE_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}

const CHAT_PATH = "/api/solar";
const OCR_PATH = "/api/ocr";

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const extractImage = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (dataUrl.startsWith("data:")) {
    const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl);
    if (!match) return null;
    return { media_type: match[1] || "application/octet-stream", data: match[2] };
  }
  return { media_type: "application/octet-stream", data: dataUrl };
};

const handleChat = async (res, { entries = [], weekRange, max_tokens = 800, temperature = 0.3 }) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return sendJson(res, 400, { error: "entries are required" });
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const header = [
    "이번 주(월~금) 데일리 메모를 주간회의용으로 요약해줘.",
    "- 섹션: 완료 / 진행 중 / 블로커 / 결정 / 요청(지원 필요)",
    "- 섹션당 3~6줄, 같은 내용은 합쳐서 한 줄로 표현",
    "- 날짜 순서를 고려해 흐름을 이해하고, 반복 태스크는 한 문장으로 통합",
    "- 사람/팀/프로젝트 이름은 원문 유지",
    "- 불확실한 내용은 “(확인 필요)”라고 표기",
    "- “없음”, “TL;DR” 같은 메타 표현은 쓰지 말 것",
  ];
  if (weekRange?.weekStart && weekRange?.weekEnd) {
    header.push(`기간: ${weekRange.weekStart} ~ ${weekRange.weekEnd}`);
  }
  header.push("", "데일리 메모 (날짜순):");

  const bodyText = sorted
    .map((entry) => `${entry.date}: ${(entry.text || "").trim()}`)
    .join("\n");
  const userText = header.join("\n") + "\n" + bodyText;

  const content = [{ type: "text", text: userText }];
  sorted.forEach((entry) => {
    (entry.images || []).forEach((img) => {
      const parsed = extractImage(img.dataUrl);
      if (!parsed) return;
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${parsed.media_type};base64,${parsed.data}`,
        },
      });
    });
  });

  const upstream = await fetch("https://api.upstage.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${UPSTAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "solar-pro2",
      max_tokens,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      stream: false,
    }),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return sendJson(res, upstream.status, { error: text });
  }
  const data = JSON.parse(text);
  const messageContent = data?.choices?.[0]?.message?.content;
  const result = Array.isArray(messageContent)
    ? messageContent
        .map((item) => (typeof item === "string" ? item : item?.text || ""))
        .join("\n")
        .trim()
    : (messageContent || "").trim();

  return sendJson(res, 200, { content: result });
};

const handleOcr = async (res, payload) => {
  const { filename = "document.pdf", dataUrl, model = "ocr" } = payload || {};
  const parsed = extractImage(dataUrl);
  if (!parsed) {
    return sendJson(res, 400, { error: "유효한 dataUrl이 필요합니다." });
  }

  const buffer = Buffer.from(parsed.data, "base64");
  const file = new File([buffer], filename, { type: parsed.media_type });
  const formData = new FormData();
  formData.append("document", file);
  formData.append("model", model);

  const upstream = await fetch("https://api.upstage.ai/v1/document-digitization", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTAGE_API_KEY}`,
    },
    body: formData,
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return sendJson(res, upstream.status, { error: text });
  }

  try {
    return sendJson(res, 200, JSON.parse(text));
  } catch {
    return sendJson(res, 200, { raw: text });
  }
};

const handler = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (req.method !== "POST" || (url.pathname !== CHAT_PATH && url.pathname !== OCR_PATH)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  try {
    const body = await readRequestBody(req);
    const payload = JSON.parse(body || "{}");

    if (url.pathname === CHAT_PATH) {
      return handleChat(res, payload);
    }
    if (url.pathname === OCR_PATH) {
      return handleOcr(res, payload);
    }
    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
};

http.createServer(handler).listen(PORT, () => {
  console.log(`Upstage proxy ready on http://localhost:${PORT}${CHAT_PATH}`);
});
