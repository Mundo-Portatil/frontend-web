/** POST /inventory/barcode-labels/by-model, confirmed against refact/inventario. */
export interface ModelBarcodeLabelsInput {
  catalogId: string;
  copies: number;
  locationId?: string;
}
export interface ModelBarcodeLabel {
  catalogId: string;
  barcodeValue: string;
  title: string;
  specsSummary: string;
  locationName: string;
  price: number | null;
  copyNumber: number;
  totalCopies: number;
}
