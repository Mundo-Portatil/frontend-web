import type { SVGProps } from 'react';

/** Shared props for the inline layout icons (no icon dependency needed). */
export type LayoutIconProps = SVGProps<SVGSVGElement>;

const ICON_BASE_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function LocationsIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function UsersIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function AuditLogIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" />
      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8M8 15h5" />
    </svg>
  );
}

export function MenuIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronLeftIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function CategoriesIcon(props: LayoutIconProps) {
  return <svg {...ICON_BASE_PROPS} {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

export function TransfersIcon(props: LayoutIconProps) {
  return (
    <svg {...ICON_BASE_PROPS} {...props}>
      <path d="M7 16l-4-4 4-4" />
      <path d="M3 12h14" />
      <path d="M17 8l4 4-4 4" />
      <path d="M21 12H7" />
    </svg>
  );
}
