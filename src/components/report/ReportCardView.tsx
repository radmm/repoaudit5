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
  const [copied, setCopied] = useState(false);

  const filteredFindings = report.security.findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  const handleCopyJson = () => {
    const prdJson = {
      repoUrl: report.repoUrl,
      timestamp: report.timestamp,
      security: {
        grade: report.security.grade,
        score: report.security.score,
        findings: report.security.findings.map((f) => ({
          file: f.file,
          line: f.line,
          issue: f.issue,
          severity: f.severity,
        })),
      },
      plagiarism: {
        similarity: report.plagiarism.similarity,
        matches: report.plagiarism.matches.map((m) => ({
          file: m.file,
          matchedWith: m.matchedWith,
          confidence: m.confidence,
        })),
      },
    };

    navigator.clipboard.writeText(JSON.stringify(prdJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `audit-${report.id}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <BrutalistCard bg="white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
              {new Date(report.timestamp).toLocaleString()}
            </span>
            <h1 className="font-mono font-bold text-base sm:text-lg text-[#0D0D0D] truncate">
              {report.repoUrl}
            </h1>
            {report.compareRepoUrl && (
              <p className="font-mono text-xs text-[#2B4BF2] truncate mt-0.5">
                vs {report.compareRepoUrl}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
              style={{ borderRadius: '0px' }}
            >
              {copied ? <CheckMark size={14} /> : <CopyMark size={14} />}
              {copied ? 'Copied' : 'JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-white text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              Export
            </button>
            <button
              onClick={onRunNewScan}
              className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#D7FF3E] hover:bg-[#cbf52f] text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              Rescan
            </button>
          </div>
        </div>
      </BrutalistCard>

      {/* Primary Scoreboards: Reveal Moment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security Score Card */}
        <BrutalistCard bg="white">
          <div className="flex items-start justify-between pb-3 border-b-2 border-[#0D0D0D]">
            <div className="flex items-center gap-3">
              <GradeBadge grade={report.security.grade} size="lg" />
              <div>
                <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
                  Security Grade
                </span>
                <div className="font-display font-extrabold text-2xl text-[#0D0D0D]">
                  {report.security.score}
                  <span className="text-xs font-mono text-[#0D0D0D]/60 font-normal">/100</span>
                </div>
              </div>
            </div>

            <span
              className={`font-mono text-xs font-bold uppercase px-2 py-0.5 border-2 border-[#0D0D0D] ${
                report.security.grade === 'F' || report.security.grade === 'D'
                  ? 'bg-[#FF5A36] text-white'
                  : 'bg-[#D7FF3E] text-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {report.security.findings.length} Flagged
            </span>
          </div>

          <div className="pt-3 grid grid-cols-3 gap-2 font-mono text-xs">
            <div>
              <div className="text-[10px] text-[#0D0D0D]/60 uppercase">Critical</div>
              <div className="font-bold text-[#FF5A36]">{report.security.breakdown.critical}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#0D0D0D]/60 uppercase">High</div>
              <div className="font-bold text-[#0D0D0D]">{report.security.breakdown.high}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#0D0D0D]/60 uppercase">Med / Low</div>
              <div className="font-bold text-[#0D0D0D]">
                {report.security.breakdown.medium + report.security.breakdown.low}
              </div>
            </div>
          </div>
        </BrutalistCard>

        {/* Plagiarism Similarity Card */}
        <BrutalistCard bg="white">
          <div className="flex items-start justify-between pb-3 border-b-2 border-[#0D0D0D]">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
                Originality / Similarity
              </span>
              <div className="font-mono font-extrabold text-3xl text-[#0D0D0D]">
                {report.plagiarism.similarity}%
              </div>
            </div>

            <span
              className={`font-mono text-xs font-bold uppercase px-2 py-0.5 border-2 border-[#0D0D0D] ${
                report.plagiarism.similarity > 50
                  ? 'bg-[#FF5A36] text-white'
                  : 'bg-[#D7FF3E] text-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {report.plagiarism.similarity > 50 ? 'Copy Detected' : 'Original'}
            </span>
          </div>

          {/* Squared Progress Bar */}
          <div className="pt-3 space-y-2">
            <div
              className="w-full h-4 bg-[#F2EFE9] border-2 border-[#0D0D0D] overflow-hidden"
              style={{ borderRadius: '0px' }}
            >
              <div
                className={`h-full border-r-2 border-[#0D0D0D] ${
                  report.plagiarism.similarity > 50 ? 'bg-[#FF5A36]' : 'bg-[#D7FF3E]'
                }`}
                style={{ width: `${report.plagiarism.similarity}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#0D0D0D]/70">
              <span>Fingerprints: {report.plagiarism.fingerprintCount}</span>
              <span>Matched: {report.plagiarism.details.matchedKgrams} k-grams</span>
            </div>
          </div>
        </BrutalistCard>
      </div>

      {/* Tabs & Filter Bar (Quiet, Professional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
            style={{ borderRadius: '0px' }}
          >
            Security ({report.security.findings.length})
          </button>
          <button
            onClick={() => setActiveTab('plagiarism')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer ${
              activeTab === 'plagiarism'
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white text-[#0D0D0D] hover:bg-[#F2EFE9]'
            }`}
            style={{ borderRadius: '0px' }}
          >
            Plagiarism ({report.plagiarism.matches.length})
          </button>
        </div>

        {activeTab === 'security' && (
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-[#0D0D0D]/60 text-[10px] uppercase">Filter:</span>
            {['all', 'critical', 'high', 'medium'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 uppercase border border-[#0D0D0D] text-[10px] transition-all cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-[#D7FF3E] font-bold text-[#0D0D0D]'
                    : 'bg-white text-[#0D0D0D]/80 hover:bg-[#F2EFE9]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                {sev}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Findings Table (Clean Ink on Off-White, 3px Bottom Border on Sticky Header, Zebra Striping) */}
      {activeTab === 'security' && (
        <div
          className="border-[3px] border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] bg-white overflow-hidden"
          style={{ borderRadius: '0px' }}
        >
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#0D0D0D]/70">
              No security findings matching criteria.
            </div>
          ) : (
            <div className="divide-y divide-[#0D0D0D]/20">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#E8E4DA] border-b-[3px] border-[#0D0D0D] font-mono text-xs font-bold uppercase text-[#0D0D0D]">
                <div className="col-span-2">Severity</div>
                <div className="col-span-5">File & Line</div>
                <div className="col-span-5">Issue</div>
              </div>

              {/* Rows */}
              {filteredFindings.map((finding, idx) => {
                const isExpanded = expandedFinding === finding.id;
                const isZebra = idx % 2 === 1;

                return (
                  <div
                    key={finding.id}
                    className={`transition-colors cursor-pointer ${
                      isZebra ? 'bg-[#E8E4DA]' : 'bg-[#F2EFE9]'
                    }`}
                    onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                  >
                    <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center font-mono text-xs">
                      {/* Severity Chip */}
                      <div className="col-span-2">
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[10px] font-bold uppercase border border-[#0D0D0D] ${
                            finding.severity === 'critical'
                              ? 'bg-[#FF5A36] text-white'
                              : finding.severity === 'high'
                              ? 'bg-[#FF5A36]/20 text-[#0D0D0D]'
                              : 'bg-[#2B4BF2]/20 text-[#0D0D0D]'
                          }`}
                          style={{ borderRadius: '0px' }}
                        >
                          {finding.severity}
                        </span>
                      </div>

                      {/* File & Line */}
                      <div className="col-span-5 font-bold text-[#0D0D0D] truncate">
                        {finding.file}:{finding.line}
                      </div>

                      {/* Issue */}
                      <div className="col-span-5 flex items-center justify-between text-[#0D0D0D]/90">
                        <span className="truncate">{finding.issue}</span>
                        <span className="shrink-0 text-[#0D0D0D]/60 pl-2">
                          {isExpanded ? <ChevronDownMark size={14} /> : <ChevronRightMark size={14} />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Code & Remediation (Let breathe without over-bordered nesting) */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 space-y-2 border-t border-[#0D0D0D]/20 bg-white">
                        {finding.snippet && (
                          <div>
                            <div className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 mb-0.5">
                              Source (Line {finding.line}):
                            </div>
                            <pre
                              className="p-2.5 bg-[#0D0D0D] text-[#D7FF3E] font-mono text-xs overflow-x-auto border border-[#0D0D0D]"
                              style={{ borderRadius: '0px' }}
                            >
                              <code>{finding.snippet}</code>
                            </pre>
                          </div>
                        )}

                        <div className="font-sans text-xs text-[#0D0D0D] pt-1">
                          <strong className="font-mono font-bold uppercase text-[10px] text-[#2B4BF2] mr-1.5">
                            Fix:
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
        <div
          className="border-[3px] border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] bg-white overflow-hidden"
          style={{ borderRadius: '0px' }}
        >
          {report.plagiarism.matches.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#0D0D0D]/70">
              No overlapping k-gram fingerprints detected above threshold.
            </div>
          ) : (
            <div className="divide-y divide-[#0D0D0D]/20">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#E8E4DA] border-b-[3px] border-[#0D0D0D] font-mono text-xs font-bold uppercase text-[#0D0D0D]">
                <div className="col-span-2">Match %</div>
                <div className="col-span-5">Target File</div>
                <div className="col-span-5">Matched Reference</div>
              </div>

              {/* Rows */}
              {report.plagiarism.matches.map((match, idx) => {
                const isZebra = idx % 2 === 1;
                return (
                  <div
                    key={match.id}
                    className={`p-3 space-y-2 ${isZebra ? 'bg-[#E8E4DA]' : 'bg-[#F2EFE9]'}`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center font-mono text-xs">
                      <div className="col-span-2">
                        <span
                          className="px-1.5 py-0.2 bg-[#2B4BF2] text-white font-bold border border-[#0D0D0D]"
                          style={{ borderRadius: '0px' }}
                        >
                          {Math.round(match.confidence * 100)}%
                        </span>
                      </div>
                      <div className="col-span-5 font-bold truncate text-[#0D0D0D]">
                        {match.file}
                      </div>
                      <div className="col-span-5 truncate text-[#0D0D0D]/70">
                        {match.matchedWith}
                      </div>
                    </div>

                    <div className="font-mono text-[10px] text-[#0D0D0D]/70">
                      Lines: {match.matchedLinesRange} ({match.tokenOverlapCount} overlapping k-grams)
                    </div>

                    {match.snippet && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs pt-1">
                        <div
                          className="p-2 bg-white border border-[#0D0D0D]"
                          style={{ borderRadius: '0px' }}
                        >
                          <div className="text-[10px] uppercase text-[#0D0D0D]/60 mb-1">
                            Target Code:
                          </div>
                          <pre className="text-[#0D0D0D] overflow-x-auto text-[11px] whitespace-pre-wrap">
                            {match.snippet}
                          </pre>
                        </div>

                        <div
                          className="p-2 bg-white border border-[#0D0D0D]"
                          style={{ borderRadius: '0px' }}
                        >
                          <div className="text-[10px] uppercase text-[#2B4BF2] mb-1">
                            Reference Code:
                          </div>
                          <pre className="text-[#0D0D0D] overflow-x-auto text-[11px] whitespace-pre-wrap">
                            {match.matchedSnippet}
                          </pre>
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
    </div>
  );
};
