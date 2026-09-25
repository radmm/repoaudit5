import React from 'react';

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  borderBottom?: boolean;
  className?: string;
}

export const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  icon,
  borderBottom = true,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        borderBottom ? 'border-b border-[#0D0D0D]/10' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[#0D0D0D]/70 font-sans text-xs">{label}</span>
      </div>
      <div className="font-mono font-bold text-[#0D0D0D] text-xs text-right">
        {value}
      </div>
    </div>
  );
};
