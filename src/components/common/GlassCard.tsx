import React from 'react';

interface BrutalistCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  highlight?: boolean;
  hero?: boolean;
  rotate?: string; // e.g. "-1.5deg" or "1.5deg" for controlled mess
  bg?: 'white' | 'paper' | 'lime' | 'cobalt' | 'coral' | 'zebra';
}

const BG_MAP = {
  white: 'bg-[#FFFFFF]',
  paper: 'bg-[#F2EFE9]',
  zebra: 'bg-[#E8E4DA]',
  lime: 'bg-[#D7FF3E]',
  cobalt: 'bg-[#2B4BF2] text-white',
  coral: 'bg-[#FF5A36] text-white',
};

export const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  highlight = false,
  hero = false,
  rotate,
  bg = 'white',
}) => {
  const shadowClass = hero ? 'shadow-[6px_6px_0px_#0D0D0D]' : 'shadow-[3px_3px_0px_#0D0D0D]';
  const hoverClass = hoverable
    ? 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0D0D0D] cursor-pointer'
    : '';
  const rotateStyle = rotate ? { transform: `rotate(${rotate})` } : {};

  return (
    <div
      onClick={onClick}
      style={rotateStyle}
      className={`border-[3px] border-[#0D0D0D] p-5 transition-all duration-150 rounded-[2px] ${shadowClass} ${
        highlight ? 'bg-[#FFFFFF] border-[#0D0D0D]' : BG_MAP[bg]
      } ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

// Backwards compatibility alias
export const GlassCard = BrutalistCard;
