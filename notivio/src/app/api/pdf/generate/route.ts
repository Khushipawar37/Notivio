// app/api/pdf/generate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { generatePdf } from "../../../lib/pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json();

    if (!notes) {
      return NextResponse.json({ error: "Notes data is required" }, { status: 400 });
    }

    const pdfBuffer = await generatePdf(notes);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(notes.title || "document")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
