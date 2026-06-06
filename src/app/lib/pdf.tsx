import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function generatePdf(notes: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();

      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'LiberationSerif-Regular.ttf');
      if (!fs.existsSync(fontPath)) {
        throw new Error('Font file not found at ' + fontPath);
      }

      doc.registerFont('LiberationSerif', fontPath);
      doc.font('LiberationSerif');

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Start writing AFTER setting font
      doc.text('This is using Liberation Serif');
      doc.moveDown();

      if (notes.summary) {
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12).text(notes.summary);
        doc.moveDown();
      }

      notes.sections.forEach((section: any) => {
        doc.fontSize(16).text(section.title, { underline: true }).moveDown(0.5);
        section.content.forEach((point: string) => {
          doc.fontSize(12).text(`• ${point}`).moveDown(0.5);
        });
        if (section.subsections) {
          section.subsections.forEach((sub: any) => {
            doc.fontSize(14).text(sub.title, { indent: 20 }).moveDown(0.5);
            sub.content.forEach((point: string) => {
              doc.fontSize(12).text(`  ◦ ${point}`, { indent: 20 }).moveDown(0.5);
            });
          });
        }
        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
