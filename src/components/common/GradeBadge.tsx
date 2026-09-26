import React from 'react';
import { SecurityGrade } from '../../types/audit';

interface GradeBadgeProps {
  grade: SecurityGrade;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const SIZE_MAP = {
  sm: 'w-7 h-7 text-xs border-2 shadow-[2px_2px_0px_#0D0D0D]',
  md: 'w-10 h-10 text-sm border-2 shadow-[3px_3px_0px_#0D0D0D]',
  lg: 'w-14 h-14 text-2xl border-[3px] shadow-[4px_4px_0px_#0D0D0D]',
  xl: 'w-20 h-20 text-4xl border-[3px] shadow-[6px_6px_0px_#0D0D0D]',
};

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  size = 'md',
  showLabel = false,
}) => {
  let bg = 'bg-[#D7FF3E] text-[#0D0D0D]';
  let label = 'Clean';
  let icon = '✓'; // Distinct symbol for colorblind accessibility

  if (grade === 'A') {
    bg = 'bg-[#D7FF3E] text-[#0D0D0D]';
    label = 'Grade: A (Clean)';
    icon = '✓';
  } else if (grade === 'B') {
    bg = 'bg-[#D7FF3E] text-[#0D0D0D]';
    label = 'Grade: B (Low Risk)';
    icon = '✓';
  } else if (grade === 'C') {
    bg = 'bg-[#2B4BF2] text-[#FFFFFF]';
    label = 'Grade: C (Moderate)';
    icon = 'ℹ';
  } else if (grade === 'D') {
    bg = 'bg-[#FF5A36] text-[#FFFFFF]';
    label = 'Grade: D (Vulnerable)';
    icon = '⚠';
  } else {
    bg = 'bg-[#FF5A36] text-[#FFFFFF]';
    label = 'Grade: F (Critical)';
    icon = '✕';
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`inline-flex items-center justify-center font-mono font-extrabold border-[#0D0D0D] shrink-0 ${SIZE_MAP[size]} ${bg}`}
        style={{ borderRadius: '0px' }}
      >
        <span>{grade}</span>
      </div>
      {showLabel && (
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#0D0D0D] flex items-center gap-1.5">
          <span className="text-sm font-mono">{icon}</span>
          <span>{label}</span>
        </span>
      )}
    </div>
  );
};
