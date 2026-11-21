import { useRef, type KeyboardEvent } from 'react';
import { TEXT_INPUT_CLASS } from '../../../utils/formStyles';

interface SerialNumbersInputGridProps {
  quantity: number;
  serialNumbers: string[];
  onChange: (index: number, value: string) => void;
  disabled?: boolean;
  duplicateSerials?: string[];
}

export function SerialNumbersInputGrid({
  quantity,
  serialNumbers,
  onChange,
  disabled = false,
  duplicateSerials = [],
}: SerialNumbersInputGridProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < quantity && inputsRef.current[nextIndex]) {
        inputsRef.current[nextIndex]?.focus();
      }
    }
  };

  const dupSet = new Set(duplicateSerials.map((s) => s.trim().toUpperCase()));

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h4 className="text-sm font-semibold text-slate-900">
          Números de Serie Requeridos ({quantity} unidades)
        </h4>
        <span className="text-xs text-slate-500">
          Presione Enter para avanzar automáticamente a la siguiente casilla
        </span>
      </div>

      <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: quantity }, (_, index) => {
          const value = serialNumbers[index] ?? '';
          const isDup = value.trim() !== '' && dupSet.has(value.trim().toUpperCase());

          return (
            <div key={index} className="flex items-center gap-2">
              <span className="w-8 text-right font-mono text-xs text-slate-500">#{index + 1}</span>
              <div className="relative flex-1">
                <input
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  value={value}
                  onChange={(e) => onChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={disabled}
                  placeholder={`Serie #${index + 1}…`}
                  aria-label={`Serie #${index + 1}`}
                  autoComplete="off"
                  spellCheck={false}
                  className={`${TEXT_INPUT_CLASS} pr-8 ${
                    isDup ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {value.trim() && (
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    {isDup ? (
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
