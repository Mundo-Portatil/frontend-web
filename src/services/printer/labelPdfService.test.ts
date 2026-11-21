import { describe, expect, it, vi } from 'vitest';
import { buildLabelsPdf, downloadLabelsPdf, openLabelsPdf } from './labelPdfService';

describe('labelPdfService', () => {
  const mockLabels = [
    {
      barcodeValue: 'LAP-001',
      title: 'Acer Aspire 5',
      specsSummary: 'Core i5 · 16GB',
      price: 2400,
    },
    {
      barcodeValue: 'SN-998877',
      title: 'Logitech M170',
      specsSummary: 'Óptico Wireless',
      price: 45,
    },
  ];

  it('builds a jsPDF instance with labels grid', () => {
    const doc = buildLabelsPdf(mockLabels);
    expect(doc).toBeDefined();
    expect(typeof doc.output).toBe('function');
  });

  it('downloads pdf using save method', () => {
    const saveSpy = vi.fn();
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    // Build and mock doc.save
    const doc = buildLabelsPdf(mockLabels);
    vi.spyOn(doc, 'save').mockImplementation(saveSpy);

    downloadLabelsPdf(mockLabels, 'mis-etiquetas.pdf');
    // Ensure no throw on empty
    downloadLabelsPdf([]);
  });

  it('opens pdf in a new tab via window.open', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    openLabelsPdf(mockLabels);
    expect(openSpy).toHaveBeenCalledWith('blob:mock-url', '_blank');

    openSpy.mockClear();
    openLabelsPdf([]);
    expect(openSpy).not.toHaveBeenCalled();
  });
});
