import React from 'react';
import { TabType } from './PillBottomNav';
import {
  ShieldMark,
  HistoryMark,
  CodeMark,
  CompareMark,
  PlayMark,
  IconChip,
  ArrowRightMark,
} from './BrutalistIcon';

interface SidebarNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  reportCount?: number;
  onSelectPreset?: (presetId: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  reportCount = 0,
  onSelectPreset,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'scan', label: 'Audit', icon: <PlayMark size={16} /> },
    { id: 'report', label: 'Report', icon: <ShieldMark size={16} />, badge: reportCount > 0 ? reportCount : undefined },
    { id: 'compare', label: 'Compare', icon: <CompareMark size={16} /> },
    { id: 'history', label: 'History', icon: <HistoryMark size={16} /> },
    { id: 'oop', label: 'OOP Core', icon: <CodeMark size={16} /> },
  ];

  return (
    <aside className="w-64 shrink-0 h-full flex flex-col justify-between p-4 border-r-[3px] border-[#0D0D0D] bg-[#F2EFE9]">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-[#0D0D0D]">
          <IconChip icon={<ShieldMark size={18} />} tone="lime" size="sm" />
          <div>
            <h1 className="font-display font-extrabold text-lg text-[#0D0D0D] leading-none">
              REPO AUDITOR
            </h1>
            <p className="font-mono text-[10px] text-[#0D0D0D]/60 mt-0.5">
              SECURITY & PLAGIARISM
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/60 px-1">
            Views
          </p>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#D7FF3E] border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] text-[#0D0D0D]'
                    : 'bg-[#FFFFFF] border-[#0D0D0D] hover:bg-[#F2EFE9] text-[#0D0D0D]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="uppercase tracking-wider">{item.label}</span>
                </div>
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
        </div>

        {/* Demo Scenarios */}
        <div className="space-y-1.5 pt-2">
          <p className="font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/60 px-1">
            Presets
          </p>
          <div className="space-y-1">
            <button
              onClick={() => onSelectPreset?.('demo-vulnerable')}
              className="w-full text-left p-2 border-2 border-[#0D0D0D] bg-white hover:bg-[#FF5A36]/10 text-xs font-mono transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Vulnerable App</span>
                <span className="px-1 bg-[#FF5A36] text-white border border-[#0D0D0D] text-[10px]">
                  F
                </span>
              </div>
              <p className="text-[10px] text-[#0D0D0D]/60 mt-0.5">Leaked keys + SQL injection</p>
            </button>

            <button
              onClick={() => onSelectPreset?.('demo-pairwise-plagiarism')}
              className="w-full text-left p-2 border-2 border-[#0D0D0D] bg-white hover:bg-[#2B4BF2]/10 text-xs font-mono transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Renamed BST</span>
                <span className="px-1 bg-[#2B4BF2] text-white border border-[#0D0D0D] text-[10px]">
                  89%
                </span>
              </div>
              <p className="text-[10px] text-[#0D0D0D]/60 mt-0.5">Renamed variables copycat</p>
            </button>

            <button
              onClick={() => onSelectPreset?.('demo-clean-spring')}
              className="w-full text-left p-2 border-2 border-[#0D0D0D] bg-white hover:bg-[#D7FF3E]/30 text-xs font-mono transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Clean Spring</span>
                <span className="px-1 bg-[#D7FF3E] text-[#0D0D0D] border border-[#0D0D0D] text-[10px]">
                  A
                </span>
              </div>
              <p className="text-[10px] text-[#0D0D0D]/60 mt-0.5">BCrypt & JPA safe queries</p>
            </button>
          </div>
        </div>
      </div>

      {/* Footer minimal info */}
      <div className="pt-3 border-t-2 border-[#0D0D0D] font-mono text-[10px] text-[#0D0D0D]/70 space-y-1">
        <div className="flex justify-between">
          <span>Standards:</span>
          <span className="font-bold">SDG 16 & 4</span>
        </div>
        <div className="flex justify-between">
          <span>Algorithm:</span>
          <span className="font-bold">Winnowing (MOSS)</span>
        </div>
      </div>
    </aside>
  );
};
