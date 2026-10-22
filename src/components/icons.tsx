type IconProps = { className?: string };

const base = "size-[22px]";

function S({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className ?? ""}`}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8" />
      <path d="M10 20v-5h4v5" />
    </S>
  );
}

export function VialIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M9 3h6" />
      <path d="M10 3v13a2 2 0 0 0 4 0V3" />
      <path d="M10 10h4" />
      <path d="M8 21h8" />
    </S>
  );
}

export function CalcIcon(p: IconProps) {
  return (
    <S {...p}>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M8.5 7.5h7" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
    </S>
  );
}

export function ForkIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M7 3v7a2.5 2.5 0 0 0 5 0V3" />
      <path d="M9.5 12.5V21" />
      <path d="M16.5 3c-1.4 1.6-2 3.6-2 5.6 0 1.7.7 2.9 2 3.4V21" />
    </S>
  );
}

export function BookIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19v5H6.5A2.5 2.5 0 0 1 4 18.5z" />
    </S>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <S {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </S>
  );
}
