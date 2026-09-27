import React from 'react';
import {
  HistoryMark,
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
  | 'review'
  | 'public-report';

interface PillBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const PillBottomNav: React.FC<PillBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const items: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartMark size={16} /> },
    { id: 'scan', label: 'Run Audit', icon: <PlayMark size={16} /> },
    { id: 'history', label: 'History', icon: <HistoryMark size={16} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsMark size={16} /> },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto px-2 max-w-[95vw]">
      <nav
        className="flex items-center gap-1.5 p-1.5 bg-[#FFFFFF] border-[3px] border-[#0D0D0D] shadow-[4px_4px_0px_#0D0D0D]"
        style={{ borderRadius: '0px' }}
      >
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold transition-all cursor-pointer border-[3px] shrink-0 ${
                isActive
                  ? 'bg-[#D7FF3E] border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] text-[#0D0D0D]'
                  : 'bg-transparent border-transparent text-[#0D0D0D] hover:bg-[#F2EFE9] hover:border-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="tracking-wider uppercase text-[11px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
