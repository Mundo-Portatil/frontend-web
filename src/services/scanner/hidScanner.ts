/** HID scanners emulate keyboard input ending in Enter. Never consumes editable controls. */
export function createHidScanner(onCode: (code: string) => void) {
  let buffer = ''; let last = 0; let previous = ''; let emittedAt = 0;
  return (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]') || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    const now = event.timeStamp;
    if (event.key === 'Enter') {
      const code = buffer; buffer = '';
      if (code && now - last <= 80 && (code !== previous || now - emittedAt > 500)) { previous = code; emittedAt = now; onCode(code); }
      return;
    }
    if (event.key.length !== 1) { buffer = ''; return; }
    if (now - last > 80) buffer = '';
    buffer += event.key; last = now;
  };
}
