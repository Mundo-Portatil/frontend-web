import type { CatalogItem, CreateCatalogInput } from './catalogModels';

let nextDraftId = 0;

export interface DraftBatchItem {
  draftId: number;
  isNewModel?: boolean;
  newModelData?: CreateCatalogInput;
  catalogId: string;
  catalog?: CatalogItem | null;
  quantity: number;
  hasSerialNumbers: boolean;
  serialNumbers: string[];
  costPrice: string;
  salePrice: string;
}

export const newDraftBatchItem = (): DraftBatchItem => ({
  draftId: ++nextDraftId,
  isNewModel: false,
  catalogId: '',
  catalog: null,
  quantity: 1,
  hasSerialNumbers: true,
  serialNumbers: [''],
  costPrice: '',
  salePrice: '',
});

export type DraftHardware = DraftBatchItem;
export const newDraft = newDraftBatchItem;
