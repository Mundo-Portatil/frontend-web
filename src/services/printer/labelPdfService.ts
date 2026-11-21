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

interface LabelDrawing {
  x: number;
  y: number;
  width: number;
  height: number;
  titleLines: string[];
  code: string;
  bars: { x: number; width: number }[];
}
interface LabelSheet { labels: LabelDrawing[]; usedHeight: number }

/** A shared physical drawing plan keeps PDF, preview and browser printing aligned. */
function planLabelSheets(labels: readonly PrintableBarcodeLabel[], options: LabelPdfOptions): LabelSheet[] {
  if (!labels.length) throw new Error('Selecciona al menos una etiqueta.');
  const layout = LABEL_PDF_LAYOUTS[options.layout ?? 'compact'];
  const columns = Math.floor((210 - MARGIN_MM * 2 + GAP_MM) / (layout.widthMm + GAP_MM));
  const rows = Math.floor((297 - MARGIN_MM * 2 + GAP_MM) / (layout.heightMm + GAP_MM));
  const perPage = columns * rows;
  const measure = new jsPDF({ unit: 'mm' });
  measure.setFont('helvetica', 'bold');
  measure.setFontSize(8);
  const sheets: LabelSheet[] = [];
  labels.forEach((label, index) => {
    const bits = encodeLabelBarcode(label.barcodeValue);
    const barcodeWidth = (bits.length + QUIET_MODULES * 2) * MODULE_MM;
    if (barcodeWidth > layout.widthMm - 4) {
      throw new Error(options.layout === 'small'
        ? 'El código no cabe en la etiqueta pequeña sin perder legibilidad. Elige el formato compacto.'
        : 'El código es demasiado largo para este formato de etiqueta. Se requiere un formato de mayor ancho.');
    }
    if (index % perPage === 0) sheets.push({ labels: [], usedHeight: 0 });
    const position = index % perPage;
    const x = MARGIN_MM + (position % columns) * (layout.widthMm + GAP_MM);
    const y = MARGIN_MM + Math.floor(position / columns) * (layout.heightMm + GAP_MM);
    const startX = x + (layout.widthMm - barcodeWidth) / 2 + QUIET_MODULES * MODULE_MM;
    const bars: LabelDrawing['bars'] = [];
    for (let offset = 0; offset < bits.length;) {
      if (bits[offset] === '0') { offset += 1; continue; }
      let end = offset + 1;
      while (bits[end] === '1') end += 1;
      bars.push({ x: startX + offset * MODULE_MM, width: (end - offset) * MODULE_MM });
      offset = end;
    }
    const sheet = sheets[sheets.length - 1];
    sheet.labels.push({ x, y, width: layout.widthMm, height: layout.heightMm, titleLines: (measure.splitTextToSize(label.title || 'Producto', layout.widthMm - 4) as string[]).slice(0, 2), code: label.barcodeValue, bars });
    sheet.usedHeight = y + layout.heightMm + MARGIN_MM;
  });
  return sheets;
}

/** Fixed physical modules preserve scanning: never stretch bars to fill a label. */
export function buildLabelsPdf(labels: readonly PrintableBarcodeLabel[], options: LabelPdfOptions = {}): jsPDF {
  const sheets = planLabelSheets(labels, options);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: 'Etiquetas de inventario', subject: 'Códigos de barras Code 128' });
  sheets.forEach((sheet, index) => {
    if (index) doc.addPage();
    for (const label of sheet.labels) {
      doc.setDrawColor(195);
      doc.setLineWidth(0.15);
      doc.rect(label.x, label.y, label.width, label.height);
      doc.setTextColor(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(label.titleLines, label.x + label.width / 2, label.y + 4, { align: 'center' });
      doc.setFillColor(0, 0, 0);
      for (const bar of label.bars) doc.rect(bar.x, label.y + 9, bar.width, 12, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(label.code, label.x + label.width / 2, label.y + 26, { align: 'center' });
    }
  });
  return doc;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!);
}

/** Cropped A4 sheets remove empty preview space; coordinates remain in millimetres. */
export function createLabelsPreviewPages(labels: readonly PrintableBarcodeLabel[], options: LabelPdfOptions = {}): string[] {
  return planLabelSheets(labels, options).map((sheet) => {
    const content = sheet.labels.map((label) => {
      const title = label.titleLines.map((line, index) => `<text x="${label.x + label.width / 2}" y="${label.y + 4 + index * 8 * 1.15 * 25.4 / 72}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="bold" font-size="${8 * 25.4 / 72}" fill="#141414">${escapeXml(line)}</text>`).join('');
      const bars = label.bars.map((bar) => `<rect x="${bar.x}" y="${label.y + 9}" width="${bar.width}" height="12" fill="#000"/>`).join('');
      return `<g><rect x="${label.x}" y="${label.y}" width="${label.width}" height="${label.height}" fill="none" stroke="#c3c3c3" stroke-width="0.15"/>${title}${bars}<text x="${label.x + label.width / 2}" y="${label.y + 26}" text-anchor="middle" font-family="Courier New,Courier,monospace" font-size="${8 * 25.4 / 72}" fill="#141414">${escapeXml(label.code)}</text></g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="${sheet.usedHeight}mm" viewBox="0 0 210 ${sheet.usedHeight}"><rect width="210" height="${sheet.usedHeight}" fill="#fff"/>${content}</svg>`;
  });
}

/** Called synchronously from the preview's print button; uses the same SVG sheets. */
export function printLabelSheets(sheets: readonly string[]): void {
  if (!sheets.length) throw new Error('Selecciona al menos una etiqueta.');
  const opened = window.open('', '_blank');
  if (!opened) throw new Error('El navegador bloqueó la impresión. Permite abrir ventanas o descarga el PDF.');
  opened.opener = null;
  const images = sheets.map((sheet) => `<section><img alt="Etiquetas de inventario" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(sheet)}"/></section>`).join('');
  opened.document.open();
  opened.addEventListener('load', () => {
    const images = Array.from(opened.document.images);
    const ready = images.map((image) => new Promise<void>((resolve, reject) => {
      if (image.complete) { if (image.naturalWidth > 0) resolve(); else reject(new Error('No se pudieron cargar las etiquetas.')); }
      else { image.onload = () => resolve(); image.onerror = () => reject(new Error('No se pudieron cargar las etiquetas.')); }
    }));
    void Promise.all(ready).then(() => { if (!opened.closed) { opened.focus(); opened.print(); } }).catch(() => {
      if (!opened.closed) opened.document.body.textContent = 'No se pudieron cargar las etiquetas. Cierra esta ventana y vuelve a intentar o descarga el PDF.';
    });
  }, { once: true });
  opened.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Imprimir etiquetas</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}section{width:210mm;height:297mm;break-after:page;overflow:hidden}section:last-child{break-after:auto}img{display:block;width:210mm;height:auto}@media screen{body{background:#e2e8f0}section{margin:12px auto;background:#fff}}</style></head><body>${images}</body></html>`);
  opened.document.close();
}

/** PDF content uses the same physical drawing plan as the SVG preview. */
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
