import React from 'react';
import {
  ShieldMark,
  HistoryMark,
  CodeMark,
  CompareMark,
  PlayMark,
  ChartMark,
  SettingsMark,
} from './BrutalistIcon';

export type TabType =
  | 'landing'
  | 'dashboard'
  | 'scan'
  | 'report'
  | 'compare'
  | 'history'
  | 'settings'
  | 'corpus'
  | 'oop';

interface PillBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  reportCount?: number;
}

export const PillBottomNav: React.FC<PillBottomNavProps> = ({
  activeTab,
  onTabChange,
  reportCount = 0,
}) => {
  const items: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dash', icon: <ChartMark size={16} /> },
    { id: 'scan', label: 'Audit', icon: <PlayMark size={16} /> },
    { id: 'report', label: 'Report', icon: <ShieldMark size={16} />, badge: reportCount > 0 ? reportCount : undefined },
    { id: 'compare', label: 'Compare', icon: <CompareMark size={16} /> },
    { id: 'history', label: 'History', icon: <HistoryMark size={16} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsMark size={16} /> },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto px-2 max-w-[95vw]">
      <nav
        className="flex items-center gap-1 p-1 bg-[#FFFFFF] border-[3px] border-[#0D0D0D] shadow-[4px_4px_0px_#0D0D0D] overflow-x-auto"
        style={{ borderRadius: '0px' }}
      >
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer border-2 shrink-0 ${
                isActive
                  ? 'bg-[#D7FF3E] border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] text-[#0D0D0D]'
                  : 'bg-transparent border-transparent text-[#0D0D0D] hover:bg-[#F2EFE9] hover:border-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`tracking-wider uppercase ${isActive ? 'inline-block' : 'hidden md:inline-block'}`}>
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  className="px-1 text-[9px] font-mono font-bold bg-[#FF5A36] text-white border border-[#0D0D0D]"
                  style={{ borderRadius: '0px' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
