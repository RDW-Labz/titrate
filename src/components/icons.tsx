type IconProps = { className?: string };

function S({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-[22px] ${className ?? ""}`}
    >
      {children}
    </svg>
  );
}

/** Today */
export function HomeIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M3.8 10.4 12 3.6l8.2 6.8v8.5c0 .8-.6 1.4-1.4 1.4H5.2c-.8 0-1.4-.6-1.4-1.4z" />
      <path d="M9.5 20.3v-5.2h5v5.2" />
    </S>
  );
}

/** Peptides — a capped vial */
export function VialIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M9.4 2.8h5.2v2.6H9.4z" />
      <path d="M8.5 5.4h7v12.1a3.5 3.5 0 0 1-7 0z" />
      <path d="M8.5 11.6h7" />
      <path d="M7 21.2h10" />
    </S>
  );
}

/** Calc — a syringe (reconstitution) */
export function SyringeIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M9.6 3.4h4.8" />
      <path d="M12 3.4v3" />
      <rect x="8.4" y="6.4" width="7.2" height="10.2" rx="1.4" />
      <path d="M8.4 9.6h2.4" />
      <path d="M8.4 12.6h2.4" />
      <path d="M12 16.6v4" />
    </S>
  );
}

/** Food */
export function ForkIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M8 3v6.2a2.2 2.2 0 0 0 4.4 0V3" />
      <path d="M10.2 3v6.2" />
      <path d="M10.2 11.4V21" />
      <path d="M17.4 3c-1.6 1.6-2.3 3.7-2.3 5.8 0 1.8.8 3 2.3 3.5V21" />
    </S>
  );
}

/** Library */
export function BookIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M4 5.6A2.6 2.6 0 0 1 6.6 3H20v14H6.6A2.6 2.6 0 0 0 4 19.6z" />
      <path d="M4 19.6A2.6 2.6 0 0 1 6.6 17H20v4H6.6A2.6 2.6 0 0 1 4 19.6z" />
    </S>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </S>
  );
}
