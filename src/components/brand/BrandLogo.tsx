import type { CSSProperties } from 'react';

const LOGO_ASPECT_RATIO = 382 / 322;

const MASK_STYLE: CSSProperties = {
  // Preserve the original asset for existing surfaces; the header selects
  // a silhouette extracted from the same paths without its outer rectangle.
  WebkitMaskImage: "url('/mundoportatil.svg')",
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskImage: "url('/mundoportatil.svg')",
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
  maskSize: 'contain',
};

interface BrandLogoProps {
  /** Visual height in pixels; the width keeps the original SVG proportion. */
  height?: number;
  /** Transparent silhouette for the application header; preserves the original vector geometry. */
  variant?: 'original' | 'mark';
  /** Use `white` on dark surfaces and `brand` on light surfaces. */
  tone?: 'brand' | 'white';
  className?: string;
  /** When provided the logo becomes an image with an accessible name. */
  label?: string;
}

/**
 * Recolors the original vector geometry through CSS masks. The transparent
 * mark variant removes the surrounding rectangle without changing the logo.
 */
export function BrandLogo({
  height = 32,
  variant = 'original',
  tone = 'brand',
  className = '',
  label,
}: BrandLogoProps) {
  const width = Math.round(height * LOGO_ASPECT_RATIO);
  const markStyle = variant === 'mark' ? { ...MASK_STYLE, WebkitMaskImage: "url('/mundoportatil-mark.svg')", maskImage: "url('/mundoportatil-mark.svg')" } : MASK_STYLE;
  const circleClass = tone === 'white' ? 'bg-white' : 'bg-brand-600';
  const letteringClass = tone === 'white' ? 'bg-brand-950' : 'bg-white';

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width, height }}
    >
      {variant === 'original' && <span aria-hidden="true" className={`absolute inset-0 ${letteringClass}`} style={MASK_STYLE} />}
      <span aria-hidden="true" className={`absolute inset-0 ${circleClass}`} style={markStyle} />
    </span>
  );
}
