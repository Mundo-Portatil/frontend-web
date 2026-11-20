let nextDraftId = 0;
export interface DraftHardware { draftId: number; catalogId: string; serialNumber: string; costPrice: string; salePrice: string; children: DraftHardware[] }
export const newDraft = (): DraftHardware => ({ draftId: ++nextDraftId, catalogId: '', serialNumber: '', costPrice: '', salePrice: '', children: [] });
