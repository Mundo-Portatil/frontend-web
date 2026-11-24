import type { CatalogItem, HardwareItem } from '../inventory';
export interface QuantityLine { catalog: CatalogItem; quantity: number; available: number | null }
export interface TransferDraft {
  direction: 'supply' | 'return'; postId: string; serials: HardwareItem[];
  quantities: QuantityLine[]; notes: string;
}
export const emptyTransferDraft = (): TransferDraft => ({ direction: 'supply', postId: '', serials: [], quantities: [], notes: '' });
export type DraftAction =
  | { type: 'route'; direction: TransferDraft['direction']; postId: string }
  | { type: 'serial'; item: HardwareItem }
  | { type: 'quantity'; line: QuantityLine }
  | { type: 'editQuantity'; catalogId: string; quantity: number }
  | { type: 'remove'; id: string }
  | { type: 'notes'; value: string }
  | { type: 'availability'; values: Record<string, number | null> }
  | { type: 'reset' };
export function transferDraftReducer(state: TransferDraft, action: DraftAction): TransferDraft {
  switch (action.type) {
    case 'route': return { ...emptyTransferDraft(), direction: action.direction, postId: action.postId };
    case 'serial': return state.serials.some(item => item.id === action.item.id) ? state : { ...state, serials: [...state.serials, action.item] };
    case 'quantity': {
      if (action.line.catalog.isSerialized) return state;
      const existing = state.quantities.find(line => line.catalog.id === action.line.catalog.id);
      return { ...state, quantities: existing ? state.quantities.map(line => line === existing ? { ...action.line, quantity: line.quantity + action.line.quantity } : line) : [...state.quantities, action.line] };
    }
    case 'editQuantity': return { ...state, quantities: state.quantities.map(line => line.catalog.id === action.catalogId ? { ...line, quantity: action.quantity } : line) };
    case 'remove': return { ...state, serials: state.serials.filter(item => item.id !== action.id), quantities: state.quantities.filter(line => line.catalog.id !== action.id) };
    case 'availability': return { ...state, quantities: state.quantities.map(line => ({ ...line, available: action.values[line.catalog.id] ?? null })) };
    case 'notes': return { ...state, notes: action.value };
    case 'reset': return emptyTransferDraft();
  }
}
