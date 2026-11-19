import type { CSSProperties } from 'react';

const LOGO_ASPECT_RATIO = 382 / 322;

const MASK_STYLE: CSSProperties = {
  // The SVG alpha channel is the mark: an opaque circle with transparent
  // lettering. Masking solid layers preserves that geometry instead of
  // inverting or redrawing the logo.
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
  /** Use `white` on dark surfaces and `brand` on light surfaces. */
  tone?: 'brand' | 'white';
  className?: string;
  /** When provided the logo becomes an image with an accessible name. */
  label?: string;
}

/**
 * Renders the corporate mark through CSS masks, so the original SVG stays
 * untouched while the solid circle and its cut-out lettering can use the
 * brand palette. Two layers keep the lettering readable on any surface.
 */
export function BrandLogo({
  height = 32,
  tone = 'brand',
  className = '',
  label,
}: BrandLogoProps) {
  const width = Math.round(height * LOGO_ASPECT_RATIO);
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
      <span aria-hidden="true" className={`absolute inset-0 ${letteringClass}`} style={MASK_STYLE} />
      <span aria-hidden="true" className={`absolute inset-0 ${circleClass}`} style={MASK_STYLE} />
    </span>
  );
}
