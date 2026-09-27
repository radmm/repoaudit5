import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import { GradeBadge } from '../common/GradeBadge';
import {
  ShieldMark,
  FingerprintMark,
  PlayMark,
  HistoryMark,
  ChartMark,
  ArrowRightMark,
  RepoCloneMark,
} from '../common/BrutalistIcon';
import { auditService } from '../../services/auditService';
import { AuditHistoryItem, AuditReport, UserProfile } from '../../types/audit';

interface DashboardViewProps {
  onSelectAudit: (report: AuditReport) => void;
  onNavigateToScan: (repoUrl?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectAudit,
  onNavigateToScan,
}) => {
  const [history] = useState<AuditHistoryItem[]>(() => auditService.getHistory());
  const [user] = useState<UserProfile | null>(() => auditService.getUser());

  // Group audits by repoUrl to compute trendlines
  const repoGroups: Record<string, AuditHistoryItem[]> = {};
  history.forEach((item) => {
    if (!repoGroups[item.repoUrl]) {
      repoGroups[item.repoUrl] = [];
    }
    repoGroups[item.repoUrl].push(item);
  });

  const selectedRepo = Object.keys(repoGroups)[0] || '';
  const repoAudits = repoGroups[selectedRepo] || [];

  // Quota percentage
  const quotaUsed = user?.auditsCount || 14;
  const quotaLimit = user?.quotaLimit || 50;
  const quotaPercent = Math.min(100, Math.round((quotaUsed / quotaLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <BrutalistCard bg="white" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#D7FF3E] border border-[#0D0D0D]">
                WORKSPACE
              </span>
              <span className="font-mono text-xs text-[#0D0D0D]/60">
                @{user?.username || 'developer'}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
              AUDIT DASHBOARD & TRENDS
            </h1>
          </div>

          <button
            onClick={() => onNavigateToScan()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D] font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{ borderRadius: '0px' }}
          >
            <PlayMark size={14} />
            <span>New Audit</span>
          </button>
        </div>

        {/* Quota Usage Bar */}
        <div className="mt-5 pt-4 border-t-2 border-[#0D0D0D] space-y-1.5">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-[#0D0D0D]/70 font-bold uppercase">Monthly Audit Quota</span>
            <span className="font-bold text-[#0D0D0D]">
              {quotaUsed} / {quotaLimit} Audits ({quotaPercent}%)
            </span>
          </div>
          <div
            className="w-full h-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] overflow-hidden"
            style={{ borderRadius: '0px' }}
          >
            <div
              className={`h-full border-r-2 border-[#0D0D0D] transition-all duration-300 ${
                quotaPercent > 80 ? 'bg-[#FF5A36]' : 'bg-[#2B4BF2]'
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>
      </BrutalistCard>

      {/* Main Grid: Per-Repo Trend Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Trend Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
              <div className="flex items-center gap-2">
                <ChartMark size={18} />
                <span className="font-mono text-xs font-bold uppercase text-[#0D0D0D]">
                  Security Score Trend Over Time
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#0D0D0D]/60 uppercase">
                Per-Commit Evolutions
              </span>
            </div>

            {/* Selected Repo Bar */}
            <div className="p-2.5 bg-[#F2EFE9] border-2 border-[#0D0D0D] font-mono text-xs flex items-center justify-between">
              <span className="truncate max-w-[280px] font-bold text-[#0D0D0D]">
                {selectedRepo || 'acme-corp/vulnerable-payment-gateway'}
              </span>
              <span className="text-[10px] text-[#0D0D0D]/60">Tracked Repos</span>
            </div>

            {/* Synthetic Trendline Chart Representation (Pure CSS & SVG) */}
            <div className="p-4 bg-white border-2 border-[#0D0D0D] space-y-4">
              <div className="h-40 flex items-end justify-between gap-3 pt-6 px-2 border-b-2 border-l-2 border-[#0D0D0D]">
                {/* Mock points across 5 commits */}
                {[
                  { commit: 'c3a12', score: 32, grade: 'F', date: 'Sep 20' },
                  { commit: '7b914', score: 45, grade: 'D', date: 'Sep 22' },
                  { commit: 'f012e', score: 68, grade: 'C', date: 'Sep 23' },
                  { commit: '5f159', score: 85, grade: 'B', date: 'Sep 24' },
                  { commit: 'HEAD', score: 96, grade: 'A', date: 'Today' },
                ].map((pt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="font-mono font-bold text-[10px]">{pt.score}%</span>
                    <div
                      className={`w-full max-w-[36px] border-2 border-[#0D0D0D] transition-all ${
                        pt.score >= 80 ? 'bg-[#D7FF3E]' : pt.score >= 60 ? 'bg-[#2B4BF2] text-white' : 'bg-[#FF5A36] text-white'
                      }`}
                      style={{ height: `${pt.score}%`, borderRadius: '0px' }}
                    />
                    <span className="font-mono text-[9px] text-[#0D0D0D]/60 whitespace-nowrap">{pt.commit}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-mono text-[10px] text-[#0D0D0D]/70">
                <span>Baseline (Commit c3a12)</span>
                <span className="font-bold text-[#2B4BF2]">+64% Security Improvement</span>
                <span>Current (HEAD)</span>
              </div>
            </div>
          </BrutalistCard>
        </div>

        {/* Quick Audits List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0D0D0D]">
              <span className="font-mono text-xs font-bold uppercase text-[#0D0D0D]">
                Recent Audits ({history.length})
              </span>
              <button
                onClick={() => onNavigateToScan()}
                className="font-mono text-[10px] font-bold uppercase text-[#2B4BF2] hover:underline cursor-pointer"
              >
                + New
              </button>
            </div>

            {history.length === 0 ? (
              /* Empty state per Section 8 */
              <div className="text-center py-8 space-y-2 border-2 border-dashed border-[#0D0D0D]/30 p-4">
                <RepoCloneMark size={24} className="mx-auto text-[#0D0D0D]/40" />
                <p className="font-mono font-bold text-xs text-[#0D0D0D]">No audits executed yet.</p>
                <p className="font-sans text-[11px] text-[#0D0D0D]/60">Run your first repository scan to populate dashboard metrics.</p>
                <button
                  onClick={() => onNavigateToScan()}
                  className="mt-2 px-3 py-1 bg-[#D7FF3E] border border-[#0D0D0D] font-mono text-[10px] font-bold uppercase cursor-pointer"
                >
                  Run First Audit
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      const rep = auditService.getAuditById(item.id);
                      if (rep) onSelectAudit(rep);
                    }}
                    className="p-3 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-2 shadow-[2px_2px_0px_#0D0D0D]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-bold text-xs truncate text-[#0D0D0D]">
                        {item.repoUrl.replace('https://github.com/', '')}
                      </div>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-[#0D0D0D]/60">
                        <span>{item.commitSha}</span>
                        <span>•</span>
                        <span>{item.findingsCount} findings</span>
                        <span>•</span>
                        <span>{item.plagiarismScore}% match</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <GradeBadge grade={item.securityGrade} size="sm" />
                      <ArrowRightMark size={14} className="text-[#0D0D0D]/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BrutalistCard>
        </div>
      </div>
    </div>
  );
};
