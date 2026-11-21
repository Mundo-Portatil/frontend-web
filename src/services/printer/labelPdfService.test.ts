import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLabelsPdf, downloadLabelsPdf, encodeLabelBarcode, openLabelsPdf } from './labelPdfService';

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
    const doc = buildLabelsPdf(Array.from({ length: 15 }, (_, i) => ({ ...label, barcodeValue: `SN-${i}` })));
    expect(doc.getNumberOfPages()).toBe(2);
    expect(new TextDecoder().decode(doc.output('arraybuffer'))).toMatch(/^%PDF-/);
    const content = (doc.internal as unknown as { pages: string[][] }).pages.flat().join('\n');
    expect(content).toContain('(SN-0) Tj');
    expect(content).toContain('(SN-14) Tj');
    expect(content).toContain(' re');
    expect(content).not.toContain('9876');
    expect(() => downloadLabelsPdf([])).toThrow(/Selecciona/);
  });
  it('fits long codes without shrinking narrow bars and rejects codes too long for A4', () => {
    expect(buildLabelsPdf([{ ...label, barcodeValue: 'SDD-CLOSE-1795144709524-QTY' }]).getNumberOfPages()).toBe(1);
    expect(() => buildLabelsPdf([{ ...label, barcodeValue: 'A'.repeat(90) }])).toThrow(/demasiado largo/);
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
