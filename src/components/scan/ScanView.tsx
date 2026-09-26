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
} from '../common/BrutalistIcon';
import { PRESET_REPOSITORIES, PresetRepo } from '../../services/repoIngestion';
import { auditService } from '../../services/auditService';
import { AuditReport } from '../../types/audit';

interface ScanViewProps {
  onAuditComplete: (report: AuditReport) => void;
  initialPresetId?: string;
}

export const ScanView: React.FC<ScanViewProps> = ({
  onAuditComplete,
  initialPresetId,
}) => {
  const [repoUrl, setRepoUrl] = useState(
    'https://github.com/acme-corp/vulnerable-payment-gateway'
  );
  const [compareRepoUrl, setCompareRepoUrl] = useState('');
  const [isPairwiseMode, setIsPairwiseMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectPreset = (preset: PresetRepo) => {
    setErrorMessage(null);
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

    setErrorMessage(null);
    setIsScanning(true);
    setProgressPercent(15);
    setProgressMsg('Cloning repository...');

    try {
      const report = await auditService.runAudit(
        repoUrl.trim(),
        isPairwiseMode && compareRepoUrl.trim() ? compareRepoUrl.trim() : undefined,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        }
      );

      setTimeout(() => {
        setIsScanning(false);
        onAuditComplete(report);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Audit failed. Check the repository URL.');
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section: Asymmetric grid with controlled tilt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Headline & Pitch (7 cols) */}
        <div className="lg:col-span-8">
          <BrutalistCard hero bg="white" className="relative overflow-visible">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#D7FF3E] border-2 border-[#0D0D0D]">
                DUAL-ENGINE SCANNER
              </span>
              <span className="font-mono text-xs text-[#0D0D0D]/60">
                JAVA 17 / JGIT / WINNOWING
              </span>
            </div>

            {/* Oversized wide headline breaking out */}
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-[#0D0D0D] leading-[0.9] -mr-2">
              AUDIT ANY REPOSITORY.
            </h1>

            <p className="mt-4 text-[#0D0D0D]/80 font-sans text-sm sm:text-base max-w-xl leading-relaxed">
              Computes a static security grade (A–F) and a language-agnostic code originality score (0–100%) in parallel using tokenized winnowing fingerprint hashes.
            </p>
          </BrutalistCard>
        </div>

        {/* Right Feature Card with subtle deliberate rotation (4 cols) */}
        <div className="lg:col-span-4">
          <BrutalistCard
            rotate="1.5deg"
            bg="paper"
            className="hover:rotate-0 transition-transform"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0D0D0D] mb-3">
              <span className="font-mono text-xs font-bold uppercase">Specifications</span>
              <span className="w-3 h-3 bg-[#D7FF3E] border border-[#0D0D0D]" />
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#0D0D0D]/70">Security:</span>
                <span className="font-bold">Regex + CVEs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0D0D0D]/70">Plagiarism:</span>
                <span className="font-bold">k=6, w=4 MOSS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0D0D0D]/70">Concurrency:</span>
                <span className="font-bold">CompletableFuture</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0D0D0D]/70">Persistence:</span>
                <span className="font-bold">JDBC Schema</span>
              </div>
            </div>
          </BrutalistCard>
        </div>
      </div>

      {/* Primary Input Container */}
      <BrutalistCard hero bg="white">
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
              {isPairwiseMode ? '[-] Single Repo Mode' : '[+] Compare Against Second Repo'}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              disabled={isScanning}
              className="w-full px-4 py-3.5 bg-[#F2EFE9] border-[3px] border-[#0D0D0D] text-[#0D0D0D] font-mono text-sm placeholder-[#0D0D0D]/40 focus:outline-none focus:bg-white shadow-[3px_3px_0px_#0D0D0D]"
              style={{ borderRadius: '0px' }}
            />
          </div>

          {/* Optional Pairwise Comparison Field */}
          {isPairwiseMode && (
            <div className="p-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] space-y-2">
              <label className="font-mono text-xs font-bold uppercase text-[#2B4BF2] flex items-center gap-2">
                <CompareMark size={16} />
                Suspect / Comparison Repository URL
              </label>
              <input
                type="text"
                value={compareRepoUrl}
                onChange={(e) => setCompareRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/suspect-repo"
                disabled={isScanning}
                className="w-full px-3 py-2 bg-white border-2 border-[#0D0D0D] text-[#0D0D0D] font-mono text-xs focus:outline-none"
                style={{ borderRadius: '0px' }}
              />
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-[#FF5A36]/10 border-2 border-[#FF5A36] text-[#0D0D0D] font-mono text-xs flex items-center justify-between">
              <span className="font-bold">Error: {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-2 py-0.5 border border-[#0D0D0D] bg-white text-[10px] uppercase font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <span className="font-mono text-xs text-[#0D0D0D]/60 hidden sm:inline">
              Depth-1 shallow clone & parallel scanner invocation
            </span>

            <button
              type="submit"
              disabled={isScanning}
              className={`w-full sm:w-auto px-8 py-3.5 font-display font-extrabold text-sm uppercase tracking-wider border-[3px] border-[#0D0D0D] shadow-[4px_4px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0D0D0D] transition-all cursor-pointer ${
                isScanning
                  ? 'bg-[#E8E4DA] text-[#0D0D0D]/40 cursor-not-allowed'
                  : 'bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {isScanning ? 'Auditing...' : 'Audit Repository'}
            </button>
          </div>
        </form>

        {/* Real-time Progress Bar */}
        {isScanning && (
          <div className="mt-4 pt-4 border-t-2 border-[#0D0D0D] space-y-2">
            <div className="flex justify-between font-mono text-xs font-bold">
              <span>{progressMsg}</span>
              <span>{progressPercent}%</span>
            </div>
            <div
              className="w-full h-4 bg-[#F2EFE9] border-2 border-[#0D0D0D] overflow-hidden"
              style={{ borderRadius: '0px' }}
            >
              <div
                className="h-full bg-[#D7FF3E] border-r-2 border-[#0D0D0D] transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </BrutalistCard>

      {/* Preset Scenarios (Restrained & High Scannability) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
            Demo Repositories
          </h2>
          <span className="font-mono text-xs text-[#0D0D0D]/60">Select to test</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESET_REPOSITORIES.map((preset) => {
            const isSelected = repoUrl.toLowerCase() === preset.url.toLowerCase();
            return (
              <BrutalistCard
                key={preset.id}
                hoverable
                onClick={() => handleSelectPreset(preset)}
                bg={isSelected ? 'paper' : 'white'}
                className={`p-4 ${isSelected ? 'border-[3px] border-[#0D0D0D] shadow-[4px_4px_0px_#0D0D0D]' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-extrabold px-1.5 py-0.5 border border-[#0D0D0D] ${
                          preset.expectedSecurityGrade === 'F'
                            ? 'bg-[#FF5A36] text-white'
                            : preset.expectedSecurityGrade === 'B'
                            ? 'bg-[#2B4BF2] text-white'
                            : 'bg-[#D7FF3E] text-[#0D0D0D]'
                        }`}
                        style={{ borderRadius: '0px' }}
                      >
                        {preset.expectedSecurityGrade}
                      </span>
                      <h3 className="font-mono text-xs font-bold text-[#0D0D0D] truncate">
                        {preset.name}
                      </h3>
                    </div>

                    <p className="font-sans text-xs text-[#0D0D0D]/70 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#0D0D0D]/20 flex items-center justify-between font-mono text-[10px] text-[#0D0D0D]/70">
                  <span className="truncate max-w-[220px]">
                    {preset.url.replace('https://github.com/', '')}
                  </span>
                  <span className="font-bold text-[#0D0D0D] uppercase flex items-center gap-1">
                    Load <ArrowRightMark size={12} />
                  </span>
                </div>
              </BrutalistCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
