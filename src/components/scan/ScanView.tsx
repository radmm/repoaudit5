import React, { useState, useEffect } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  ShieldMark,
  FingerprintMark,
  RepoCloneMark,
  CompareMark,
  PlayMark,
  ArrowRightMark,
  CheckMark,
} from '../common/BrutalistIcon';
import { PRESET_REPOSITORIES, PresetRepo } from '../../services/repoIngestion';
import { auditService } from '../../services/auditService';
import { AuditReport, AuditJob, JobStatus } from '../../types/audit';

interface ScanViewProps {
  onAuditComplete: (report: AuditReport) => void;
  initialPresetId?: string;
  initialRepoUrl?: string;
  initialCompareUrl?: string;
}

export const ScanView: React.FC<ScanViewProps> = ({
  onAuditComplete,
  initialPresetId,
  initialRepoUrl,
  initialCompareUrl,
}) => {
  const [repoUrl, setRepoUrl] = useState(
    initialRepoUrl || 'https://github.com/acme-corp/vulnerable-payment-gateway'
  );
  const [compareRepoUrl, setCompareRepoUrl] = useState(initialCompareUrl || '');
  const [isPairwiseMode, setIsPairwiseMode] = useState(Boolean(initialCompareUrl));
  const [forceRescan, setForceRescan] = useState(false);

  // Async Job State per Section 4.6 & 4.7
  const [currentJob, setCurrentJob] = useState<AuditJob | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (initialPresetId) {
      const preset = PRESET_REPOSITORIES.find((p) => p.id === initialPresetId);
      if (preset) {
        handleSelectPreset(preset);
      }
    }
  }, [initialPresetId]);

  const handleSelectPreset = (preset: PresetRepo) => {
    setCurrentJob(null);
    setRepoUrl(preset.url);
    if (preset.compareFiles) {
      setIsPairwiseMode(true);
      setCompareRepoUrl('https://github.com/student-forks/lab3-bst-renamed');
    } else {
      setIsPairwiseMode(false);
      setCompareRepoUrl('');
    }
  };

  const handleStartAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsScanning(true);
    // Enqueue async job
    const job = auditService.enqueueJob(
      repoUrl.trim(),
      isPairwiseMode && compareRepoUrl.trim() ? compareRepoUrl.trim() : undefined,
      forceRescan
    );
    setCurrentJob(job);

    // Poll live status until completion or failure
    const pollInterval = setInterval(() => {
      const live = auditService.getJob(job.id);
      if (!live) {
        clearInterval(pollInterval);
        setIsScanning(false);
        return;
      }
      setCurrentJob({ ...live });

      if (live.status === 'done' && live.result) {
        clearInterval(pollInterval);
        setIsScanning(false);
        setTimeout(() => {
          onAuditComplete(live.result!);
        }, 500);
      } else if (live.status === 'failed') {
        clearInterval(pollInterval);
        setIsScanning(false);
      }
    }, 150);
  };

  const getStepStatus = (step: JobStatus) => {
    if (!currentJob) return 'waiting';
    const sequence: JobStatus[] = ['queued', 'cloning', 'scanning', 'aggregating', 'done'];
    const currentIdx = sequence.indexOf(currentJob.status);
    const stepIdx = sequence.indexOf(step);

    if (currentJob.status === 'failed') {
      return currentIdx === stepIdx ? 'failed' : currentIdx > stepIdx ? 'completed' : 'waiting';
    }
    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'waiting';
  };

  return (
    <div className="space-y-6">
      {/* 1. Specifications & Engine Banner */}
      <BrutalistCard bg="white" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#D7FF3E] border border-[#0D0D0D]">
                DUAL-ENGINE SCANNER
              </span>
              <span className="font-mono text-xs text-[#0D0D0D]/60">
                ASYNC WORKER • SHADOW EXECUTION
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase text-[#0D0D0D]">
              AUDIT REPOSITORY
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={forceRescan}
                onChange={(e) => setForceRescan(e.target.checked)}
                className="w-4 h-4 border border-[#0D0D0D] accent-[#0D0D0D]"
              />
              <span className="text-[#0D0D0D]/80">Bypass SHA Cache</span>
            </label>
          </div>
        </div>
      </BrutalistCard>

      {/* 2. Main Audit Form Input */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <form onSubmit={handleStartAudit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#0D0D0D] flex items-center gap-2">
              <RepoCloneMark size={18} />
              GitHub Repository URL
            </label>

            <button
              type="button"
              onClick={() => setIsPairwiseMode(!isPairwiseMode)}
              className="font-mono text-xs font-bold uppercase text-[#2B4BF2] hover:underline cursor-pointer text-left sm:text-right"
            >
              {isPairwiseMode ? '[-] Switch to Single Repo' : '[+] Add Pairwise Suspect Repo'}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              disabled={isScanning}
              className="w-full px-4 py-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] text-[#0D0D0D] font-mono text-xs sm:text-sm placeholder-[#0D0D0D]/40 focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0D0D0D]"
              style={{ borderRadius: '0px' }}
            />
          </div>

          {/* Secondary input if pairwise comparison mode */}
          {isPairwiseMode && (
            <div className="p-3 bg-[#2B4BF2]/10 border-2 border-[#2B4BF2] space-y-2">
              <label className="font-mono text-xs font-bold uppercase text-[#2B4BF2] flex items-center gap-2">
                <CompareMark size={16} />
                Suspect / Comparison Repository URL (Pairwise Target)
              </label>
              <input
                type="text"
                value={compareRepoUrl}
                onChange={(e) => setCompareRepoUrl(e.target.value)}
                placeholder="https://github.com/student-forks/lab3-bst-renamed"
                disabled={isScanning}
                className="w-full px-3 py-2 bg-white border-2 border-[#0D0D0D] text-[#0D0D0D] font-mono text-xs focus:outline-none"
                style={{ borderRadius: '0px' }}
              />
              <p className="font-mono text-[10px] text-[#0D0D0D]/70">
                Identifier-normalization pass strips comments and variable names before winnowing tokenization.
              </p>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="font-mono text-xs text-[#0D0D0D]/60 hidden sm:inline">
              JGit depth=1 shallow clone into ephemeral worker
            </span>

            <button
              type="submit"
              disabled={isScanning}
              className={`w-full sm:w-auto px-8 py-3.5 font-display font-extrabold text-sm uppercase tracking-wider border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
                isScanning
                  ? 'bg-[#E8E4DA] text-[#0D0D0D]/40 cursor-not-allowed'
                  : 'bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {isScanning ? 'Queued & Scanning...' : 'Start Audit'}
            </button>
          </div>
        </form>
      </BrutalistCard>

      {/* 3. Job-in-Progress View (Section 4.6 & 4.7: Live Status in Martian Mono) */}
      {currentJob && (
        <BrutalistCard
          bg="white"
          className={`p-5 sm:p-6 space-y-4 border-[3px] ${
            currentJob.status === 'failed' ? 'border-[#FF5A36]' : 'border-[#0D0D0D]'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 block">
                Job ID: {currentJob.id}
              </span>
              <h2 className="font-mono font-bold text-sm uppercase text-[#0D0D0D]">
                {currentJob.status === 'failed' ? 'Audit Job Terminated' : currentJob.progressMessage}
              </h2>
            </div>

            <span
              className={`font-mono text-xs font-bold uppercase px-2.5 py-1 border-2 border-[#0D0D0D] ${
                currentJob.status === 'failed'
                  ? 'bg-[#FF5A36] text-white'
                  : currentJob.status === 'done'
                  ? 'bg-[#D7FF3E] text-[#0D0D0D]'
                  : 'bg-[#2B4BF2] text-white'
              }`}
            >
              {currentJob.status}
            </span>
          </div>

          {/* Stepper Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {[
              { id: 'queued', label: '01 / Queued' },
              { id: 'cloning', label: '02 / JGit Clone' },
              { id: 'scanning', label: '03 / Dual Scanners' },
              { id: 'aggregating', label: '04 / Report Done' },
            ].map((st) => {
              const state = getStepStatus(st.id as JobStatus);
              return (
                <div
                  key={st.id}
                  className={`p-2 border-2 border-[#0D0D0D] text-center font-bold ${
                    state === 'completed'
                      ? 'bg-[#D7FF3E] text-[#0D0D0D]'
                      : state === 'active'
                      ? 'bg-[#2B4BF2] text-white animate-pulse'
                      : state === 'failed'
                      ? 'bg-[#FF5A36] text-white'
                      : 'bg-[#F2EFE9] text-[#0D0D0D]/40'
                  }`}
                >
                  {st.label}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] overflow-hidden"
            style={{ borderRadius: '0px' }}
          >
            <div
              className={`h-full border-r-2 border-[#0D0D0D] transition-all duration-300 ${
                currentJob.status === 'failed' ? 'bg-[#FF5A36]' : 'bg-[#D7FF3E]'
              }`}
              style={{ width: `${currentJob.progressPercent}%` }}
            />
          </div>

          {/* Specific failureReason banner per Section 4.6 & Section 8 */}
          {currentJob.status === 'failed' && (
            <div className="p-4 bg-[#FF5A36]/10 border-2 border-[#FF5A36] text-[#0D0D0D] space-y-2">
              <div className="font-mono text-xs font-bold text-[#FF5A36] uppercase flex items-center gap-1.5">
                <span>✕ Scan Failure Notice</span>
              </div>
              <p className="font-sans text-xs text-[#0D0D0D] leading-relaxed">
                {currentJob.failureReason ||
                  'The audit failed due to network unreachable repository tree or permission error.'}
              </p>
              <button
                type="button"
                onClick={() => setCurrentJob(null)}
                className="mt-2 px-3 py-1 bg-white border border-[#0D0D0D] font-mono text-[10px] font-bold uppercase cursor-pointer"
              >
                Dismiss & Retry
              </button>
            </div>
          )}
        </BrutalistCard>
      )}

      {/* 4. Preloaded Presets Grid */}
      <div className="space-y-3">
        <h2 className="font-mono font-bold text-xs uppercase text-[#0D0D0D]">
          Sample Evaluation Repositories
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_REPOSITORIES.map((preset) => (
            <BrutalistCard
              key={preset.id}
              bg="white"
              onClick={() => handleSelectPreset(preset)}
              className="p-4 hover:bg-[#F2EFE9] transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between pb-1 border-b border-[#0D0D0D]/20">
                <span className="font-mono font-bold text-xs text-[#0D0D0D] truncate">
                  {preset.name}
                </span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-mono font-bold border border-[#0D0D0D] ${
                    preset.expectedSecurityGrade === 'F'
                      ? 'bg-[#FF5A36] text-white'
                      : preset.expectedSecurityGrade === 'A'
                      ? 'bg-[#D7FF3E] text-[#0D0D0D]'
                      : 'bg-[#2B4BF2] text-white'
                  }`}
                >
                  {preset.expectedSecurityGrade ? `Grade: ${preset.expectedSecurityGrade}` : `${preset.expectedPlagiarism}`}
                </span>
              </div>
              <p className="font-sans text-[11px] text-[#0D0D0D]/70 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
              <div className="font-mono text-[10px] text-[#2B4BF2] font-bold uppercase">
                Load Target →
              </div>
            </BrutalistCard>
          ))}
        </div>
      </div>
    </div>
  );
};
