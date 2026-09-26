import React from 'react';

export type ChipTone = 'default' | 'lime' | 'coral' | 'cobalt' | 'paper';

interface IconChipProps {
  icon: React.ReactNode;
  tone?: ChipTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_BG: Record<ChipTone, string> = {
  default: 'bg-[#FFFFFF] text-[#0D0D0D]',
  paper: 'bg-[#F2EFE9] text-[#0D0D0D]',
  lime: 'bg-[#D7FF3E] text-[#0D0D0D]',
  coral: 'bg-[#FF5A36] text-[#FFFFFF]',
  cobalt: 'bg-[#2B4BF2] text-[#FFFFFF]',
};

const SIZE_CLASSES = {
  sm: 'w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] shadow-[2px_2px_0px_#0D0D0D]',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] shadow-[3px_3px_0px_#0D0D0D]',
  lg: 'w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] shadow-[4px_4px_0px_#0D0D0D]',
};

export const IconChip: React.FC<IconChipProps> = ({
  icon,
  tone = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`box-border aspect-square inline-flex items-center justify-center shrink-0 border-[3px] border-[#0D0D0D] p-2 transition-transform ${SIZE_CLASSES[size]} ${TONE_BG[tone]} ${className}`}
      style={{ borderRadius: '0px' }}
    >
      <div className="flex items-center justify-center w-full h-full shrink-0">
        {icon}
      </div>
    </div>
  );
};

// Hand-Drawn Bespoke Geometric Marks (Uniform 3px Stroke, Square Caps & Joins)
export const ShieldMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M12 2L3 6v6c0 6 9 10 9 10s9-4 9-10V6l-9-4z" />
    <path d="M12 7v10" />
    <path d="M8 12h8" />
  </svg>
);

export const FingerprintMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M4 12V8h4" />
    <path d="M4 16v4h4" />
    <path d="M20 12V8h-4" />
    <path d="M20 16v4h-4" />
    <path d="M8 12v-2a4 4 0 0 1 8 0v8" />
    <path d="M12 12v5" />
  </svg>
);

export const RepoCloneMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <rect x="4" y="4" width="6" height="6" />
    <rect x="14" y="14" width="6" height="6" />
    <path d="M7 10v6h7" />
  </svg>
);

export const CompareMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M7 3v14" />
    <path d="M3 7l4-4 4 4" />
    <path d="M17 21V7" />
    <path d="M21 17l-4 4-4-4" />
  </svg>
);

export const HistoryMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const CodeMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M8 6L2 12l6 6" />
    <path d="M16 6l6 6-6 6" />
    <path d="M14 4l-4 16" />
  </svg>
);

export const PlayMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

export const ArrowRightMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M4 12h14" />
    <path d="M12 6l6 6-6 6" />
  </svg>
);

export const SearchMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <circle cx="10" cy="10" r="7" />
    <path d="M15 15l6 6" />
  </svg>
);

export const TrashMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M3 6h18" />
    <path d="M8 6V3h8v3" />
    <path d="M5 6v14h14V6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);

export const CopyMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <rect x="8" y="8" width="13" height="13" />
    <path d="M4 16V4h12" />
  </svg>
);

export const CheckMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export const ChevronDownMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ChevronRightMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const GitHubMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export const SettingsMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export const ChartMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M3 20h18" />
    <path d="M6 16v-4" />
    <path d="M11 16V8" />
    <path d="M16 16V4" />
  </svg>
);

export const KeyMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M11 12l8-8" />
    <path d="M15 8h4v4" />
  </svg>
);

export const UserMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
  </svg>
);

export const ExternalLinkMark: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

