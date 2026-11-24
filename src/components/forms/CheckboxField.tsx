import { useId, type InputHTMLAttributes } from 'react';

interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  /** Visible label associated with the native checkbox. */
  label: string;
  /** Optional help text linked through `aria-describedby`. */
  description?: string;
  /** Explicit id for the checkbox; a generated one is used otherwise. */
  id?: string;
}

/**
 * Accessible checkbox presented as a card. The native input keeps its own
 * label association and, when provided, the description is exposed through
 * `aria-describedby` without becoming part of the accessible name.
 */
export function CheckboxField({
  id,
  label,
  description,
  className,
  disabled,
  ...inputProps
}: CheckboxFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div
      className={[
        'flex min-w-0 items-start gap-3 rounded-lg border border-slate-300 bg-slate-50 p-3 transition-colors',
        'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-slate-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        id={inputId}
        type="checkbox"
        disabled={disabled}
        aria-describedby={descriptionId}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        {...inputProps}
      />
      <div className="min-w-0">
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-slate-900 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-xs text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
