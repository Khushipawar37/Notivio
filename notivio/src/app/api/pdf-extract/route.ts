import { NextRequest, NextResponse } from "next/server";

const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();
    const file = incoming.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    // OCR.space free key can be used for testing, and users can override with env.
    const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
    const runOCR = async (engine: "1" | "2") => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("isTable", "false");
      formData.append("OCREngine", engine);
      formData.append("scale", "true");
      formData.append("detectOrientation", "true");
      formData.append("isCreateSearchablePdf", "false");

      const response = await fetch(OCR_SPACE_URL, {
        method: "POST",
        headers: { apikey: apiKey },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "OCR service error");
      }
      const data = await response.json();
      const parsedResults = Array.isArray(data?.ParsedResults) ? data.ParsedResults : [];
      return parsedResults
        .map((entry: { ParsedText?: string }) => String(entry?.ParsedText || "").trim())
        .filter(Boolean)
        .join("\n\n");
    };

    let text = "";
    try {
      text = await runOCR("2");
    } catch {
      text = "";
    }
    if (!text || text.replace(/\s+/g, "").length < 80) {
      try {
        text = await runOCR("1");
      } catch {
        text = "";
      }
    }

    if (!text) {
      return NextResponse.json({ error: "No text extracted from PDF" }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("PDF extract route error:", error);
    return NextResponse.json({ error: "Failed to extract PDF text" }, { status: 500 });
  }
}
