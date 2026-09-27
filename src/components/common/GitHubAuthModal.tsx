import React, { useState } from 'react';
import {
  GitHubMark,
  CheckMark,
  CopyMark,
  ArrowRightMark,
  ExternalLinkMark,
} from './BrutalistIcon';
import { UserProfile } from '../../types/audit';

interface GitHubAuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserProfile, csrfToken?: string) => void;
  redirectUri: string;
  csrfToken?: string;
  initialError?: string | null;
}

export const GitHubAuthModal: React.FC<GitHubAuthModalProps> = ({
  onClose,
  onSuccess,
  redirectUri,
  csrfToken,
  initialError,
}) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  // Launch real GitHub OAuth flow
  const handleLaunchGitHubOAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);
    setErrorMessage(null);

    try {
      // 1. Save credentials if provided
      if (clientId.trim()) {
        const configRes = await fetch('/api/auth/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
          }),
        });

        if (!configRes.ok) {
          const data = await configRes.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save GitHub OAuth credentials on server');
        }
      }

      // 2. Fetch real GitHub authorization URL from server
      const urlRes = await fetch('/api/auth/url');
      const urlData = await urlRes.json().catch(() => ({}));

      if (!urlRes.ok || !urlData.configured || !urlData.url) {
        throw new Error(
          urlData.message || urlData.error || 'GitHub OAuth is not configured yet. Please provide a Client ID and Secret.'
        );
      }

      // 3. Open real GitHub OAuth page in popup (MUST be github.com)
      const authWindow = window.open(
        urlData.url,
        'github_oauth_popup',
        'width=600,height=720,scrollbars=yes,status=yes'
      );

      if (!authWindow) {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site.');
      }

      // 4. Listen for postMessage from real OAuth callback
      const onMessage = (event: MessageEvent) => {
        // Validate origin
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
          window.removeEventListener('message', onMessage);
          setIsAuthorizing(false);
          onSuccess(event.data.user, event.data.csrfToken);
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          window.removeEventListener('message', onMessage);
          setIsAuthorizing(false);
          setErrorMessage(event.data.error || 'GitHub OAuth authorization failed');
        }
      };

      window.addEventListener('message', onMessage);
    } catch (err: any) {
      setIsAuthorizing(false);
      setErrorMessage(err.message || 'Failed to start GitHub OAuth flow');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0D]/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border-[3px] border-[#0D0D0D] shadow-[6px_6px_0px_#0D0D0D] p-5 sm:p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <GitHubMark size={20} />
            <h2 className="font-display font-extrabold text-base sm:text-lg uppercase text-[#0D0D0D]">
              GitHub OAuth Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#0D0D0D] hover:text-white font-mono text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#FF5A36]/10 border-2 border-[#FF5A36] text-[#0D0D0D] font-mono text-xs">
            <strong>OAuth Notice:</strong> {errorMessage}
          </div>
        )}

        {/* Honest Setup Instructions */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
            Authentication with GitHub requires registering a standard OAuth App on GitHub. Sign-in connects directly to <strong className="font-mono">github.com/login/oauth/authorize</strong> on GitHub's domain.
          </p>

          {/* Step 1 & 2 Instructions */}
          <div className="p-3 bg-[#F2EFE9] border border-[#0D0D0D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-[10px] text-[#0D0D0D]">
                Step 1: Open GitHub Developer Settings
              </span>
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#2B4BF2] hover:underline flex items-center gap-1 font-bold"
              >
                <span>github.com/settings/developers</span>
                <ExternalLinkMark size={10} />
              </a>
            </div>

            <div className="pt-2 border-t border-[#0D0D0D]/20">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                <span>Step 2: Set Authorization Callback URL:</span>
                <button
                  type="button"
                  onClick={handleCopyCallback}
                  className="px-1.5 py-0.5 bg-white border border-[#0D0D0D] text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer hover:bg-[#D7FF3E]"
                >
                  {copiedCallback ? <CheckMark size={10} /> : <CopyMark size={10} />}
                  <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="block p-1.5 bg-white border border-[#0D0D0D] text-[11px] break-all select-all text-[#0D0D0D]">
                {redirectUri}
              </code>
            </div>
          </div>

          {/* Step 3: Enter credentials */}
          <form onSubmit={handleLaunchGitHubOAuth} className="space-y-3">
            <span className="font-bold uppercase text-[10px] text-[#0D0D0D] block">
              Step 3: Enter OAuth App Credentials
            </span>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-[#0D0D0D]/70 mb-0.5 uppercase">
                  Client ID <span className="text-[#FF5A36]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. Ov23liabcdef123456"
                  className="w-full px-2.5 py-1.5 bg-white border-2 border-[#0D0D0D] text-xs font-mono focus:outline-none focus:bg-[#D7FF3E]/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0D0D0D]/70 mb-0.5 uppercase">
                  Client Secret <span className="text-[#FF5A36]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full px-2.5 py-1.5 bg-white border-2 border-[#0D0D0D] text-xs font-mono focus:outline-none focus:bg-[#D7FF3E]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-full py-2.5 px-4 bg-[#0D0D0D] hover:bg-[#2B4BF2] text-white font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <GitHubMark size={16} />
              <span>{isAuthorizing ? 'Opening GitHub...' : 'Authorize with GitHub'}</span>
              <ArrowRightMark size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
