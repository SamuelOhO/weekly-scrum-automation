type OcrParams = {
  dataUrl: string;
  filename?: string;
  model?: string;
};

export const runOcr = async ({ dataUrl, filename = "document.pdf", model = "ocr" }: OcrParams) => {
  const response = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, filename, model }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR 요청 실패: ${response.status} ${errorText}`);
  }

  return response.json();
};
