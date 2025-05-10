import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json()

    if (!notes) {
      return NextResponse.json({ error: "Notes data is required" }, { status: 400 })
    }

    // Create a PDF document
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    // Collect PDF data chunks
    doc.on("data", (chunk) => chunks.push(chunk))

    // Add content to PDF
    doc.fontSize(24).text(notes.title, { align: "center" })
    doc.moveDown()

    // Add summary
    if (notes.summary) {
      doc.fontSize(14).text("Summary", { underline: true })
      doc.fontSize(12).text(notes.summary)
      doc.moveDown()
    }

    // Add sections
    notes.sections.forEach((section: any) => {
      doc.fontSize(16).text(section.title, { underline: true })
      doc.moveDown(0.5)

      section.content.forEach((point: string) => {
        doc.fontSize(12).text(`• ${point}`)
        doc.moveDown(0.5)
      })

      // Add subsections if they exist
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((subsection: any) => {
          doc.fontSize(14).text(subsection.title, { indent: 20 })
          doc.moveDown(0.5)

          subsection.content.forEach((point: string) => {
            doc.fontSize(12).text(`  ◦ ${point}`, { indent: 20 })
            doc.moveDown(0.5)
          })
        })
      }

      doc.moveDown()
    })

    // Finalize the PDF
    doc.end()

    // Combine chunks into a single buffer
    const pdfBuffer = Buffer.concat(chunks)

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(notes.title)}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating PDF:", error)

    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}
