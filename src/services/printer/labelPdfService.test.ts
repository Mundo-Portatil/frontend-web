import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLabelsPdf, createLabelsPreviewPages, printLabelSheets, createLabelsPdfBlob, downloadLabelsPdf, encodeLabelBarcode, openLabelsPdf } from './labelPdfService';

const label = { barcodeValue: 'SN-1234', title: 'Acer Aspire', locationName: 'Almacén Central', price: 9876 };
afterEach(() => vi.restoreAllMocks());
describe('printable inventory labels', () => {
  it('encodes real Code 128 data and rejects missing or unsupported identifiers', () => {
    expect(encodeLabelBarcode('SN-1234')).toMatch(/^[01]+$/);
    expect(encodeLabelBarcode('SN-1234')).not.toBe(encodeLabelBarcode('SN-1235'));
    expect(() => encodeLabelBarcode('')).toThrow(/vacío/);
    expect(() => encodeLabelBarcode('SERIE-💻')).toThrow(/compatibles/);
    expect(() => buildLabelsPdf([])).toThrow(/Selecciona/);
  });
  it('builds real multi-page PDFs with bars and exact readable codes, omitting price', () => {
    const doc = buildLabelsPdf(Array.from({ length: 17 }, (_, i) => ({ ...label, barcodeValue: `SN-${i}` })));
    expect(doc.getNumberOfPages()).toBe(2);
    expect(new TextDecoder().decode(doc.output('arraybuffer'))).toMatch(/^%PDF-/);
    const content = (doc.internal as unknown as { pages: string[][] }).pages.flat().join('\n');
    expect(content).toContain('(SN-0) Tj');
    expect(content).toContain('(SN-16) Tj');
    expect(content).toContain(' re');
    expect(content).not.toContain('9876');
    expect(content).not.toContain('Central');
    expect(() => downloadLabelsPdf([])).toThrow(/Selecciona/);
  });
  it('fits long codes without shrinking narrow bars and rejects codes too long for A4', () => {
    expect(buildLabelsPdf([{ ...label, barcodeValue: 'SDD-CLOSE-1795144709524-QTY' }]).getNumberOfPages()).toBe(1);
    expect(() => buildLabelsPdf([{ ...label, barcodeValue: 'A'.repeat(90) }])).toThrow(/demasiado largo/);
    expect(() => buildLabelsPdf([{ ...label, barcodeValue: 'SDD-CLOSE-1795144709524-QTY' }], { layout: 'small' })).toThrow(/formato compacto/);
    expect(buildLabelsPdf(Array.from({ length: 24 }, () => label), { layout: 'small' }).getNumberOfPages()).toBe(1);
  });
  it('creates the same printable PDF as a blob for preview and later download', () => {
    const blob = createLabelsPdfBlob([label], { layout: 'compact' });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });
  it('opens a generated PDF and reports popup blocking instead of silent success', () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:labels'), revokeObjectURL: vi.fn() });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    expect(() => openLabelsPdf([label])).toThrow(/bloqueó/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:labels');
    open.mockReturnValue({ opener: window } as Window);
    vi.spyOn(window, 'setTimeout').mockReturnValue(1);
    openLabelsPdf([label]);
    expect(open).toHaveBeenCalledWith('blob:labels', '_blank');
    vi.unstubAllGlobals();
  });
});


it('shares physical barcode positions with preview sheets and escapes label text', () => {
  const labels = [{ ...label, title: '<img onerror="attack"> & Laptop' }, { ...label, barcodeValue: 'SN-5678' }];
  const sheets = createLabelsPreviewPages(labels);
  expect(sheets).toHaveLength(1);
  expect(sheets[0]).toContain('viewBox="0 0 210 46"');
  expect(sheets[0]).toContain('x="105" y="8" width="93" height="30"');
  expect(sheets[0]).toContain('SN-1234');
  expect(sheets[0]).toContain('SN-5678');
  expect(sheets[0]).toContain('&lt;img');
  expect(sheets[0]).not.toContain('<img');
  expect(sheets[0]).not.toContain('9876');
  expect(createLabelsPreviewPages(Array.from({ length: 17 }, () => label))).toHaveLength(2);
  expect(createLabelsPreviewPages([label], { layout: 'small' })[0]).toContain('width="62" height="30"');
  expect(() => createLabelsPreviewPages([{ ...label, barcodeValue: 'A'.repeat(90) }])).toThrow(/demasiado largo/);
});

it('prints the preview sheets through the native browser with A4 sizing', async () => {
  let onLoad!: () => void;
  const opened = { opener: window, closed: false, focus: vi.fn(), print: vi.fn(), addEventListener: vi.fn((_type: string, callback: () => void) => { onLoad = callback; }), document: { open: vi.fn(), write: vi.fn(), close: vi.fn(), images: [{ complete: true, naturalWidth: 200 }], body: { textContent: '' } } };
  vi.spyOn(window, 'open').mockReturnValue(opened as unknown as Window);
  const sheets = createLabelsPreviewPages([label]);
  printLabelSheets(sheets);
  expect(opened.document.write).toHaveBeenCalledWith(expect.stringContaining('@page{size:A4;margin:0}'));
  expect(opened.document.write).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(sheets[0])));
  expect(opened.print).not.toHaveBeenCalled();
  expect(opened.document.open.mock.invocationCallOrder[0]).toBeLessThan(opened.addEventListener.mock.invocationCallOrder[0]);
  onLoad();
  await vi.waitFor(() => expect(opened.print).toHaveBeenCalledOnce());
  expect(opened.opener).toBeNull();
});

it('reports blocked printing and does not print when sheet images fail', async () => {
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  expect(() => printLabelSheets(createLabelsPreviewPages([label]))).toThrow(/bloqueó/);
  expect(() => printLabelSheets([])).toThrow(/Selecciona/);
  let onLoad!: () => void;
  const opened = { opener: window, closed: false, focus: vi.fn(), print: vi.fn(), addEventListener: vi.fn((_type: string, callback: () => void) => { onLoad = callback; }), document: { open: vi.fn(), write: vi.fn(), close: vi.fn(), images: [{ complete: true, naturalWidth: 0 }], body: { textContent: '' } } };
  open.mockReturnValue(opened as unknown as Window);
  printLabelSheets(createLabelsPreviewPages([label])); onLoad();
  await vi.waitFor(() => expect(opened.document.body.textContent).toContain('No se pudieron cargar'));
  expect(opened.print).not.toHaveBeenCalled();
});
