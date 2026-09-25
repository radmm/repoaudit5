import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  CompareMark,
  PlayMark,
  ArrowRightMark,
} from '../common/BrutalistIcon';
import { PRESET_REPOSITORIES } from '../../services/repoIngestion';
import { auditService } from '../../services/auditService';
import { AuditReport } from '../../types/audit';

interface PairwiseCompareModalProps {
  onAuditComplete: (report: AuditReport) => void;
}

export const PairwiseCompareModal: React.FC<PairwiseCompareModalProps> = ({
  onAuditComplete,
}) => {
  const [repoA, setRepoA] = useState('https://github.com/student-submissions/lab3-bst-original');
  const [repoB, setRepoB] = useState('https://github.com/student-forks/lab3-bst-renamed');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastCompareResult, setLastCompareResult] = useState<AuditReport | null>(null);

  const handleRunPairwise = async () => {
    if (!repoA || !repoB) return;
    setIsLoading(true);
    setStatusMessage('Scanning...');

    try {
      const report = await auditService.runAudit(repoA, repoB, (msg) => {
        setStatusMessage(msg);
      });
      setLastCompareResult(report);
      onAuditComplete(report);
    } catch (e: any) {
      alert(e.message || 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoPairwise = () => {
    const demo = PRESET_REPOSITORIES.find((p) => p.id === 'demo-pairwise-plagiarism');
    if (demo) {
      setRepoA(demo.url);
      setRepoB('https://github.com/student-forks/lab3-bst-renamed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <BrutalistCard bg="white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
              TOKEN WINNOWING HASH (MOSS COMPATIBLE)
            </span>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
              PAIRWISE REPOSITORY COMPARISON
            </h1>
          </div>

          <button
            onClick={loadDemoPairwise}
            className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#2B4BF2] hover:bg-[#1f3ccb] text-white text-xs font-mono font-bold uppercase transition-all cursor-pointer"
            style={{ borderRadius: '0px' }}
          >
            Load Lab 3 Demo
          </button>
        </div>
      </BrutalistCard>

      {/* Two Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BrutalistCard bg="white">
          <label className="font-mono text-xs font-bold uppercase block mb-1">
            Reference Repository (Original)
          </label>
          <input
            type="text"
            value={repoA}
            onChange={(e) => setRepoA(e.target.value)}
            placeholder="https://github.com/owner/original"
            className="w-full px-3 py-2 bg-[#F2EFE9] border-2 border-[#0D0D0D] font-mono text-xs text-[#0D0D0D] focus:outline-none focus:bg-white"
            style={{ borderRadius: '0px' }}
          />
        </BrutalistCard>

        <BrutalistCard bg="white">
          <label className="font-mono text-xs font-bold uppercase block mb-1">
            Suspect Repository (Copy / Fork)
          </label>
          <input
            type="text"
            value={repoB}
            onChange={(e) => setRepoB(e.target.value)}
            placeholder="https://github.com/owner/suspect"
            className="w-full px-3 py-2 bg-[#F2EFE9] border-2 border-[#0D0D0D] font-mono text-xs text-[#0D0D0D] focus:outline-none focus:bg-white"
            style={{ borderRadius: '0px' }}
          />
        </BrutalistCard>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border-[3px] border-[#0D0D0D] shadow-[3px_3px_0px_#0D0D0D]">
        <div className="font-mono text-xs text-[#0D0D0D]/70">
          {isLoading ? statusMessage : 'Calculates token Jaccard similarity across k-grams (k=6, w=4)'}
        </div>

        <button
          onClick={handleRunPairwise}
          disabled={isLoading}
          className={`w-full sm:w-auto px-6 py-2.5 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
            isLoading
              ? 'bg-[#E8E4DA] text-[#0D0D0D]/40 cursor-not-allowed'
              : 'bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D]'
          }`}
          style={{ borderRadius: '0px' }}
        >
          {isLoading ? 'Scanning...' : 'Run Pairwise Comparison'}
        </button>
      </div>

      {/* Comparison Results Card */}
      {lastCompareResult && (
        <BrutalistCard bg="white" className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60">
                Similarity Result
              </span>
              <div className="font-mono font-extrabold text-2xl text-[#0D0D0D]">
                {lastCompareResult.plagiarism.similarity}% Overlap
              </div>
            </div>

            <span
              className={`font-mono text-xs font-bold uppercase px-2 py-0.5 border-2 border-[#0D0D0D] ${
                lastCompareResult.plagiarism.similarity > 50
                  ? 'bg-[#FF5A36] text-white'
                  : 'bg-[#D7FF3E] text-[#0D0D0D]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {lastCompareResult.plagiarism.similarity > 50 ? 'Significant Match' : 'Distinct'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
            <div>
              <span className="text-[#0D0D0D]/60 text-[10px] uppercase block">Target Fingerprints</span>
              <span className="font-bold">{lastCompareResult.plagiarism.fingerprintCount}</span>
            </div>
            <div>
              <span className="text-[#0D0D0D]/60 text-[10px] uppercase block">Matched K-grams</span>
              <span className="font-bold">{lastCompareResult.plagiarism.details.matchedKgrams}</span>
            </div>
            <div>
              <span className="text-[#0D0D0D]/60 text-[10px] uppercase block">Flagged Pairs</span>
              <span className="font-bold">{lastCompareResult.plagiarism.matches.length}</span>
            </div>
          </div>

          {/* Matches List */}
          {lastCompareResult.plagiarism.matches.map((match) => (
            <div
              key={match.id}
              className="p-3 bg-[#F2EFE9] border-2 border-[#0D0D0D] space-y-2 mt-2 font-mono text-xs"
              style={{ borderRadius: '0px' }}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#0D0D0D]">{match.file}</span>
                <span className="px-1.5 py-0.2 bg-[#2B4BF2] text-white text-[10px] border border-[#0D0D0D]">
                  {Math.round(match.confidence * 100)}% Match
                </span>
              </div>

              {match.snippet && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 bg-white border border-[#0D0D0D]">
                    <div className="text-[10px] uppercase text-[#0D0D0D]/60 mb-0.5">
                      Original:
                    </div>
                    <pre className="text-[#0D0D0D] overflow-x-auto text-[11px] whitespace-pre-wrap">
                      {match.snippet}
                    </pre>
                  </div>
                  <div className="p-2 bg-white border border-[#0D0D0D]">
                    <div className="text-[10px] uppercase text-[#2B4BF2] mb-0.5">
                      Renamed / Disguised:
                    </div>
                    <pre className="text-[#0D0D0D] overflow-x-auto text-[11px] whitespace-pre-wrap">
                      {match.matchedSnippet}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </BrutalistCard>
      )}
    </div>
  );
};
