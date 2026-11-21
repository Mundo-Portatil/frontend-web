export type ItemStatus = 'EN_STOCK' | 'VENDIDO' | 'SEGUNDA_MANO_PENDIENTE' | 'EN_GARANTIA' | 'DE_BAJA';
export interface HardwareItem {
  id: string; serialNumber: string; catalogId: string; catalogName?: string; catalogSku?: string;
  locationId: string; locationName?: string; status: ItemStatus; parentChassisId: string | null;
  costPrice: number | null; salePrice: number | null; isSecondHand?: boolean; createdAt: string; updatedAt: string;
  components?: HardwareItem[]; parentChassis?: HardwareItem | null;
}
export interface SerialValidation { existingSerials: string[]; allValid: boolean }
export interface BarcodeLabel { hardwareItemId: string; barcodeValue: string; title: string; specsSummary: string; locationName: string; price: number | null }
