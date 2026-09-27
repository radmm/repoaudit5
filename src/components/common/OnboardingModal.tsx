import React, { useState } from 'react';
import { BrutalistCard } from './GlassCard';
import {
  GitHubMark,
  ShieldMark,
  ArrowRightMark,
  CheckMark,
} from './BrutalistIcon';
import { UserProfile } from '../../types/audit';

interface OnboardingModalProps {
  user: UserProfile;
  onClose: () => void;
  onStartAudit: (repoUrl: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  onClose,
  onStartAudit,
}) => {
  const suggestedRepos = [
    {
      name: `${user.username}/starter-project`,
      url: `https://github.com/${user.username}/starter-project`,
      desc: 'Auto-suggested repository from your GitHub account',
      badge: 'Account Repo',
    },
    {
      name: 'acme-corp/vulnerable-payment-gateway',
      url: 'https://github.com/acme-corp/vulnerable-payment-gateway',
      desc: 'Demo test repo with planted Stripe & AWS secrets, SQL injection, and weak MD5 hash',
      badge: 'Security Test',
    },
    {
      name: 'student-submissions/lab3-bst-original',
      url: 'https://github.com/student-submissions/lab3-bst-original',
      desc: 'Academic BST submission test case for winnowing plagiarism detection',
      badge: 'Plagiarism Test',
    },
  ];

  const [selectedUrl, setSelectedUrl] = useState(suggestedRepos[0].url);
  const [customUrl, setCustomUrl] = useState('');

  const handleLaunch = () => {
    const finalUrl = customUrl.trim() || selectedUrl;
    onStartAudit(finalUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0D]/75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border-[3px] border-[#0D0D0D] shadow-[6px_6px_0px_#0D0D0D] p-5 sm:p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#D7FF3E] border-2 border-[#0D0D0D] flex items-center justify-center shadow-[1px_1px_0px_#0D0D0D]">
              <ShieldMark size={18} />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/60 block">
                Quick Setup
              </span>
              <h2 className="font-display font-extrabold text-base sm:text-lg uppercase text-[#0D0D0D]">
                Welcome, @{user.username}!
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#0D0D0D] hover:text-white font-mono text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
          Your GitHub account is verified. Select an auto-suggested repository below or enter any public GitHub URL to run your first automated security and plagiarism scan.
        </p>

        {/* Suggested Repos Selection */}
        <div className="space-y-2">
          <label className="block font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/70">
            Suggested Repositories:
          </label>

          {suggestedRepos.map((r) => {
            const isSelected = selectedUrl === r.url && !customUrl.trim();
            return (
              <div
                key={r.url}
                onClick={() => {
                  setSelectedUrl(r.url);
                  setCustomUrl('');
                }}
                className={`p-3 border-2 transition-all cursor-pointer font-mono text-xs flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-[#0D0D0D] bg-[#D7FF3E]/30 shadow-[2px_2px_0px_#0D0D0D]'
                    : 'border-[#0D0D0D]/40 bg-white hover:border-[#0D0D0D]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0D0D0D]">{r.name}</span>
                    <span className="px-1.5 py-0.2 bg-[#0D0D0D] text-white text-[9px] uppercase">
                      {r.badge}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-[#0D0D0D]/70">{r.desc}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-[#0D0D0D] text-white flex items-center justify-center shrink-0">
                    <CheckMark size={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Repo URL Input */}
        <div className="pt-2 font-mono text-xs space-y-1">
          <label className="block text-[10px] font-bold uppercase text-[#0D0D0D]/70">
            Or Enter Any GitHub Repository URL:
          </label>
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="w-full px-2.5 py-2 bg-white border-2 border-[#0D0D0D] text-xs font-mono focus:outline-none focus:bg-[#D7FF3E]/10"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t-2 border-[#0D0D0D] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 border border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#0D0D0D] hover:text-white font-mono text-xs font-bold uppercase cursor-pointer"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="px-4 py-2 bg-[#0D0D0D] hover:bg-[#2B4BF2] text-white font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] flex items-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <span>Run First Audit</span>
            <ArrowRightMark size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
