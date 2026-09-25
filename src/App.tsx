import React, { useState } from 'react';
import { TabType, PillBottomNav } from './components/common/PillBottomNav';
import { SidebarNav } from './components/common/SidebarNav';
import { DeviceMockup } from './components/common/DeviceMockup';
import { ScanView } from './components/scan/ScanView';
import { ReportCardView } from './components/report/ReportCardView';
import { PairwiseCompareModal } from './components/compare/PairwiseCompareModal';
import { HistoryView } from './components/history/HistoryView';
import { OOPArchitectureModal } from './components/oop/OOPArchitectureModal';
import { auditService } from './services/auditService';
import { AuditReport } from './types/audit';
import { ShieldMark } from './components/common/BrutalistIcon';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(() => {
    const list = auditService.getHistory();
    if (list.length > 0) {
      return auditService.getAuditById(list[0].id);
    }
    return null;
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  const handleAuditComplete = (report: AuditReport) => {
    setCurrentReport(report);
    setActiveTab('report');
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setActiveTab('scan');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'scan':
        return (
          <ScanView
            onAuditComplete={handleAuditComplete}
            initialPresetId={selectedPresetId}
          />
        );
      case 'report':
        return currentReport ? (
          <ReportCardView
            report={currentReport}
            onRunNewScan={() => setActiveTab('scan')}
          />
        ) : (
          <ScanView onAuditComplete={handleAuditComplete} />
        );
      case 'compare':
        return <PairwiseCompareModal onAuditComplete={handleAuditComplete} />;
      case 'history':
        return (
          <HistoryView
            onSelectAudit={(rep) => {
              setCurrentReport(rep);
              setActiveTab('report');
            }}
          />
        );
      case 'oop':
        return <OOPArchitectureModal />;
      default:
        return <ScanView onAuditComplete={handleAuditComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EFE9] text-[#0D0D0D] flex flex-col font-sans selection:bg-[#D7FF3E] selection:text-[#0D0D0D]">
      {/* Global Top Bar */}
      <header className="h-14 border-b-[3px] border-[#0D0D0D] bg-[#FFFFFF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 flex items-center justify-center bg-[#D7FF3E] border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D]"
            style={{ borderRadius: '0px' }}
          >
            <ShieldMark size={16} />
          </div>
          <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-[#0D0D0D]">
            REPO AUDITOR
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono uppercase bg-[#F2EFE9] border border-[#0D0D0D]">
            V2
          </span>
        </div>

        {/* Right: Viewport Mode Switcher */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center p-0.5 bg-[#F2EFE9] border-2 border-[#0D0D0D]"
            style={{ borderRadius: '0px' }}
          >
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-[#0D0D0D] text-white'
                  : 'text-[#0D0D0D] hover:bg-white'
              }`}
              style={{ borderRadius: '0px' }}
            >
              Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-[#0D0D0D] text-white'
                  : 'text-[#0D0D0D] hover:bg-white'
              }`}
              style={{ borderRadius: '0px' }}
            >
              Mobile
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {viewMode === 'desktop' ? (
        /* Desktop Variant: Multi-column grid with sidebar nav */
        <div className="flex-1 flex overflow-hidden">
          <div className="hidden md:block h-[calc(100vh-3.5rem)] sticky top-14">
            <SidebarNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              reportCount={currentReport ? currentReport.security.findings.length : 0}
              onSelectPreset={handleSelectPreset}
            />
          </div>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
            {renderActiveScreen()}
          </main>

          {/* Fallback bottom nav for narrow mobile screen when in desktop view mode */}
          <div className="md:hidden">
            <PillBottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              reportCount={currentReport ? currentReport.security.findings.length : 0}
            />
          </div>
        </div>
      ) : (
        /* Mobile Variant: Single column inside brutalist phone-frame mockup */
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
          <DeviceMockup>
            {renderActiveScreen()}
            <PillBottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              reportCount={currentReport ? currentReport.security.findings.length : 0}
            />
          </DeviceMockup>
        </div>
      )}
    </div>
  );
}
