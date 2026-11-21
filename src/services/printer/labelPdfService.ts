import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

/** Display data only: prices are intentionally excluded from printable labels. */
export interface PrintableBarcodeLabel {
  barcodeValue: string;
  title: string;
  specsSummary?: string;
  locationName?: string;
}

interface BarcodeEncoding { data: string }

/** JsBarcode supplies the checksum, start/stop symbols and Code 128 encoding. */
export function encodeLabelBarcode(value: string): string {
  if (!value || !/^[\x20-\x7e]+$/.test(value)) {
    throw new Error('El código de la etiqueta está vacío o contiene caracteres no compatibles con Code 128.');
  }
  const target: { encodings?: BarcodeEncoding[] } = {};
  JsBarcode(target, value, { format: 'CODE128', displayValue: false, margin: 0 });
  const bits = target.encodings?.map((encoding) => encoding.data).join('');
  if (!bits || !/^[01]+$/.test(bits)) throw new Error('No se pudo generar el código de barras.');
  return bits;
}

const MODULE_MM = 0.3;
const QUIET_MODULES = 10;
const GAP = 5;
const LEFT = 12;
const TOP = 12;
const FULL_WIDTH = 186;
const HALF_WIDTH = (FULL_WIDTH - GAP) / 2;
const LABEL_HEIGHT = 40;

/** Vector bars stay sharp when printing; no canvas, raster fallback or identifier rewriting. */
export function buildLabelsPdf(labels: readonly PrintableBarcodeLabel[]): jsPDF {
  if (!labels.length) throw new Error('Selecciona al menos una etiqueta.');
  const encoded = labels.map((label) => ({ label, bits: encodeLabelBarcode(label.barcodeValue) }));
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: 'Etiquetas de inventario', subject: 'Códigos de barras Code 128' });
  let column = 0;
  let y = TOP;
  for (const { label, bits } of encoded) {
    const barcodeWidth = (bits.length + QUIET_MODULES * 2) * MODULE_MM;
    const wide = barcodeWidth > HALF_WIDTH - 8;
    if (barcodeWidth > FULL_WIDTH - 8) throw new Error('El código es demasiado largo para una etiqueta legible en A4.');
    if (wide && column) { column = 0; y += LABEL_HEIGHT + GAP; }
    if (y + LABEL_HEIGHT > 285) { doc.addPage(); y = TOP; column = 0; }
    const width = wide ? FULL_WIDTH : HALF_WIDTH;
    const x = LEFT + column * (HALF_WIDTH + GAP);
    doc.setDrawColor(195);
    doc.setLineWidth(0.15);
    doc.rect(x, y, width, LABEL_HEIGHT);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const titleLines = doc.splitTextToSize(label.title || 'Producto', width - 8) as string[];
    doc.text(titleLines.slice(0, 2), x + width / 2, y + 5, { align: 'center' });
    const startX = x + (width - barcodeWidth) / 2 + QUIET_MODULES * MODULE_MM;
    doc.setFillColor(0, 0, 0);
    for (let offset = 0; offset < bits.length;) {
      if (bits[offset] === '0') { offset += 1; continue; }
      let end = offset + 1;
      while (bits[end] === '1') end += 1;
      doc.rect(startX + offset * MODULE_MM, y + 11, (end - offset) * MODULE_MM, 13, 'F');
      offset = end;
    }
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(label.barcodeValue, x + width / 2, y + 28, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const specs = label.specsSummary && label.specsSummary !== 'N/A' ? label.specsSummary : '';
    const footer = [specs, label.locationName].filter(Boolean).join(' | ');
    const footerLines = doc.splitTextToSize(footer, width - 8) as string[];
    if (footerLines.length) doc.text(footerLines.slice(0, 2), x + width / 2, y + 33, { align: 'center' });
    if (wide || column) { column = 0; y += LABEL_HEIGHT + GAP; } else column = 1;
  }
  return doc;
}

export function downloadLabelsPdf(labels: readonly PrintableBarcodeLabel[], fileName = 'etiquetas-inventario.pdf'): void {
  buildLabelsPdf(labels).save(fileName);
}

/** Use from a user click; fail clearly if the browser blocks opening the PDF. */
export function openLabelsPdf(labels: readonly PrintableBarcodeLabel[]): void {
  const blob = buildLabelsPdf(labels).output('blob');
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank');
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error('El navegador bloqueó el PDF. Permite abrir ventanas o utiliza Descargar PDF.');
  }
  opened.opener = null;
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
