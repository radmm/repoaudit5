import React from 'react';
import { TabType } from './PillBottomNav';
import {
  ShieldMark,
  HistoryMark,
  CodeMark,
  CompareMark,
  PlayMark,
  IconChip,
  ChartMark,
  SettingsMark,
  CheckMark,
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
    { id: 'landing', label: 'Public Landing', icon: <ShieldMark size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <ChartMark size={16} /> },
    { id: 'scan', label: 'Run Audit', icon: <PlayMark size={16} /> },
    { id: 'report', label: 'Report Reveal', icon: <ShieldMark size={16} />, badge: reportCount > 0 ? reportCount : undefined },
    { id: 'compare', label: 'Pairwise Compare', icon: <CompareMark size={16} /> },
    { id: 'history', label: 'Audit History', icon: <HistoryMark size={16} /> },
    { id: 'settings', label: 'Settings & API', icon: <SettingsMark size={16} /> },
    { id: 'corpus', label: 'Test Corpus (Sec 9)', icon: <CheckMark size={16} /> },
    { id: 'oop', label: 'OOP Review (Sec 10)', icon: <CodeMark size={16} /> },
  ];

  return (
    <aside className="w-64 shrink-0 h-full flex flex-col justify-between p-4 border-r-[3px] border-[#0D0D0D] bg-[#F2EFE9] overflow-y-auto">
      <div className="space-y-5">
        {/* Brand */}
        <div
          onClick={() => onTabChange('landing')}
          className="flex items-center gap-3 pb-3 border-b-2 border-[#0D0D0D] cursor-pointer"
        >
          <IconChip icon={<ShieldMark size={18} />} tone="lime" size="sm" />
          <div>
            <h1 className="font-display font-extrabold text-base text-[#0D0D0D] leading-none">
              REPO AUDITOR
            </h1>
            <p className="font-mono text-[9px] text-[#0D0D0D]/60 mt-0.5 uppercase tracking-wider">
              PRD V3 DUAL-ENGINE
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <p className="font-mono text-[9px] font-bold uppercase text-[#0D0D0D]/60 px-1 mb-1">
            Application Views
          </p>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono font-bold transition-all border-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#D7FF3E] border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] text-[#0D0D0D]'
                    : 'bg-[#FFFFFF] border-[#0D0D0D] hover:bg-[#F2EFE9] text-[#0D0D0D]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="uppercase tracking-wider text-[11px] truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className="px-1 text-[9px] font-mono font-bold bg-[#FF5A36] text-white border border-[#0D0D0D] shrink-0"
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
        <div className="space-y-1 pt-1">
          <p className="font-mono text-[9px] font-bold uppercase text-[#0D0D0D]/60 px-1 mb-1">
            Demo Scenarios
          </p>
          <div className="space-y-1">
            <button
              onClick={() => onSelectPreset?.('demo-vulnerable')}
              className="w-full text-left p-1.5 border-2 border-[#0D0D0D] bg-white hover:bg-[#FF5A36]/10 text-xs font-mono transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>Vulnerable Repo</span>
                <span className="px-1 bg-[#FF5A36] text-white border border-[#0D0D0D] text-[9px]">
                  F
                </span>
              </div>
              <p className="text-[9px] text-[#0D0D0D]/60">Leaked API keys & SQL injection</p>
            </button>

            <button
              onClick={() => onSelectPreset?.('demo-pairwise-plagiarism')}
              className="w-full text-left p-1.5 border-2 border-[#0D0D0D] bg-white hover:bg-[#2B4BF2]/10 text-xs font-mono transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>Renamed BST Fork</span>
                <span className="px-1 bg-[#2B4BF2] text-white border border-[#0D0D0D] text-[9px]">
                  89%
                </span>
              </div>
              <p className="text-[9px] text-[#0D0D0D]/60">Pairwise normalized winnowing</p>
            </button>

            <button
              onClick={() => onSelectPreset?.('demo-clean-spring')}
              className="w-full text-left p-1.5 border-2 border-[#0D0D0D] bg-white hover:bg-[#D7FF3E]/30 text-xs font-mono transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>Clean Control</span>
                <span className="px-1 bg-[#D7FF3E] text-[#0D0D0D] border border-[#0D0D0D] text-[9px]">
                  A
                </span>
              </div>
              <p className="text-[9px] text-[#0D0D0D]/60">BCrypt & JPA parameterized</p>
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t-2 border-[#0D0D0D] font-mono text-[9px] text-[#0D0D0D]/70 space-y-0.5 mt-4">
        <div className="flex justify-between">
          <span>Standards:</span>
          <span className="font-bold">SDG 16 & 4</span>
        </div>
        <div className="flex justify-between">
          <span>Source Cache:</span>
          <span className="font-bold">Zero (Purged)</span>
        </div>
      </div>
    </aside>
  );
};
