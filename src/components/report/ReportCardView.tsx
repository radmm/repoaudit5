import React, { useState } from 'react';
import { AuditReport, SecurityFinding } from '../../types/audit';
import { BrutalistCard } from '../common/GlassCard';
import { GradeBadge } from '../common/GradeBadge';
import {
  ShieldMark,
  FingerprintMark,
  CopyMark,
  CheckMark,
  ChevronDownMark,
  ChevronRightMark,
  ArrowRightMark,
  ExternalLinkMark,
} from '../common/BrutalistIcon';

interface ReportCardViewProps {
  report: AuditReport;
  onRunNewScan: () => void;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({
  report,
  onRunNewScan,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'plagiarism'>('security');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(
    report.security.findings[0]?.id || null
  );
  const [explainFinding, setExplainFinding] = useState<SecurityFinding | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedDiff, setCopiedDiff] = useState(false);

  const filteredFindings = report.security.findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  const badgeMarkdown = `[![Repo Audited - Grade: ${report.security.grade}](https://repo-auditor.dev/badge/${report.id}.svg)](https://repo-auditor.dev/r/${report.id})`;

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const handleCopyDiff = (diffText: string) => {
    navigator.clipboard.writeText(diffText);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const handleCopyJson = () => {
    const prdJson = {
      repoUrl: report.repoUrl,
      commitSha: report.commitSha,
      timestamp: report.timestamp,
      security: {
        grade: report.security.grade,
        score: report.security.score,
        findings: report.security.findings.map((f) => ({
          file: f.file,
          line: f.line,
          issue: f.issue,
          severity: f.severity,
          patternId: f.patternId,
        })),
      },
      plagiarism: {
        similarity: report.plagiarism.similarity,
        mode: report.plagiarism.mode,
        matches: report.plagiarism.matches.map((m) => ({
          file: m.file,
          matchedWith: m.matchedWith,
          confidence: m.confidence,
        })),
      },
    };

    navigator.clipboard.writeText(JSON.stringify(prdJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <BrutalistCard bg="white" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
                HEAD SHA: {report.commitSha}
              </span>
              {report.isCached && (
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 bg-[#2B4BF2] text-white border border-[#0D0D0D] font-bold">
                  SHA Cache Hit
                </span>
              )}
            </div>

            <h1 className="font-mono font-bold text-base sm:text-lg text-[#0D0D0D] truncate">
              {report.repoUrl}
            </h1>
            {report.compareRepoUrl && (
              <p className="font-mono text-xs text-[#2B4BF2] truncate mt-0.5">
                Pairwise vs {report.compareRepoUrl}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowBadgeModal(true)}
              className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
              style={{ borderRadius: '0px' }}
            >
              <span>Embed Badge</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
              style={{ borderRadius: '0px' }}
            >
              {copiedJson ? <CheckMark size={14} /> : <CopyMark size={14} />}
              <span>{copiedJson ? 'Copied' : 'JSON'}</span>
            </button>
            <button
              onClick={onRunNewScan}
              className="px-4 py-1.5 border-2 border-[#0D0D0D] bg-[#D7FF3E] hover:bg-[#cbf52f] text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              New Audit
            </button>
          </div>
        </div>
      </BrutalistCard>

      {/* 2. Primary Scoreboards: Reveal Moment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Security Score Card (Explicitly Labeled Pattern-Based) */}
        <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b-2 border-[#0D0D0D]">
            <div className="flex items-center gap-3">
              <GradeBadge grade={report.security.grade} size="lg" />
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/60 tracking-wider block">
                  Pattern-Based Security Grade
                </span>
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#0D0D0D]">
                  {report.security.score}
                  <span className="text-xs font-mono text-[#0D0D0D]/60 font-normal">/100</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 font-mono text-xs font-bold uppercase px-2 py-0.5 border-2 border-[#0D0D0D] ${
                  report.security.grade === 'F' || report.security.grade === 'D'
                    ? 'bg-[#FF5A36] text-white'
                    : 'bg-[#D7FF3E] text-[#0D0D0D]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <span>{report.security.grade === 'F' ? '✕' : '✓'}</span>
                <span>{report.security.findings.length} Flagged</span>
              </span>
              <span className="block font-mono text-[9px] text-[#0D0D0D]/60 mt-1 uppercase">
                Grade: {report.security.grade}
              </span>
            </div>
          </div>

          <div className="pt-1 grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-2 bg-[#F2EFE9] border border-[#0D0D0D]">
              <div className="text-[10px] text-[#0D0D0D]/60 uppercase">Critical</div>
              <div className="font-bold text-[#FF5A36]">{report.security.breakdown.critical}</div>
            </div>
            <div className="p-2 bg-[#F2EFE9] border border-[#0D0D0D]">
              <div className="text-[10px] text-[#0D0D0D]/60 uppercase">High</div>
              <div className="font-bold text-[#0D0D0D]">{report.security.breakdown.high}</div>
            </div>
            <div className="p-2 bg-[#F2EFE9] border border-[#0D0D0D]">
              <div className="text-[10px] text-[#0D0D0D]/60 uppercase">Med / Low</div>
              <div className="font-bold text-[#0D0D0D]">
                {report.security.breakdown.medium + report.security.breakdown.low}
              </div>
            </div>
          </div>
        </BrutalistCard>

        {/* Plagiarism Similarity Card (Squared Progress Bar & Corpus Note) */}
        <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b-2 border-[#0D0D0D]">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/60 tracking-wider block">
                Code Similarity / Plagiarism
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#0D0D0D]">
                {report.plagiarism.similarity}%
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 font-mono text-xs font-bold uppercase px-2 py-0.5 border-2 border-[#0D0D0D] ${
                  report.plagiarism.similarity > 50
                    ? 'bg-[#FF5A36] text-white'
                    : 'bg-[#D7FF3E] text-[#0D0D0D]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <span>{report.plagiarism.similarity > 50 ? '⚠ Copycat' : '✓ Original'}</span>
              </span>
              <span className="block font-mono text-[9px] text-[#0D0D0D]/60 mt-1 uppercase">
                Mode: {report.plagiarism.mode}
              </span>
            </div>
          </div>

          {/* Squared Progress Bar */}
          <div className="pt-1 space-y-2">
            <div
              className="w-full h-4 bg-[#F2EFE9] border-2 border-[#0D0D0D] overflow-hidden"
              style={{ borderRadius: '0px' }}
            >
              <div
                className={`h-full border-r-2 border-[#0D0D0D] transition-all duration-300 ${
                  report.plagiarism.similarity > 50 ? 'bg-[#FF5A36]' : 'bg-[#D7FF3E]'
                }`}
                style={{ width: `${report.plagiarism.similarity}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#0D0D0D]/70">
              <span>Fingerprints: {report.plagiarism.fingerprintCount}</span>
              <span>Matched: {report.plagiarism.details.matchedKgrams} k-grams (k=6, w=4)</span>
            </div>
          </div>

          {/* Corpus Mode Plain Disclaimer per Section 3.3 & Section 8 */}
          {report.plagiarism.mode === 'corpus' && (
            <div className="p-2 bg-[#2B4BF2]/10 border border-[#2B4BF2] font-mono text-[10px] text-[#0D0D0D] leading-tight">
              <strong>Notice:</strong> Corpus comparison quality depends on past audits in this workspace. Pairwise comparison against a specific target repository is more reliable.
            </div>
          )}
        </BrutalistCard>
      </div>

      {/* 3. Findings & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#0D0D0D] text-white shadow-[2px_2px_0px_#0D0D0D]'
                  : 'bg-white text-[#0D0D0D] hover:bg-[#F2EFE9]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              Security Findings ({report.security.findings.length})
            </button>
            <button
              onClick={() => setActiveTab('plagiarism')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer ${
                activeTab === 'plagiarism'
                  ? 'bg-[#0D0D0D] text-white shadow-[2px_2px_0px_#0D0D0D]'
                  : 'bg-white text-[#0D0D0D] hover:bg-[#F2EFE9]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              Plagiarism Matches ({report.plagiarism.matches.length})
            </button>
          </div>

          {activeTab === 'security' && (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 mr-1">Filter:</span>
              {['all', 'critical', 'high'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 font-mono text-[10px] uppercase border border-[#0D0D0D] transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-[#D7FF3E] font-bold text-[#0D0D0D]'
                      : 'bg-white text-[#0D0D0D] hover:bg-[#F2EFE9]'
                  }`}
                  style={{ borderRadius: '0px' }}
                >
                  {sev}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Findings Table (Responsive: Desktop Table, Mobile Stacked Cards below 640px) */}
        {activeTab === 'security' && (
          <div className="border-[3px] border-[#0D0D0D] bg-white shadow-[4px_4px_0px_#0D0D0D]">
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[#0D0D0D]/70">
                No security findings matching criteria.
              </div>
            ) : (
              <div className="divide-y-2 divide-[#0D0D0D]">
                {/* Desktop Header row (hidden on mobile) */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2.5 bg-[#E8E4DA] border-b-2 border-[#0D0D0D] font-mono text-xs font-bold uppercase text-[#0D0D0D]">
                  <div className="col-span-2">Severity</div>
                  <div className="col-span-5">File & Line</div>
                  <div className="col-span-5">Pattern & Issue</div>
                </div>

                {filteredFindings.map((finding) => {
                  const isExpanded = expandedFinding === finding.id;

                  return (
                    <div key={finding.id} className="p-3 sm:px-4 sm:py-3 transition-colors bg-[#F2EFE9] hover:bg-white">
                      {/* Responsive Row Layout */}
                      <div
                        className="cursor-pointer flex flex-col sm:grid sm:grid-cols-12 gap-2 items-start sm:items-center"
                        onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                      >
                        {/* Severity Chip with Color + Icon + Text redundancy */}
                        <div className="sm:col-span-2 flex items-center justify-between w-full sm:w-auto">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#0D0D0D] ${
                              finding.severity === 'critical'
                                ? 'bg-[#FF5A36] text-white'
                                : finding.severity === 'high'
                                ? 'bg-[#FF5A36]/20 text-[#0D0D0D]'
                                : 'bg-[#2B4BF2]/20 text-[#0D0D0D]'
                            }`}
                          >
                            <span>{finding.severity === 'critical' ? '▲' : '●'}</span>
                            <span>{finding.severity}</span>
                          </span>

                          <span className="sm:hidden font-mono text-[10px] text-[#0D0D0D]/60">
                            Line {finding.line}
                          </span>
                        </div>

                        {/* File & Line */}
                        <div className="sm:col-span-5 font-mono font-bold text-xs text-[#0D0D0D] break-all sm:truncate">
                          {finding.file}:{finding.line}
                        </div>

                        {/* Issue & Explain Button */}
                        <div className="sm:col-span-5 w-full flex items-center justify-between gap-2 font-mono text-xs">
                          <span className="truncate text-[#0D0D0D]/90">{finding.issue}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExplainFinding(finding);
                              }}
                              className="px-2 py-0.5 bg-[#2B4BF2] hover:bg-[#1e3ac9] text-white font-mono text-[10px] font-bold uppercase border border-[#0D0D0D] transition-all cursor-pointer"
                            >
                              Explain
                            </button>
                            <span className="text-[#0D0D0D]/60">
                              {isExpanded ? <ChevronDownMark size={14} /> : <ChevronRightMark size={14} />}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section with Remediation & Redacted Secret Snippet */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#0D0D0D]/20 space-y-2 bg-white p-3 border border-[#0D0D0D]">
                          {finding.snippet && (
                            <div>
                              <div className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 mb-1 flex items-center justify-between">
                                <span>Source (Line {finding.line}):</span>
                                <span className="text-[#FF5A36] font-bold text-[9px]">
                                  [MATCHED VALUES REDACTED IN STORAGE]
                                </span>
                              </div>
                              <pre className="p-2.5 bg-[#0D0D0D] text-[#D7FF3E] font-mono text-xs overflow-x-auto border border-[#0D0D0D]">
                                <code>{finding.snippet}</code>
                              </pre>
                            </div>
                          )}

                          <div className="font-sans text-xs text-[#0D0D0D] pt-1">
                            <strong className="font-mono font-bold uppercase text-[10px] text-[#2B4BF2] mr-1.5">
                              Remediation:
                            </strong>
                            {finding.remediation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Plagiarism Matches Table */}
        {activeTab === 'plagiarism' && (
          <div className="border-[3px] border-[#0D0D0D] bg-white shadow-[4px_4px_0px_#0D0D0D]">
            {report.plagiarism.matches.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[#0D0D0D]/70">
                No overlapping k-gram fingerprints detected above threshold.
              </div>
            ) : (
              <div className="divide-y-2 divide-[#0D0D0D]">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2.5 bg-[#E8E4DA] border-b-2 border-[#0D0D0D] font-mono text-xs font-bold uppercase text-[#0D0D0D]">
                  <div className="col-span-2">Match %</div>
                  <div className="col-span-5">Target File</div>
                  <div className="col-span-5">Matched Reference</div>
                </div>

                {report.plagiarism.matches.map((match) => (
                  <div key={match.id} className="p-3 sm:px-4 sm:py-3 bg-[#F2EFE9] space-y-2">
                    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-start sm:items-center font-mono text-xs">
                      <div className="sm:col-span-2">
                        <span className="px-2 py-0.5 bg-[#FF5A36] text-white font-bold border border-[#0D0D0D]">
                          {(match.confidence * 100).toFixed(0)}% Match
                        </span>
                      </div>
                      <div className="sm:col-span-5 font-bold text-[#0D0D0D] break-all sm:truncate">
                        {match.file}
                      </div>
                      <div className="sm:col-span-5 text-[#2B4BF2] break-all sm:truncate">
                        {match.matchedWith}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[#0D0D0D]/20">
                      <div className="p-2 bg-white border border-[#0D0D0D]">
                        <span className="font-mono text-[9px] uppercase text-[#0D0D0D]/60 block mb-1">
                          Target Source Segment:
                        </span>
                        <pre className="font-mono text-[11px] text-[#0D0D0D] overflow-x-auto whitespace-pre-wrap">
                          <code>{match.snippet}</code>
                        </pre>
                      </div>
                      <div className="p-2 bg-white border border-[#0D0D0D]">
                        <span className="font-mono text-[9px] uppercase text-[#0D0D0D]/60 block mb-1">
                          Matched Reference Segment (Renamed Identifiers Normalized):
                        </span>
                        <pre className="font-mono text-[11px] text-[#0D0D0D] overflow-x-auto whitespace-pre-wrap">
                          <code>{match.matchedSnippet}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. "Explain This Finding" Modal (Read-Only, Plain-Language + Copyable Diff, NO AUTO-APPLY) */}
      {explainFinding && (
        <div className="fixed inset-0 z-50 bg-[#0D0D0D]/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border-[3px] border-[#0D0D0D] shadow-[6px_6px_0px_#0D0D0D] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b-2 border-[#0D0D0D]">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#FF5A36] block">
                  Finding ID: {explainFinding.patternId}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg uppercase text-[#0D0D0D]">
                  {explainFinding.issue}
                </h3>
              </div>
              <button
                onClick={() => setExplainFinding(null)}
                className="px-2 py-0.5 border border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#0D0D0D] hover:text-white font-mono text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Plain language explanation */}
            <div className="space-y-1.5 font-sans text-xs text-[#0D0D0D]/90 leading-relaxed">
              <strong className="font-mono font-bold uppercase text-[10px] text-[#0D0D0D] block">
                Risk Analysis (Read-Only):
              </strong>
              <p>
                {explainFinding.explanation ||
                  'Exposed credentials or unparameterized queries allow attackers to compromise infrastructure or access unauthorized data records.'}
              </p>
            </div>

            {/* Suggested Diff for Manual Copying */}
            {explainFinding.suggestedDiff && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#0D0D0D]/60 uppercase">
                  <span>Suggested Diff (Copy Manually):</span>
                  <button
                    onClick={() => handleCopyDiff(explainFinding.suggestedDiff!)}
                    className="px-2 py-0.5 bg-[#D7FF3E] text-[#0D0D0D] border border-[#0D0D0D] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedDiff ? <CheckMark size={12} /> : <CopyMark size={12} />}
                    <span>{copiedDiff ? 'Copied Diff' : 'Copy Diff'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#0D0D0D] text-[#D7FF3E] font-mono text-xs overflow-x-auto border-2 border-[#0D0D0D]">
                  <code>{explainFinding.suggestedDiff}</code>
                </pre>
              </div>
            )}

            <div className="p-2.5 bg-[#F2EFE9] border border-[#0D0D0D] font-mono text-[10px] text-[#0D0D0D]/70 leading-tight">
              <strong>Security Protocol Notice:</strong> Repo Auditor never automatically modifies or applies code to untrusted repositories. Please review and apply the patch manually.
            </div>
          </div>
        </div>
      )}

      {/* 5. Embeddable Public Badge Modal (Section 5.2) */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 bg-[#0D0D0D]/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-[3px] border-[#0D0D0D] shadow-[6px_6px_0px_#0D0D0D] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
              <h3 className="font-display font-bold text-base uppercase text-[#0D0D0D]">
                EMBEDDABLE README BADGE
              </h3>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="px-2 py-0.5 border border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#0D0D0D] hover:text-white font-mono text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="font-sans text-xs text-[#0D0D0D]/80">
              Embed this badge in your repository's <code className="font-mono">README.md</code> to publicly showcase your security audit grade.
            </p>

            {/* Badge Preview */}
            <div className="p-4 bg-[#F2EFE9] border-2 border-[#0D0D0D] flex items-center justify-center">
              <div className="inline-flex items-center border border-[#0D0D0D] bg-white font-mono text-xs font-bold">
                <span className="px-2 py-1 bg-[#0D0D0D] text-white">repo auditor</span>
                <span className="px-2 py-1 bg-[#D7FF3E] text-[#0D0D0D]">
                  grade: {report.security.grade}
                </span>
              </div>
            </div>

            {/* Markdown Code */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60">
                Markdown snippet:
              </span>
              <pre className="p-2.5 bg-[#0D0D0D] text-[#D7FF3E] font-mono text-xs overflow-x-auto border border-[#0D0D0D] select-all">
                <code>{badgeMarkdown}</code>
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCopyBadge}
                className="px-4 py-2 bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D] font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] cursor-pointer"
              >
                {copiedBadge ? 'Copied to Clipboard!' : 'Copy Markdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
