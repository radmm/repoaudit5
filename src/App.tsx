import React, { useState, useEffect } from 'react';
import { TabType, PillBottomNav } from './components/common/PillBottomNav';
import { SidebarNav } from './components/common/SidebarNav';
import { LandingView } from './components/landing/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ScanView } from './components/scan/ScanView';
import { ReportCardView } from './components/report/ReportCardView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { ReviewMaterialsModal } from './components/review/ReviewMaterialsModal';
import { GitHubAuthModal } from './components/common/GitHubAuthModal';
import { auditService } from './services/auditService';
import { AuditReport, UserProfile } from './types/audit';
import { ShieldMark, GitHubMark, PlayMark } from './components/common/BrutalistIcon';

export default function App() {
  // Authentication & Session
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('repo_auditor_user_v4');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(user));
  const [activeTab, setActiveTab] = useState<TabType>(() => (user ? 'dashboard' : 'landing'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [reviewSection, setReviewSection] = useState<'corpus' | 'oop'>('corpus');

  const [currentReport, setCurrentReport] = useState<AuditReport | null>(() => {
    const list = auditService.getHistory();
    return list.length > 0 ? auditService.getAuditById(list[0].id) : null;
  });

  const [targetRepoUrl, setTargetRepoUrl] = useState<string | undefined>();
  const [targetCompareUrl, setTargetCompareUrl] = useState<string | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  // Check server session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
          try {
            localStorage.setItem('repo_auditor_user_v4', JSON.stringify(data.user));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Listen for OAuth postMessage callback per oauth-integration skill
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
        handleLoginSuccess(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLoginSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    setShowOnboarding(true);
    try {
      localStorage.setItem('repo_auditor_user_v4', JSON.stringify(authenticatedUser));
    } catch {}
    setActiveTab('dashboard');
  };

  // Launch GitHub OAuth popup flow directly on click
  const handleSignInWithGitHub = async () => {
    try {
      const res = await fetch('/api/auth/url');
      if (!res.ok) throw new Error('Failed to retrieve authorization URL');
      const { url } = await res.json();

      const popup = window.open(
        url,
        'github_oauth_popup',
        'width=600,height=720,scrollbars=yes,status=yes'
      );

      if (!popup) {
        window.location.href = url;
        return;
      }

      // Check session periodically in case postMessage is blocked across origins
      const timer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(timer);
            const sessionRes = await fetch('/api/auth/session').then((r) => r.json());
            if (sessionRes?.authenticated && sessionRes.user) {
              handleLoginSuccess(sessionRes.user);
            }
          }
        } catch {}
      }, 700);
    } catch (err) {
      console.error('OAuth launch error:', err);
      setShowAuthModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('repo_auditor_user_v4');
    setUser(null);
    setIsLoggedIn(false);
    setActiveTab('landing');
  };

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

  const handleOpenDocs = (section: 'corpus' | 'oop' = 'corpus') => {
    setReviewSection(section);
    setActiveTab('review');
  };

  // Determine if we are on the public landing page (clean, zero sidebar/dev-nav)
  const isLandingView = activeTab === 'landing';

  return (
    <div className="min-h-screen bg-[#F2EFE9] text-[#0D0D0D] flex flex-col font-sans selection:bg-[#D7FF3E] selection:text-[#0D0D0D]">
      {/* 1. Global Navigation Bar */}
      <header className="h-14 border-b-[3px] border-[#0D0D0D] bg-[#FFFFFF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Brand */}
        <div
          onClick={() => setActiveTab(isLoggedIn ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div
            className="w-8 h-8 aspect-square flex items-center justify-center bg-[#D7FF3E] border-[3px] border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D]"
            style={{ borderRadius: '0px' }}
          >
            <ShieldMark size={18} />
          </div>
          <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-[#0D0D0D]">
            REPO AUDITOR
          </span>
        </div>

        {/* Center Navigation depending on context */}
        {isLandingView ? (
          /* Public Landing Page Header Links (Problem 2) */
          <div className="hidden md:flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
            <a href="#how-it-works" className="hover:text-[#2B4BF2] transition-colors">
              How It Works
            </a>
            <a href="#specifications" className="hover:text-[#2B4BF2] transition-colors">
              Features
            </a>
            <button
              onClick={() => handleOpenDocs('corpus')}
              className="hover:text-[#2B4BF2] transition-colors cursor-pointer"
            >
              Docs & Benchmark
            </button>
          </div>
        ) : (
          /* Authenticated Header Breadcrumb */
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#0D0D0D]/60">
            <span className="text-[#0D0D0D] font-bold uppercase">{activeTab}</span>
            <span>•</span>
            <span>Workspace: Acme Engineering</span>
          </div>
        )}

        {/* Right Auth Action */}
        <div className="flex items-center gap-3">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-2.5 py-1 border-[3px] border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold transition-all cursor-pointer shadow-[2px_2px_0px_#0D0D0D]"
                style={{ borderRadius: '0px' }}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-5 h-5 aspect-square border border-[#0D0D0D]"
                />
                <span className="hidden sm:inline">@{user.username}</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-2 py-1 text-xs font-mono font-bold uppercase text-[#0D0D0D]/70 hover:text-[#FF5A36] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignInWithGitHub}
                className="px-3 py-1.5 bg-[#0D0D0D] text-white hover:bg-[#2B4BF2] font-mono text-xs font-bold uppercase border-[3px] border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                style={{ borderRadius: '0px' }}
              >
                <GitHubMark size={14} />
                <span>Sign in with GitHub</span>
              </button>

              <button
                onClick={() => {
                  setTargetRepoUrl('https://github.com/acme-corp/vulnerable-payment-gateway');
                  setActiveTab('scan');
                }}
                className="hidden sm:inline-flex px-3 py-1.5 bg-[#D7FF3E] text-[#0D0D0D] hover:bg-[#cbf52f] font-mono text-xs font-bold uppercase border-[3px] border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] cursor-pointer"
                style={{ borderRadius: '0px' }}
              >
                Start Auditing
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Onboarding Banner (First run after OAuth per Section 4.6) */}
      {showOnboarding && isLoggedIn && (
        <div className="bg-[#D7FF3E] border-b-[3px] border-[#0D0D0D] p-3 text-center font-mono text-xs text-[#0D0D0D] flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="font-bold">
            ★ Welcome @{user?.username}! Auto-suggested repository:{' '}
            <code className="bg-white px-1.5 py-0.5 border border-[#0D0D0D]">
              octocat/Hello-World
            </code>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTargetRepoUrl('https://github.com/octocat/Hello-World');
                setShowOnboarding(false);
                setActiveTab('scan');
              }}
              className="px-2.5 py-1 bg-[#0D0D0D] text-white font-bold uppercase text-[10px] cursor-pointer hover:bg-[#2B4BF2]"
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

      {/* 3. Main Workspace Container */}
      {isLandingView ? (
        /* CLEAN PUBLIC LANDING: ZERO SIDEBAR, ZERO DEV-NAV (Problem 2) */
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <LandingView
            onStartAudit={handleStartAuditFromLanding}
            onNavigateToTab={(tab) => {
              if (tab === 'corpus' || tab === 'oop') {
                handleOpenDocs(tab);
              } else {
                setActiveTab(tab);
              }
            }}
            onLoginGitHub={handleSignInWithGitHub}
            isLoggedIn={isLoggedIn}
          />
        </main>
      ) : (
        /* AUTHENTICATED APP: COLLAPSED SIDEBAR WITH 4 REAL DESTINATIONS ONLY (Problem 2) */
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsed Icon-Only Sidebar (Expandable on hover/click) */}
          <div className="hidden md:block h-[calc(100vh-3.5rem)] sticky top-14">
            <SidebarNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenDocs={() => handleOpenDocs('corpus')}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full min-w-0">
            {activeTab === 'dashboard' && (
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
            )}

            {activeTab === 'scan' && (
              <ScanView
                onAuditComplete={handleAuditComplete}
                initialPresetId={selectedPresetId}
                initialRepoUrl={targetRepoUrl}
                initialCompareUrl={targetCompareUrl}
              />
            )}

            {activeTab === 'report' && currentReport && (
              <ReportCardView
                report={currentReport}
                onRunNewScan={() => setActiveTab('scan')}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                onSelectAudit={(rep) => {
                  setCurrentReport(rep);
                  setActiveTab('report');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView onOpenDocs={handleOpenDocs} />
            )}

            {activeTab === 'review' && (
              <ReviewMaterialsModal
                initialSection={reviewSection}
                onClose={() => setActiveTab(isLoggedIn ? 'dashboard' : 'landing')}
                onRunTestRepo={(url) => {
                  setTargetRepoUrl(url);
                  setActiveTab('scan');
                }}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar (4 Real Destinations Only) */}
          <div className="md:hidden">
            <PillBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      )}

      {/* GitHub OAuth Authentication Modal */}
      {showAuthModal && (
        <GitHubAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
          redirectUri={`${window.location.origin}/auth/callback`}
        />
      )}
    </div>
  );
}
