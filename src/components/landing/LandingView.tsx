import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  ShieldMark,
  FingerprintMark,
  RepoCloneMark,
  CompareMark,
  PlayMark,
  IconChip,
  ArrowRightMark,
  CheckMark,
  GitHubMark,
} from '../common/BrutalistIcon';
import { auditService } from '../../services/auditService';
import { AuditReport } from '../../types/audit';

interface LandingViewProps {
  onStartAudit: (repoUrl: string, compareRepoUrl?: string) => void;
  onNavigateToTab: (tab: any) => void;
  onLoginGitHub: () => void;
  isLoggedIn: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartAudit,
  onNavigateToTab,
  onLoginGitHub,
  isLoggedIn,
}) => {
  const [heroRepoUrl, setHeroRepoUrl] = useState('https://github.com/acme-corp/vulnerable-payment-gateway');
  const [heroCompareUrl, setHeroCompareUrl] = useState('');
  const [isPairwise, setIsPairwise] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroRepoUrl.trim()) return;
    onStartAudit(heroRepoUrl.trim(), isPairwise && heroCompareUrl.trim() ? heroCompareUrl.trim() : undefined);
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    auditService.joinWaitlist(waitlistEmail.trim());
    setWaitlistJoined(true);
  };

  const faqs = [
    {
      q: 'How does the plagiarism scanner survive variable renaming?',
      a: 'Before winnowing tokenization, the engine runs an identifier-normalization pass: comments and whitespace are stripped, and variable, function, and parameter names are converted into canonical positional tokens (_ID_). Structural syntax keywords are preserved, allowing MOSS-compatible sliding k-gram hashes to catch copycats even when every identifier has been altered.',
    },
    {
      q: 'Why are checks explicitly labeled "Pattern-Based"?',
      a: 'We value engineering honesty: regex checks reliably detect hardcoded credentials, SQL concatenation, and insecure hash functions, but they are not full abstract-syntax or dataflow taint analysis. Accurately labeling our capabilities prevents overpromising.',
    },
    {
      q: 'Does Repo Auditor retain cloned source code?',
      a: 'No. Repositories are cloned shallowly (depth=1) into an ephemeral directory (/tmp/repo-auditor/{jobId}) that is purged immediately upon audit completion or failure. Only mathematical fingerprint hashes and finding metadata are persisted.',
    },
    {
      q: 'How does the commit-SHA caching work?',
      a: 'Before scanning, Repo Auditor queries the HEAD commit SHA. If an audit report already exists for that exact repository URL and commit SHA, the cached report is returned instantly, preventing redundant compute.',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-8">
      {/* 1. Hero Section with Inline Audit Input */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Headline & Pitch (7 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <BrutalistCard hero bg="white" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#D7FF3E] border-2 border-[#0D0D0D]">
                  V3 ASYNC DUAL-ENGINE
                </span>
                <span className="font-mono text-xs text-[#0D0D0D]/60">
                  SHALLOW JGIT • WINNOWING • ZERO RETENTION
                </span>
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-[#0D0D0D] leading-[0.92]">
                AUDIT CODE BEFORE MERGE.
              </h1>

              <p className="mt-4 text-[#0D0D0D]/80 font-sans text-sm sm:text-base max-w-xl leading-relaxed">
                Run pattern-based security checks and language-agnostic pairwise plagiarism detection across any public GitHub repository. No signup required for your first audit.
              </p>

              {/* Inline Hero Audit Input */}
              <form onSubmit={handleHeroSubmit} className="mt-6 pt-6 border-t-[3px] border-[#0D0D0D] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#0D0D0D] flex items-center gap-2">
                    <RepoCloneMark size={16} />
                    Run Instant Free Audit
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPairwise(!isPairwise)}
                    className="font-mono text-xs font-bold uppercase text-[#2B4BF2] hover:underline cursor-pointer"
                  >
                    {isPairwise ? '[-] Single Repo' : '[+] Pairwise Compare'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={heroRepoUrl}
                    onChange={(e) => setHeroRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 px-4 py-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] text-[#0D0D0D] font-mono text-xs sm:text-sm focus:outline-none focus:bg-white"
                    style={{ borderRadius: '0px' }}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D] border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0D0D0D] transition-all cursor-pointer whitespace-nowrap"
                    style={{ borderRadius: '0px' }}
                  >
                    Audit Now
                  </button>
                </div>

                {isPairwise && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={heroCompareUrl}
                      onChange={(e) => setHeroCompareUrl(e.target.value)}
                      placeholder="https://github.com/suspect-org/copied-fork (Pairwise target)"
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#0D0D0D] text-[#0D0D0D] font-mono text-xs focus:outline-none"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                )}
              </form>
            </BrutalistCard>
          </div>

          {/* Right Marketing Sidebar with Subtle Deliberate Tilt on Desktop (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <BrutalistCard
              rotate="1.5deg"
              bg="paper"
              className="p-5 md:hover:rotate-0 transition-transform"
            >
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0D0D0D] mb-3">
                <span className="font-mono text-xs font-bold uppercase">Live Engine V3</span>
                <span className="w-3 h-3 bg-[#D7FF3E] border border-[#0D0D0D]" />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#0D0D0D]/10">
                  <span className="text-[#0D0D0D]/70">Architecture:</span>
                  <span className="font-bold">Async Job Queue</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#0D0D0D]/10">
                  <span className="text-[#0D0D0D]/70">Security Scope:</span>
                  <span className="font-bold">Pattern Checks</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#0D0D0D]/10">
                  <span className="text-[#0D0D0D]/70">Plagiarism:</span>
                  <span className="font-bold">Pairwise Winnowing</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#0D0D0D]/10">
                  <span className="text-[#0D0D0D]/70">Source Retention:</span>
                  <span className="font-bold text-[#FF5A36]">Zero (Hashes Only)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-[#0D0D0D] flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#0D0D0D]/60 uppercase">GitHub App:</span>
                <span className="font-mono text-xs font-bold text-[#2B4BF2]">Ready for CI</span>
              </div>
            </BrutalistCard>

            {/* Quick Demo Previews */}
            <div className="border-2 border-[#0D0D0D] bg-white p-3 space-y-2 shadow-[3px_3px_0px_#0D0D0D]">
              <span className="font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/70 block">
                Preloaded Demo Targets:
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                <button
                  onClick={() => {
                    setHeroRepoUrl('https://github.com/acme-corp/vulnerable-payment-gateway');
                    setIsPairwise(false);
                  }}
                  className="p-1.5 bg-[#FF5A36]/10 border border-[#0D0D0D] text-left hover:bg-[#FF5A36]/20 transition-all cursor-pointer font-bold"
                >
                  [F] Leaked Key
                </button>
                <button
                  onClick={() => {
                    setHeroRepoUrl('https://github.com/student-submissions/lab3-bst-original');
                    setHeroCompareUrl('https://github.com/student-forks/lab3-bst-renamed');
                    setIsPairwise(true);
                  }}
                  className="p-1.5 bg-[#2B4BF2]/10 border border-[#0D0D0D] text-left hover:bg-[#2B4BF2]/20 transition-all cursor-pointer font-bold"
                >
                  [89%] BST Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Stat Strip */}
      <section className="border-[3px] border-[#0D0D0D] bg-white p-4 sm:p-6 shadow-[4px_4px_0px_#0D0D0D]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#0D0D0D] text-center">
          <div className="pt-2 md:pt-0">
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#0D0D0D]">12,480+</div>
            <div className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider mt-0.5">Repositories Audited</div>
          </div>
          <div className="pt-2 md:pt-0">
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#0D0D0D]">100%</div>
            <div className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider mt-0.5">Ephemeral (0 Source Saved)</div>
          </div>
          <div className="pt-2 md:pt-0">
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#0D0D0D]">94.2%</div>
            <div className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider mt-0.5">Renamed Fork Precision</div>
          </div>
          <div className="pt-2 md:pt-0">
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#0D0D0D]">&lt; 850ms</div>
            <div className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider mt-0.5">Average Scan Duration</div>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid (4 Cards: One icon in chip + one sentence, no filler) */}
      <section className="space-y-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase text-[#0D0D0D]/60 tracking-wider">
            CORE MODULES
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl uppercase text-[#0D0D0D]">
            ENGINE SPECIFICATIONS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <BrutalistCard bg="white" className="p-5 flex flex-col justify-between">
            <div>
              <IconChip icon={<ShieldMark size={18} />} tone="coral" size="md" className="mb-4" />
              <h3 className="font-display font-bold text-base uppercase text-[#0D0D0D]">
                Pattern-Based Security
              </h3>
              <p className="mt-2 text-xs font-sans text-[#0D0D0D]/80 leading-relaxed">
                Deterministic regex rules detect hardcoded secrets, SQL string concatenation, and insecure hash functions with secret redaction.
              </p>
            </div>
            <span className="mt-4 font-mono text-[10px] font-bold uppercase text-[#FF5A36]">
              A–F Grade Output
            </span>
          </BrutalistCard>

          {/* Card 2 */}
          <BrutalistCard bg="white" className="p-5 flex flex-col justify-between">
            <div>
              <IconChip icon={<FingerprintMark size={18} />} tone="cobalt" size="md" className="mb-4" />
              <h3 className="font-display font-bold text-base uppercase text-[#0D0D0D]">
                Pairwise Plagiarism
              </h3>
              <p className="mt-2 text-xs font-sans text-[#0D0D0D]/80 leading-relaxed">
                Identifier-normalized token winnowing hash (k=6, w=4) catches copied assignments even after variable renaming and method reordering.
              </p>
            </div>
            <span className="mt-4 font-mono text-[10px] font-bold uppercase text-[#2B4BF2]">
              Language-Agnostic
            </span>
          </BrutalistCard>

          {/* Card 3 */}
          <BrutalistCard bg="white" className="p-5 flex flex-col justify-between">
            <div>
              <IconChip icon={<GitHubMark size={18} />} tone="lime" size="md" className="mb-4" />
              <h3 className="font-display font-bold text-base uppercase text-[#0D0D0D]">
                GitHub App & Action
              </h3>
              <p className="mt-2 text-xs font-sans text-[#0D0D0D]/80 leading-relaxed">
                Automated webhook triggers on incoming Pull Requests, posting grade cards and diff remediations directly to PR comments.
              </p>
            </div>
            <span className="mt-4 font-mono text-[10px] font-bold uppercase text-[#0D0D0D]">
              CI/CD Automation
            </span>
          </BrutalistCard>

          {/* Card 4 */}
          <BrutalistCard bg="white" className="p-5 flex flex-col justify-between">
            <div>
              <IconChip icon={<RepoCloneMark size={18} />} tone="default" size="md" className="mb-4" />
              <h3 className="font-display font-bold text-base uppercase text-[#0D0D0D]">
                Audit History & Trends
              </h3>
              <p className="mt-2 text-xs font-sans text-[#0D0D0D]/80 leading-relaxed">
                Commit-SHA caching prevents duplicate compute while repository score trendlines track security hygiene over time.
              </p>
            </div>
            <span className="mt-4 font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/70">
              Persistent Records
            </span>
          </BrutalistCard>
        </div>
      </section>

      {/* 4. "How It Works" — 3 Numbered Steps in Martian Mono */}
      <section className="border-[3px] border-[#0D0D0D] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#0D0D0D]">
        <div className="mb-6">
          <span className="font-mono text-xs font-bold uppercase text-[#0D0D0D]/60 tracking-wider">
            EXECUTION PIPELINE
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl uppercase text-[#0D0D0D]">
            HOW AN AUDIT RUNS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 border-l-2 border-[#0D0D0D] pl-4">
            <span className="font-mono font-extrabold text-xl text-[#2B4BF2]">01</span>
            <h3 className="font-display font-bold text-sm uppercase text-[#0D0D0D]">
              PASTE URL OR PUSH PR
            </h3>
            <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
              Submit any public GitHub repo URL or let our GitHub App intercept pull requests. Async worker enqueues the job instantly.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#0D0D0D] pl-4">
            <span className="font-mono font-extrabold text-xl text-[#D7FF3E] bg-[#0D0D0D] px-1 inline-block">02</span>
            <h3 className="font-display font-bold text-sm uppercase text-[#0D0D0D]">
              ASYNC PARALLEL SCAN
            </h3>
            <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
              JGit clones depth=1 into an ephemeral container. CompletableFuture executes pattern-based security and token winnowing concurrently.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#0D0D0D] pl-4">
            <span className="font-mono font-extrabold text-xl text-[#FF5A36]">03</span>
            <h3 className="font-display font-bold text-sm uppercase text-[#0D0D0D]">
              REPORT & EPHEMERAL PURGE
            </h3>
            <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
              Aggregated A–F grade scorecard and similarity percentages are generated. Cloned source is immediately deleted; only fingerprint hashes remain.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Early-Access Section IN PLACE OF Pricing Table (Section 4.7) */}
      <section className="relative">
        <div className="max-w-2xl mx-auto">
          <BrutalistCard
            hero
            rotate="-1deg"
            bg="white"
            className="p-6 sm:p-8 border-[3px] border-[#0D0D0D] shadow-[6px_6px_0px_#0D0D0D] md:hover:rotate-0 transition-transform"
          >
            <div className="text-center space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#D7FF3E] border-2 border-[#0D0D0D] inline-block">
                EARLY ACCESS PREVIEW
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-4xl uppercase text-[#0D0D0D]">
                JOIN THE WAITLIST FOR PRO
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#0D0D0D]/80 max-w-md mx-auto leading-relaxed">
                Unlock private repository scanning, team organization accounts, unlimited audit quotas, and programmatic API access.
              </p>

              {waitlistJoined ? (
                <div className="p-4 bg-[#D7FF3E]/40 border-2 border-[#0D0D0D] font-mono text-xs font-bold text-[#0D0D0D] flex items-center justify-center gap-2">
                  <CheckMark size={16} />
                  <span>You're on the early-access list! We'll invite you soon.</span>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="pt-4 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="flex-1 px-4 py-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] text-xs font-mono focus:outline-none focus:bg-white"
                    style={{ borderRadius: '0px' }}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0D0D0D] text-white hover:bg-[#2B4BF2] font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    style={{ borderRadius: '0px' }}
                  >
                    Join Waitlist
                  </button>
                </form>
              )}

              <p className="font-mono text-[10px] text-[#0D0D0D]/60 pt-2">
                No credit card required. Free tier forever for public open source.
              </p>
            </div>
          </BrutalistCard>
        </div>
      </section>

      {/* 6. FAQ Accordion */}
      <section className="space-y-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase text-[#0D0D0D]/60 tracking-wider">
            QUESTIONS & ANSWERS
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl uppercase text-[#0D0D0D]">
            TECHNICAL FAQ
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border-2 border-[#0D0D0D] bg-white transition-all shadow-[2px_2px_0px_#0D0D0D]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between font-mono font-bold text-xs sm:text-sm text-[#0D0D0D] hover:bg-[#F2EFE9] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="font-mono font-bold text-sm">{isOpen ? '[-]' : '[+]'}</span>
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 font-sans text-xs text-[#0D0D0D]/80 leading-relaxed border-t border-[#0D0D0D]/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Footer with Real Link Groups */}
      <footer className="border-t-[3px] border-[#0D0D0D] pt-8 mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs">
        <div>
          <span className="font-bold uppercase text-[#0D0D0D] block mb-2">Product</span>
          <ul className="space-y-1 text-[#0D0D0D]/70">
            <li><button onClick={() => onNavigateToTab('scan')} className="hover:underline cursor-pointer">Run Audit</button></li>
            <li><button onClick={() => onNavigateToTab('compare')} className="hover:underline cursor-pointer">Pairwise Plagiarism</button></li>
            <li><button onClick={() => onNavigateToTab('corpus')} className="hover:underline cursor-pointer">Accuracy Validation</button></li>
            <li><button onClick={() => onNavigateToTab('dashboard')} className="hover:underline cursor-pointer">Dashboard Trends</button></li>
          </ul>
        </div>
        <div>
          <span className="font-bold uppercase text-[#0D0D0D] block mb-2">Documentation</span>
          <ul className="space-y-1 text-[#0D0D0D]/70">
            <li><button onClick={() => onNavigateToTab('oop')} className="hover:underline cursor-pointer">OOP Architecture</button></li>
            <li><a href="#how-it-works" className="hover:underline">Winnowing Spec</a></li>
            <li><a href="#specifications" className="hover:underline">Pattern IDs</a></li>
            <li><a href="#security" className="hover:underline">Zero Retention Policy</a></li>
          </ul>
        </div>
        <div>
          <span className="font-bold uppercase text-[#0D0D0D] block mb-2">Open Source</span>
          <ul className="space-y-1 text-[#0D0D0D]/70">
            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:underline">GitHub Action</a></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:underline">GitHub App</a></li>
            <li><a href="https://sdgs.un.org" target="_blank" rel="noreferrer" className="hover:underline">SDG 16 & 4</a></li>
          </ul>
        </div>
        <div>
          <span className="font-bold uppercase text-[#0D0D0D] block mb-2">Account</span>
          <ul className="space-y-1 text-[#0D0D0D]/70">
            <li>
              {isLoggedIn ? (
                <button onClick={() => onNavigateToTab('settings')} className="hover:underline cursor-pointer">Settings</button>
              ) : (
                <button onClick={onLoginGitHub} className="hover:underline cursor-pointer">Sign In with GitHub</button>
              )}
            </li>
            <li><button onClick={() => onNavigateToTab('history')} className="hover:underline cursor-pointer">Audit History</button></li>
          </ul>
        </div>
      </footer>
    </div>
  );
};
