import { describe, expect, it, vi } from 'vitest';
import { createHidScanner } from './hidScanner';
function event(key: string, time: number, target?: HTMLElement) { return { key, timeStamp: time, target, ctrlKey: false, altKey: false, metaKey: false, repeat: false } as unknown as KeyboardEvent; }
describe('HID scanner', () => {
  it('emits a rapid code once per scan and ignores immediate duplicates', () => { const emit = vi.fn(); const scan = createHidScanner(emit); ['A', 'B', 'Enter', 'A', 'B', 'Enter'].forEach((key, i) => scan(event(key, i * 10))); expect(emit).toHaveBeenCalledExactlyOnceWith('AB'); });
  it('does not emit stale Enter or editable input and resets navigation', () => { const emit = vi.fn(); const scan = createHidScanner(emit); scan(event('A', 1)); scan(event('Enter', 1000)); scan(event('B', 1010)); scan(event('Tab', 1020)); scan(event('Enter', 1030)); const input = document.createElement('input'); scan(event('A', 1040, input)); scan(event('Enter', 1050, input)); expect(emit).not.toHaveBeenCalled(); });
});
