import React, { useState } from 'react';
import { TabType, PillBottomNav } from './components/common/PillBottomNav';
import { SidebarNav } from './components/common/SidebarNav';
import { LandingView } from './components/landing/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ScanView } from './components/scan/ScanView';
import { ReportCardView } from './components/report/ReportCardView';
import { PairwiseCompareModal } from './components/compare/PairwiseCompareModal';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { CorpusValidationView } from './components/corpus/CorpusValidationView';
import { OOPArchitectureModal } from './components/oop/OOPArchitectureModal';
import { auditService } from './services/auditService';
import { AuditReport, UserProfile } from './types/audit';
import { ShieldMark, GitHubMark, PlayMark } from './components/common/BrutalistIcon';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [user, setUser] = useState<UserProfile | null>(() => auditService.getUser());
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to logged in workspace
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [currentReport, setCurrentReport] = useState<AuditReport | null>(() => {
    const list = auditService.getHistory();
    if (list.length > 0) {
      return auditService.getAuditById(list[0].id);
    }
    return null;
  });

  const [targetRepoUrl, setTargetRepoUrl] = useState<string | undefined>();
  const [targetCompareUrl, setTargetCompareUrl] = useState<string | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  const handleAuditComplete = (report: AuditReport) => {
    setCurrentReport(report);
    setActiveTab('report');
  };

  const handleStartAuditFromLanding = (repoUrl: string, compareRepoUrl?: string) => {
    setTargetRepoUrl(repoUrl);
    setTargetCompareUrl(compareRepoUrl);
    setSelectedPresetId(undefined);
    setActiveTab('scan');
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setTargetRepoUrl(undefined);
    setTargetCompareUrl(undefined);
    setActiveTab('scan');
  };

  const handleLoginWithGitHub = () => {
    // Single GitHub OAuth button flow per Section 4.6 & 4.7
    const u = auditService.getUser();
    setUser(u);
    setIsLoggedIn(true);
    setShowOnboarding(true);
    setActiveTab('dashboard');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'landing':
        return (
          <LandingView
            onStartAudit={handleStartAuditFromLanding}
            onNavigateToTab={setActiveTab}
            onLoginGitHub={handleLoginWithGitHub}
            isLoggedIn={isLoggedIn}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            onSelectAudit={(rep) => {
              setCurrentReport(rep);
              setActiveTab('report');
            }}
            onNavigateToScan={(url) => {
              if (url) setTargetRepoUrl(url);
              setActiveTab('scan');
            }}
          />
        );
      case 'scan':
        return (
          <ScanView
            onAuditComplete={handleAuditComplete}
            initialPresetId={selectedPresetId}
            initialRepoUrl={targetRepoUrl}
            initialCompareUrl={targetCompareUrl}
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
      case 'settings':
        return <SettingsView />;
      case 'corpus':
        return (
          <CorpusValidationView
            onRunTestRepo={(url) => {
              setTargetRepoUrl(url);
              setActiveTab('scan');
            }}
          />
        );
      case 'oop':
        return <OOPArchitectureModal />;
      default:
        return (
          <LandingView
            onStartAudit={handleStartAuditFromLanding}
            onNavigateToTab={setActiveTab}
            onLoginGitHub={handleLoginWithGitHub}
            isLoggedIn={isLoggedIn}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EFE9] text-[#0D0D0D] flex flex-col font-sans selection:bg-[#D7FF3E] selection:text-[#0D0D0D]">
      {/* 1. Global Responsive Top Navigation Bar */}
      <header className="h-14 border-b-[3px] border-[#0D0D0D] bg-[#FFFFFF] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div
            className="w-7 h-7 flex items-center justify-center bg-[#D7FF3E] border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D]"
            style={{ borderRadius: '0px' }}
          >
            <ShieldMark size={16} />
          </div>
          <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-[#0D0D0D]">
            REPO AUDITOR
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono uppercase bg-[#F2EFE9] border border-[#0D0D0D] font-bold">
            PRD V3
          </span>
        </div>

        {/* Quick Nav Pill / Tabs (visible on md+) */}
        <div className="hidden md:flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-2.5 py-1 uppercase font-bold transition-all cursor-pointer ${
              activeTab === 'landing' ? 'bg-[#0D0D0D] text-white' : 'text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
          >
            Landing
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 uppercase font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-[#0D0D0D] text-white' : 'text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-2.5 py-1 uppercase font-bold transition-all cursor-pointer ${
              activeTab === 'scan' ? 'bg-[#0D0D0D] text-white' : 'text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
          >
            Audit
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-2.5 py-1 uppercase font-bold transition-all cursor-pointer ${
              activeTab === 'compare' ? 'bg-[#0D0D0D] text-white' : 'text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
          >
            Pairwise
          </button>
          <button
            onClick={() => setActiveTab('corpus')}
            className={`px-2.5 py-1 uppercase font-bold transition-all cursor-pointer ${
              activeTab === 'corpus' ? 'bg-[#0D0D0D] text-white' : 'text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
          >
            Benchmark
          </button>
        </div>

        {/* Auth: GitHub OAuth only (Section 4.6 & 4.7) */}
        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold transition-all cursor-pointer"
                style={{ borderRadius: '0px' }}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-5 h-5 border border-[#0D0D0D]"
                />
                <span className="hidden sm:inline">@{user.username}</span>
              </button>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setUser(null);
                }}
                className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-[#0D0D0D]/60 hover:text-[#FF5A36] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLoginWithGitHub}
              className="px-3 py-1.5 bg-[#0D0D0D] text-white hover:bg-[#2B4BF2] font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{ borderRadius: '0px' }}
            >
              <GitHubMark size={14} />
              <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Onboarding Banner (First run after OAuth per Section 4.6 & 4.7) */}
      {showOnboarding && (
        <div className="bg-[#D7FF3E] border-b-[3px] border-[#0D0D0D] p-3 text-center font-mono text-xs text-[#0D0D0D] flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="font-bold">
            ★ Welcome @{user?.username}! Auto-suggested repo: <code className="bg-white px-1.5 py-0.5 border border-[#0D0D0D]">octocat/Hello-World</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTargetRepoUrl('https://github.com/octocat/Hello-World');
                setShowOnboarding(false);
                setActiveTab('scan');
              }}
              className="px-2 py-0.5 bg-[#0D0D0D] text-white font-bold uppercase text-[10px] cursor-pointer hover:bg-[#2B4BF2]"
            >
              Audit Repository
            </button>
            <button
              onClick={() => setShowOnboarding(false)}
              className="px-1.5 py-0.5 border border-[#0D0D0D] bg-white font-bold text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Container (Mobile-First Responsive Layout, No Manual Toggle) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (visible on md+) */}
        <div className="hidden md:block h-[calc(100vh-3.5rem)] sticky top-14">
          <SidebarNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            reportCount={currentReport ? currentReport.security.findings.length : 0}
            onSelectPreset={handleSelectPreset}
          />
        </div>

        {/* Dynamic Screen Content: tested down to 375px floor width without horizontal overflow */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-12 max-w-7xl mx-auto w-full min-w-0">
          {renderActiveScreen()}
        </main>

        {/* Mobile Persistent Floating Bottom Navigation Bar (< md) */}
        <div className="md:hidden">
          <PillBottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            reportCount={currentReport ? currentReport.security.findings.length : 0}
          />
        </div>
      </div>
    </div>
  );
}
