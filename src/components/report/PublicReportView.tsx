import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  ShieldMark,
  FingerprintMark,
  CheckMark,
  CopyMark,
  ArrowRightMark,
  ExternalLinkMark,
} from '../common/BrutalistIcon';
import { AuditReport } from '../../types/audit';

interface PublicReportViewProps {
  report: AuditReport;
  onNavigateHome: () => void;
  onAuditOwnRepo: () => void;
}

export const PublicReportView: React.FC<PublicReportViewProps> = ({
  report,
  onNavigateHome,
  onAuditOwnRepo,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const origin = window.location.origin;
  const badgeSvgUrl = `${origin}/badge/${report.id}.svg`;
  const reportUrl = `${origin}/r/${report.id}`;

  const markdownSnippet = `[![Repo Auditor Grade](${badgeSvgUrl})](${reportUrl})`;
  const htmlSnippet = `<a href="${reportUrl}"><img src="${badgeSvgUrl}" alt="Repo Auditor Security Grade" /></a>`;

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdownSnippet);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const grade = report.security.grade;
  const gradeColor =
    grade === 'A' ? 'bg-[#3FB950] text-[#0D0D0D]' :
    grade === 'B' ? 'bg-[#D29922] text-[#0D0D0D]' :
    'bg-[#FF5A36] text-white';

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Top Banner with Public Notice */}
      <div className="bg-[#D7FF3E] border-[3px] border-[#0D0D0D] p-3 shadow-[3px_3px_0px_#0D0D0D] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-[#0D0D0D] text-white font-bold text-[10px] uppercase">
            PUBLIC AUDIT REPORT
          </span>
          <span className="font-bold text-[#0D0D0D]">
            Verified security & code integrity report for{' '}
            <code className="bg-white px-1.5 py-0.5 border border-[#0D0D0D]">
              {report.repoUrl.replace('https://github.com/', '')}
            </code>
          </span>
        </div>
        <button
          onClick={onAuditOwnRepo}
          className="px-3 py-1 bg-[#0D0D0D] text-white hover:bg-[#2B4BF2] font-bold uppercase text-[11px] cursor-pointer shadow-[1px_1px_0px_#0D0D0D]"
        >
          Audit Your Repository Free →
        </button>
      </div>

      {/* Main Header Card */}
      <BrutalistCard bg="white" hero className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#0D0D0D]">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#0D0D0D]/60 block mb-1">
              Audit ID: {report.id} • {new Date(report.timestamp).toLocaleDateString()}
            </span>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
              {report.repoUrl.replace('https://github.com/', '')}
            </h1>
            {report.commitSha && (
              <span className="font-mono text-xs text-[#0D0D0D]/70 block mt-1">
                Commit SHA: <code className="bg-[#F2EFE9] px-1 py-0.5 border border-[#0D0D0D]">{report.commitSha.substring(0, 10)}</code>
              </span>
            )}
          </div>

          {/* Grade Badge Big */}
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 border-[3px] border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] flex flex-col items-center justify-center font-display font-black text-3xl ${gradeColor}`}>
              <span>{grade}</span>
            </div>
            <div className="font-mono text-xs">
              <span className="font-bold block text-sm">Security Score</span>
              <span className="text-xl font-extrabold">{report.security.score}/100</span>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D]">
            <span className="text-[10px] uppercase text-[#0D0D0D]/60 block">Security Grade</span>
            <strong className="text-base text-[#0D0D0D]">Grade {grade}</strong>
          </div>
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D]">
            <span className="text-[10px] uppercase text-[#0D0D0D]/60 block">Plagiarism / Overlap</span>
            <strong className="text-base text-[#0D0D0D]">{report.plagiarism.similarity}%</strong>
          </div>
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D]">
            <span className="text-[10px] uppercase text-[#0D0D0D]/60 block">Vulnerabilities</span>
            <strong className="text-base text-[#0D0D0D]">{report.security.findings.length} Flagged</strong>
          </div>
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D]">
            <span className="text-[10px] uppercase text-[#0D0D0D]/60 block">Status</span>
            <strong className="text-base text-[#3FB950]">Verified</strong>
          </div>
        </div>
      </BrutalistCard>

      {/* Embed Badge Snippets Section */}
      <BrutalistCard bg="white" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono font-bold text-xs uppercase text-[#0D0D0D]">
            Embed Verified Audit Badge in README
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#0D0D0D]/60">Live Badge Preview:</span>
            <img src={badgeSvgUrl} alt="Badge Preview" className="h-5 border border-[#0D0D0D]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Markdown Embed */}
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span>Markdown (for README.md):</span>
              <button
                type="button"
                onClick={handleCopyMd}
                className="px-2 py-0.5 bg-white border border-[#0D0D0D] text-[9px] uppercase font-bold flex items-center gap-1 hover:bg-[#D7FF3E] cursor-pointer"
              >
                {copiedMd ? <CheckMark size={10} /> : <CopyMark size={10} />}
                <span>{copiedMd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 bg-white border border-[#0D0D0D] text-[10px] break-all select-all text-[#0D0D0D]">
              {markdownSnippet}
            </code>
          </div>

          {/* HTML Embed */}
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span>HTML Embed:</span>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-2 py-0.5 bg-white border border-[#0D0D0D] text-[9px] uppercase font-bold flex items-center gap-1 hover:bg-[#D7FF3E] cursor-pointer"
              >
                {copiedHtml ? <CheckMark size={10} /> : <CopyMark size={10} />}
                <span>{copiedHtml ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 bg-white border border-[#0D0D0D] text-[10px] break-all select-all text-[#0D0D0D]">
              {htmlSnippet}
            </code>
          </div>
        </div>
      </BrutalistCard>

      {/* Security Findings List */}
      <BrutalistCard bg="white" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#0D0D0D]">
          <h2 className="font-mono font-bold text-xs uppercase text-[#0D0D0D]">
            Security Findings ({report.security.findings.length})
          </h2>
          <span className="font-mono text-[10px] text-[#0D0D0D]/60">
            Secrets sanitized & redacted
          </span>
        </div>

        {report.security.findings.length === 0 ? (
          <div className="p-6 text-center bg-[#F2EFE9] border border-[#0D0D0D] space-y-1">
            <span className="font-mono font-bold text-sm text-[#3FB950]">
              ✓ No Security Vulnerabilities Found
            </span>
            <p className="font-sans text-xs text-[#0D0D0D]/70">
              This repository conforms to credential hygiene and parameter binding best practices.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.security.findings.map((f, idx) => (
              <div key={idx} className="p-4 bg-[#F2EFE9] border border-[#0D0D0D] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 border border-[#0D0D0D] font-mono text-[10px] font-bold uppercase ${
                        f.severity === 'critical' ? 'bg-[#FF5A36] text-white' :
                        f.severity === 'high' ? 'bg-[#FF5A36]/80 text-white' :
                        f.severity === 'medium' ? 'bg-[#D29922] text-[#0D0D0D]' :
                        'bg-[#D7FF3E] text-[#0D0D0D]'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="font-mono font-bold text-xs text-[#0D0D0D]">
                      {f.issue}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#0D0D0D]/70">
                    {f.file}:{f.line}
                  </span>
                </div>

                {f.snippet && (
                  <pre className="p-2.5 bg-[#0D0D0D] text-[#D7FF3E] font-mono text-xs overflow-x-auto border border-[#0D0D0D]">
                    {f.snippet}
                  </pre>
                )}

                {f.remediation && (
                  <div className="text-xs font-mono text-[#0D0D0D]/80 bg-white p-2 border border-[#0D0D0D]">
                    <strong>Remediation:</strong> {f.remediation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </BrutalistCard>

      {/* Bottom CTA Card */}
      <div className="p-6 bg-[#0D0D0D] text-white border-[3px] border-[#0D0D0D] shadow-[4px_4px_0px_#D7FF3E] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div>
          <h3 className="font-display font-extrabold text-base uppercase text-[#D7FF3E]">
            Audit Your Own Public or Private GitHub Repos
          </h3>
          <p className="font-sans text-xs text-white/80 mt-0.5">
            Identify hardcoded credentials, injection vectors, and plagiarism across commits in seconds.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNavigateHome}
            className="px-3 py-2 bg-transparent hover:bg-white/10 text-white border border-white font-bold uppercase text-xs cursor-pointer"
          >
            Back Home
          </button>
          <button
            onClick={onAuditOwnRepo}
            className="px-4 py-2 bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D] font-bold uppercase text-xs cursor-pointer shadow-[2px_2px_0px_#FFFFFF]"
          >
            Start Free Audit →
          </button>
        </div>
      </div>
    </div>
  );
};
