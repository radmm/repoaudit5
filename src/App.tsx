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
import { OnboardingModal } from './components/common/OnboardingModal';
import { PublicReportView } from './components/report/PublicReportView';
import { auditService } from './services/auditService';
import { AuditReport, UserProfile } from './types/audit';
import { ShieldMark, GitHubMark } from './components/common/BrutalistIcon';

export default function App() {
  // Session & Authentication state (in-memory, verified via httpOnly cookie)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [reviewSection, setReviewSection] = useState<'corpus' | 'oop'>('corpus');

  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [targetRepoUrl, setTargetRepoUrl] = useState<string | undefined>();
  const [targetCompareUrl, setTargetCompareUrl] = useState<string | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  // 1. Initial Route Check (/r/:auditId public badge landing page)
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/r/')) {
      const auditId = pathname.replace(/^\/r\//, '').split('/')[0];
      if (auditId) {
        // Fetch public report without authentication
        fetch(`/api/r/${auditId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((reportData) => {
            if (reportData) {
              setCurrentReport(reportData);
              setActiveTab('public-report');
            } else {
              // Fallback to local history
              const localReport = auditService.getAuditById(auditId);
              if (localReport) {
                setCurrentReport(localReport);
                setActiveTab('public-report');
              }
            }
          })
          .catch(() => {
            const localReport = auditService.getAuditById(auditId);
            if (localReport) {
              setCurrentReport(localReport);
              setActiveTab('public-report');
            }
          });
      }
    }
  }, []);

  // 2. Check server session on mount via httpOnly cookie (NO localStorage auth token)
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
          if (data.authenticated && data.user) {
            setUser(data.user);
            setIsLoggedIn(true);
            auditService.setUser(data.user);
            setActiveTab((prev) => (prev === 'landing' ? 'dashboard' : prev));
          }
        }
      })
      .catch(() => {});
  }, []);

  // 3. Listen for OAuth postMessage callback from popup (oauth-integration skill)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
        handleLoginSuccess(event.data.user, event.data.csrfToken);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLoginSuccess = (authenticatedUser: UserProfile, newCsrfToken?: string) => {
    setUser(authenticatedUser);
    setIsLoggedIn(true);
    auditService.setUser(authenticatedUser);
    if (newCsrfToken) setCsrfToken(newCsrfToken);
    setShowAuthModal(false);
    setShowOnboarding(true); // Launch Onboarding flow immediately after OAuth
    setActiveTab('dashboard');
  };

  // 4. Real GitHub OAuth Launch (Honest error if not configured; Popup to github.com if configured)
  const handleSignInWithGitHub = async () => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json().catch(() => ({}));

      // If GitHub OAuth is not configured on server yet, show honest configuration modal
      if (!res.ok || !data.configured || !data.url) {
        setAuthError(data.message || data.error || 'GitHub OAuth is not configured yet.');
        setShowAuthModal(true);
        return;
      }

      // Open real GitHub OAuth page directly on github.com
      const popup = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=720,scrollbars=yes,status=yes'
      );

      if (!popup) {
        // Fallback if browser popup blocked
        window.location.href = data.url;
        return;
      }

      // Check session periodically in case postMessage cross-origin was missed
      const timer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(timer);
            const sessionRes = await fetch('/api/auth/session', { credentials: 'include' }).then((r) => r.json());
            if (sessionRes?.authenticated && sessionRes.user) {
              handleLoginSuccess(sessionRes.user, sessionRes.csrfToken);
            }
          }
        } catch {}
      }, 800);
    } catch (err: any) {
      console.error('OAuth launch error:', err);
      setAuthError(err.message || 'Failed to connect to authentication server');
      setShowAuthModal(true);
    }
  };

  // 5. Logout (Clears server session & httpOnly cookie, removes memory user)
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
      });
    } catch {}
    setUser(null);
    setIsLoggedIn(false);
    auditService.setUser(null);
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

  const isLandingView = activeTab === 'landing';
  const isPublicReportView = activeTab === 'public-report';

  return (
    <div className="min-h-screen bg-[#F2EFE9] text-[#0D0D0D] flex flex-col font-sans selection:bg-[#D7FF3E] selection:text-[#0D0D0D]">
      {/* 1. Global Navigation Bar */}
      <header className="h-14 border-b-[3px] border-[#0D0D0D] bg-[#FFFFFF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Brand */}
        <div
          onClick={() => {
            if (window.location.pathname.startsWith('/r/')) {
              window.history.pushState({}, '', '/');
            }
            setActiveTab(isLoggedIn ? 'dashboard' : 'landing');
          }}
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
        {isLandingView || isPublicReportView ? (
          <div className="hidden md:flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
            <a href="/#how-it-works" className="hover:text-[#2B4BF2] transition-colors">
              How It Works
            </a>
            <a href="/#specifications" className="hover:text-[#2B4BF2] transition-colors">
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

      {/* 2. Main Workspace Container */}
      {isPublicReportView && currentReport ? (
        /* PUBLIC BADGE REPORT VIEW (/r/:auditId - No Login Required) */
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <PublicReportView
            report={currentReport}
            onNavigateHome={() => {
              window.history.pushState({}, '', '/');
              setActiveTab('landing');
            }}
            onAuditOwnRepo={() => {
              window.history.pushState({}, '', '/');
              setTargetRepoUrl('https://github.com/acme-corp/vulnerable-payment-gateway');
              setActiveTab('scan');
            }}
          />
        </main>
      ) : isLandingView ? (
        /* CLEAN PUBLIC LANDING: ZERO SIDEBAR, ZERO DEV-NAV */
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
        /* AUTHENTICATED APP: COLLAPSED SIDEBAR WITH 4 REAL DESTINATIONS ONLY */
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsed Icon-Only Sidebar */}
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
              <SettingsView
                onOpenDocs={handleOpenDocs}
                csrfToken={csrfToken}
              />
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

          {/* Mobile Bottom Navigation Bar */}
          <div className="md:hidden">
            <PillBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      )}

      {/* GitHub OAuth Authentication Modal (Honest Setup) */}
      {showAuthModal && (
        <GitHubAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
          redirectUri={`${window.location.origin}/auth/callback`}
          csrfToken={csrfToken}
          initialError={authError}
        />
      )}

      {/* Onboarding Flow: Auto-suggested Repos for First-Time Users */}
      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onClose={() => setShowOnboarding(false)}
          onStartAudit={(repoUrl) => {
            setShowOnboarding(false);
            setTargetRepoUrl(repoUrl);
            setActiveTab('scan');
          }}
        />
      )}
    </div>
  );
}
