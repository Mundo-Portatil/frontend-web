/** Make an unfamiliar identifier readable without guessing or translating its meaning. */
export function humanizeIdentifier(value: string, emptyLabel: string): string {
  const words = value.trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_\s-]+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
  return words ? words[0].toLocaleUpperCase('es') + words.slice(1) : emptyLabel;
}
