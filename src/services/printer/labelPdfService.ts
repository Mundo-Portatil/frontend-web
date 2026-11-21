import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import type { BarcodeLabelItem } from '../../modules/inventory/hardwareModels';

export interface LabelPdfOptions {
  fileName?: string;
}

/**
 * Generates an image data URL for a Code 128 barcode using an offscreen canvas.
 */
export function generateBarcodeDataUrl(value: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, {
      format: 'CODE128',
      displayValue: false,
      margin: 2,
      width: 2,
      height: 40,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Builds a clean, ready-to-print PDF containing strictly 1D barcode labels
 * in a grid without any browser or web navigation chrome.
 *
 * Each label displays:
 * - Brand + Model (title)
 * - 1D Code 128 Barcode
 * - Barcode Value (readable text)
 * - Price in PEN (S/)
 */
export function buildLabelsPdf(labels: BarcodeLabelItem[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const marginY = 12;
  const cols = 3;
  const rows = 7;
  const labelsPerPage = cols * rows;

  const colWidth = (pageWidth - marginX * 2 - (cols - 1) * 4) / cols; // ~58mm
  const rowHeight = (pageHeight - marginY * 2 - (rows - 1) * 4) / rows; // ~35mm

  labels.forEach((label, index) => {
    if (index > 0 && index % labelsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = index % labelsPerPage;
    const col = pageIndex % cols;
    const row = Math.floor(pageIndex / cols);

    const x = marginX + col * (colWidth + 4);
    const y = marginY + row * (rowHeight + 4);

    // Label border box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, colWidth, rowHeight, 1.5, 1.5);

    // Title (Brand + Model)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59); // slate-800
    const cleanTitle = (label.title || 'Producto').trim();
    const truncatedTitle = cleanTitle.length > 28 ? `${cleanTitle.slice(0, 26)}…` : cleanTitle;
    doc.text(truncatedTitle, x + colWidth / 2, y + 5, { align: 'center' });

    // Barcode image
    const barcodeDataUrl = generateBarcodeDataUrl(label.barcodeValue);
    if (barcodeDataUrl) {
      try {
        const barcodeWidth = colWidth - 8;
        const barcodeHeight = 13;
        doc.addImage(
          barcodeDataUrl,
          'PNG',
          x + 4,
          y + 7,
          barcodeWidth,
          barcodeHeight,
        );
      } catch {
        // Fallback placeholder text if image embedding fails in JSDOM
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.text(`* ${label.barcodeValue} *`, x + colWidth / 2, y + 14, { align: 'center' });
      }
    } else {
      // Fallback text
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text(`* ${label.barcodeValue} *`, x + colWidth / 2, y + 14, { align: 'center' });
    }

    // Barcode value (human-readable text below barcode)
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(label.barcodeValue, x + colWidth / 2, y + 23, { align: 'center' });

    // Price
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // slate-900
    const priceText = label.price !== undefined ? `S/ ${Number(label.price).toFixed(2)}` : 'S/ --';
    doc.text(priceText, x + colWidth / 2, y + 29, { align: 'center' });
  });

  return doc;
}

/**
 * Opens the generated PDF directly in a new browser tab for immediate printing.
 */
export function openLabelsPdf(labels: BarcodeLabelItem[]): void {
  if (labels.length === 0) return;
  const doc = buildLabelsPdf(labels);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Downloads the generated PDF to the user's computer.
 */
export function downloadLabelsPdf(labels: BarcodeLabelItem[], fileName = 'etiquetas-1d.pdf'): void {
  if (labels.length === 0) return;
  const doc = buildLabelsPdf(labels);
  doc.save(fileName);
}
