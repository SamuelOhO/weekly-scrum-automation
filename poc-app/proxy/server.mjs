#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import { URL } from "url";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 8787;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const promptPath = path.resolve(__dirname, "../prompts/week_summary.txt");
let systemPrompt = "너는 주간 회의 노트를 짧게 요약하는 비서야.";
try {
  systemPrompt = readFileSync(promptPath, "utf-8");
  console.log(`[proxy] system prompt loaded from ${promptPath}`);
} catch (err) {
  console.warn(`[proxy] prompt file load failed, using default: ${err.message}`);
}

if (!CLAUDE_API_KEY) {
  console.error("CLAUDE_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}

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

  if (req.method !== "POST" || url.pathname !== "/api/claude") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { entries = [], weekRange, max_tokens = 800, temperature = 0.3 } =
        JSON.parse(body || "{}");

      if (!Array.isArray(entries) || entries.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "entries are required" }));
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

      const extractImage = (dataUrl) => {
        if (!dataUrl || typeof dataUrl !== "string") return null;
        if (dataUrl.startsWith("data:")) {
          const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl);
          if (!match) return null;
          return { media_type: match[1] || "application/octet-stream", data: match[2] };
        }
        return { media_type: "application/octet-stream", data: dataUrl };
      };

      const content = [{ type: "text", text: userText }];
      sorted.forEach((entry) => {
        (entry.images || []).forEach((img) => {
          const parsed = extractImage(img.dataUrl);
          if (!parsed) return;
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: parsed.media_type,
              data: parsed.data,
            },
          });
        });
      });

      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: "user", content }],
        }),
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        res.writeHead(upstream.status, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        return res.end(JSON.stringify({ error: text }));
      }
      const data = JSON.parse(text);
      const result = data?.content?.[0]?.text?.trim();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(JSON.stringify({ content: result }));
    } catch (err) {
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
};

http.createServer(handler).listen(PORT, () => {
  console.log(`Claude proxy listening on http://localhost:${PORT}/api/claude`);
});
