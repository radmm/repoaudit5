import React from 'react';
import { IconChip, ChipTone } from './BrutalistIcon';

export type GlowColor = 'green' | 'red' | 'blue' | 'purple' | 'yellow';

interface GlowIconProps {
  icon: React.ReactNode;
  color?: GlowColor | ChipTone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  badge?: string | number;
}

const COLOR_TO_TONE: Record<string, ChipTone> = {
  green: 'lime',
  lime: 'lime',
  red: 'coral',
  coral: 'coral',
  blue: 'cobalt',
  cobalt: 'cobalt',
  yellow: 'paper',
  purple: 'paper',
  default: 'default',
  paper: 'paper',
};

export const GlowIcon: React.FC<GlowIconProps> = ({
  icon,
  color = 'paper',
  size = 'md',
  className = '',
  badge,
}) => {
  const tone = COLOR_TO_TONE[color] || 'paper';
  const mappedSize = size === 'xl' || size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';

  return (
    <div className={`relative inline-block ${className}`}>
      <IconChip icon={icon} tone={tone} size={mappedSize} />
      {badge !== undefined && (
        <span
          className="absolute -top-2 -right-2 px-1 py-0.2 text-[9px] font-mono font-bold bg-[#0D0D0D] text-[#FFFFFF] border border-[#0D0D0D]"
          style={{ borderRadius: '0px' }}
        >
          {badge}
        </span>
      )}
    </div>
  );
};
