import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import type { AppError } from '../../../../services/api/errors';
import { Notification } from '../../../../components/notifications/Notification';
import { InlineSpinner } from '../../../../components/feedback/InlineSpinner';
import { BrandLogo } from '../../../../components/brand/BrandLogo';
import { isValidEmail } from '../../../../utils/validation';

const OPERATIVE_ROUTE = '/locations';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (email.trim() === '') {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!isValidEmail(email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (password === '') {
    errors.password = 'La contraseña es obligatoria.';
  }

  return errors;
}

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-slate-700';

const TEXT_INPUT_CLASS =
  'w-full rounded-lg border bg-white py-2.5 text-base text-slate-900 placeholder:text-slate-400 sm:text-sm ' +
  'transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

const INVALID_INPUT_CLASS =
  'border-red-400 focus:border-red-500 focus:ring-red-500/25';

const VALID_INPUT_CLASS =
  'border-slate-300 focus:border-brand-600 focus:ring-brand-600/20';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<AppError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const errors = validateFields(email, password);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(null);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const result = await login({ email: email.trim(), password });

    if (result.success) {
      navigate(OPERATIVE_ROUTE, { replace: true });
      return;
    }

    setIsSubmitting(false);
    if (result.error) {
      setFormError(result.error);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <section className="w-full max-w-[430px] rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <header className="mb-8 flex flex-col items-center text-center">
          <BrandLogo height={44} tone="brand" />
          <p className="mt-4 text-sm font-semibold tracking-tight text-slate-900">
            Mundo Portátil
          </p>
          <h1 className="mt-6 text-xl font-semibold text-slate-900">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Accede con tus credenciales corporativas.
          </p>
        </header>

        {formError && (
          <div className="mb-5"><Notification kind="error">{formError.message}</Notification></div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className={LABEL_CLASS}>
              Correo electrónico
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
                className={`${TEXT_INPUT_CLASS} pl-10 pr-3 ${fieldErrors.email ? INVALID_INPUT_CLASS : VALID_INPUT_CLASS}`}
              />
            </div>
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className={LABEL_CLASS}>
              Contraseña
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                disabled={isSubmitting}
                className={`${TEXT_INPUT_CLASS} pl-10 pr-11 ${fieldErrors.password ? INVALID_INPUT_CLASS : VALID_INPUT_CLASS}`}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={isPasswordVisible}
                aria-controls="password"
                className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  {isPasswordVisible ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.584 10.587a2 2 0 0 0 2.828 2.828" />
                      <path d="M9.363 5.365A9.466 9.466 0 0 1 12 5.5c4.638 0 8.573 2.997 9.963 7.178.07.207.07.431 0 .639a10.3 10.3 0 0 1-1.797 2.878" />
                      <path d="M6.228 6.228A10.3 10.3 0 0 0 2.037 11.678a1.012 1.012 0 0 0 0 .639C3.423 16.49 7.36 19.5 12 19.5c1.03 0 2.024-.147 2.96-.42" />
                    </>
                  ) : (
                    <>
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-brand-800"
          >
            {isSubmitting && <InlineSpinner />}
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  );
}
