import React, { useState } from 'react';
import { TabType } from './PillBottomNav';
import {
  HistoryMark,
  PlayMark,
  ChartMark,
  SettingsMark,
  ChevronRightMark,
} from './BrutalistIcon';

interface SidebarNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenDocs?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  onOpenDocs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Authenticated user destinations ONLY (Section 4 & PRD v3 Problem 2)
  const menuItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartMark size={18} /> },
    { id: 'scan', label: 'Run Audit', icon: <PlayMark size={18} /> },
    { id: 'history', label: 'History', icon: <HistoryMark size={18} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsMark size={18} /> },
  ];

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`shrink-0 h-full flex flex-col justify-between py-5 px-3 border-r-[3px] border-[#0D0D0D] bg-[#F2EFE9] transition-all duration-200 z-20 ${
        isExpanded ? 'w-56' : 'w-[74px]'
      }`}
    >
      <div className="space-y-6">
        {/* Navigation list: 4 core user-facing items */}
        <nav className="space-y-3">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 p-1.5 transition-all border-[3px] border-[#0D0D0D] cursor-pointer ${
                  isActive
                    ? 'bg-[#D7FF3E] shadow-[3px_3px_0px_#0D0D0D]'
                    : 'bg-white hover:bg-[#F2EFE9] shadow-[2px_2px_0px_#0D0D0D]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                {/* Fixed true-square icon chip */}
                <div
                  className={`w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] box-border aspect-square border-[3px] border-[#0D0D0D] flex items-center justify-center shrink-0 p-1.5 ${
                    isActive ? 'bg-[#0D0D0D] text-[#D7FF3E]' : 'bg-[#F2EFE9] text-[#0D0D0D]'
                  }`}
                  style={{ borderRadius: '0px' }}
                >
                  {item.icon}
                </div>

                {/* Expandable Label */}
                {isExpanded && (
                  <span className="font-mono font-bold text-xs uppercase tracking-wider text-[#0D0D0D] truncate whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Expansion control & Project Review Docs Link */}
      <div className="pt-4 border-t-2 border-[#0D0D0D] space-y-2">
        {onOpenDocs && (
          <button
            onClick={onOpenDocs}
            title="Project Docs & Review Materials"
            className="w-full flex items-center gap-2 p-1.5 bg-white hover:bg-[#F2EFE9] border-2 border-[#0D0D0D] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
            style={{ borderRadius: '0px' }}
          >
            <div className="w-7 h-7 aspect-square border border-[#0D0D0D] flex items-center justify-center shrink-0 bg-[#F2EFE9]">
              ℹ
            </div>
            {isExpanded && <span className="truncate whitespace-nowrap">Review Docs</span>}
          </button>
        )}

        {/* Toggle Expand / Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center p-1.5 text-[#0D0D0D]/60 hover:text-[#0D0D0D] font-mono text-xs cursor-pointer"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronRightMark size={16} />
          </span>
        </button>
      </div>
    </aside>
  );
};
