/** Wire contracts verified in backend-api refact/logistica. */
export interface Transfer {
  id: string; code: string; type: 'DIRECTO'; status: 'COMPLETED';
  fromLocationId: string; fromLocationName: string | null;
  toLocationId: string; toLocationName: string | null;
  createdById: string; createdByName: string | null;
  notes: string | null; createdAt: string; updatedAt: string; itemsCount: number;
}
export interface TransferItem {
  id: string; catalogId: string; hardwareItemId: string | null;
  serialNumber: string | null; quantity: number; sku: string | null;
  model: string | null; brand: string | null;
}
export interface TransferDetail extends Transfer { items: TransferItem[] }
export interface CreateDirectTransferInput {
  fromLocationId: string; toLocationId: string;
  hardwareItemIds?: string[];
  quantities?: { catalogId: string; quantity: number }[];
  notes?: string;
}
/** No pagination or code-search parameter exists on the list endpoint. */
export interface TransferQuery {
  fromLocationId?: string; toLocationId?: string; locationId?: string;
  startDate?: string; endDate?: string;
}
