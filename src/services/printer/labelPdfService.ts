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

const MODULE_MM = 0.254;
const QUIET_MODULES = 10;
const GAP_MM = 4;
const MARGIN_MM = 8;

export interface LabelPdfOptions {
  /** A4 sheets for cutting; these are not thermal-printer media settings. */
  layout?: 'compact' | 'small';
}

export const LABEL_PDF_LAYOUTS = {
  compact: { widthMm: 93, heightMm: 30 },
  small: { widthMm: 62, heightMm: 30 },
} as const;

/** Fixed physical modules preserve scanning: never stretch bars to fill a label. */
export function buildLabelsPdf(labels: readonly PrintableBarcodeLabel[], options: LabelPdfOptions = {}): jsPDF {
  if (!labels.length) throw new Error('Selecciona al menos una etiqueta.');
  const layout = LABEL_PDF_LAYOUTS[options.layout ?? 'compact'];
  const encoded = labels.map((label) => {
    const bits = encodeLabelBarcode(label.barcodeValue);
    const barcodeWidth = (bits.length + QUIET_MODULES * 2) * MODULE_MM;
    if (barcodeWidth > layout.widthMm - 4) {
      throw new Error(options.layout === 'small'
        ? 'El código no cabe en la etiqueta pequeña sin perder legibilidad. Elige el formato compacto.'
        : 'El código es demasiado largo para este formato de etiqueta. Se requiere un formato de mayor ancho.');
    }
    return { label, bits, barcodeWidth };
  });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: 'Etiquetas de inventario', subject: 'Códigos de barras Code 128' });
  const columns = Math.floor((210 - MARGIN_MM * 2 + GAP_MM) / (layout.widthMm + GAP_MM));
  const rows = Math.floor((297 - MARGIN_MM * 2 + GAP_MM) / (layout.heightMm + GAP_MM));
  const perPage = columns * rows;
  encoded.forEach(({ label, bits, barcodeWidth }, index) => {
    if (index > 0 && index % perPage === 0) doc.addPage();
    const position = index % perPage;
    const x = MARGIN_MM + (position % columns) * (layout.widthMm + GAP_MM);
    const y = MARGIN_MM + Math.floor(position / columns) * (layout.heightMm + GAP_MM);
    doc.setDrawColor(195);
    doc.setLineWidth(0.15);
    doc.rect(x, y, layout.widthMm, layout.heightMm);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const titleLines = doc.splitTextToSize(label.title || 'Producto', layout.widthMm - 4) as string[];
    doc.text(titleLines.slice(0, 2), x + layout.widthMm / 2, y + 4, { align: 'center' });
    const startX = x + (layout.widthMm - barcodeWidth) / 2 + QUIET_MODULES * MODULE_MM;
    doc.setFillColor(0, 0, 0);
    for (let offset = 0; offset < bits.length;) {
      if (bits[offset] === '0') { offset += 1; continue; }
      let end = offset + 1;
      while (bits[end] === '1') end += 1;
      doc.rect(startX + offset * MODULE_MM, y + 9, (end - offset) * MODULE_MM, 12, 'F');
      offset = end;
    }
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(label.barcodeValue, x + layout.widthMm / 2, y + 26, { align: 'center' });
  });
  return doc;
}

/** The same PDF bytes are previewed, downloaded and opened for printing. */
export function createLabelsPdfBlob(labels: readonly PrintableBarcodeLabel[], options: LabelPdfOptions = {}): Blob {
  return buildLabelsPdf(labels, options).output('blob');
}

export function downloadLabelsPdf(labels: readonly PrintableBarcodeLabel[], fileName = 'etiquetas-inventario.pdf', options: LabelPdfOptions = {}): void {
  buildLabelsPdf(labels, options).save(fileName);
}

/** Use from a user click; fail clearly if the browser blocks opening the PDF. */
export function openLabelsPdf(labels: readonly PrintableBarcodeLabel[], options: LabelPdfOptions = {}): void {
  const blob = buildLabelsPdf(labels, options).output('blob');
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank');
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error('El navegador bloqueó el PDF. Permite abrir ventanas o utiliza Descargar PDF.');
  }
  opened.opener = null;
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
