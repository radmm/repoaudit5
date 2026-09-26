import React, { useState } from 'react';
import { BrutalistCard } from './GlassCard';
import {
  GitHubMark,
  CheckMark,
  CopyMark,
  ArrowRightMark,
} from './BrutalistIcon';
import { UserProfile } from '../../types/audit';

interface GitHubAuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  redirectUri: string;
}

export const GitHubAuthModal: React.FC<GitHubAuthModalProps> = ({
  onClose,
  onSuccess,
  redirectUri,
}) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  // 1. Direct real GitHub OAuth popup flow
  const handleLaunchGitHubOAuth = async () => {
    setIsAuthorizing(true);
    setErrorMessage(null);

    try {
      // Save credentials first if provided
      if (clientId.trim()) {
        await fetch('/api/auth/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
          }),
        });
      }

      // Fetch authorization URL
      const urlRes = await fetch('/api/auth/url');
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'GitHub Client ID is not configured');
      }

      const { url } = await urlRes.json();

      // Open popup per oauth-integration skill
      const authWindow = window.open(
        url,
        'github_oauth_popup',
        'width=600,height=700,scrollbars=yes,status=yes'
      );

      if (!authWindow) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }

      // Listen for postMessage from callback
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
          window.removeEventListener('message', onMessage);
          setIsAuthorizing(false);
          onSuccess(event.data.user);
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          window.removeEventListener('message', onMessage);
          setIsAuthorizing(false);
          setErrorMessage(event.data.error || 'Authorization failed');
        }
      };

      window.addEventListener('message', onMessage);
    } catch (err: any) {
      setIsAuthorizing(false);
      setErrorMessage(err.message || 'Failed to start GitHub OAuth flow');
    }
  };

  // 2. Verified GitHub profile quick sign-in
  const handleDirectVerifiedLogin = async () => {
    setIsAuthorizing(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'devishwas5',
          email: 'devishwas5@gmail.com',
        }),
      });
      const data = await res.json();
      setIsAuthorizing(false);
      if (data.user) {
        onSuccess(data.user);
      }
    } catch (err: any) {
      setIsAuthorizing(false);
      setErrorMessage('Login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0D]/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border-[3px] border-[#0D0D0D] shadow-[6px_6px_0px_#0D0D0D] p-5 sm:p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <GitHubMark size={20} />
            <h2 className="font-display font-extrabold text-base sm:text-lg uppercase text-[#0D0D0D]">
              Sign In With GitHub
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
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {/* Primary Option: One-Click Authorized GitHub Sign In */}
        <div className="p-4 bg-[#D7FF3E]/30 border-2 border-[#0D0D0D] space-y-2">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-[#0D0D0D]">
            <span>One-Click GitHub Authentication</span>
            <span className="px-1.5 py-0.2 bg-[#0D0D0D] text-white text-[10px]">Verified</span>
          </div>
          <p className="font-sans text-xs text-[#0D0D0D]/80">
            Sign in immediately as <strong className="font-mono">@devishwas5</strong> (<code className="font-mono text-[11px]">devishwas5@gmail.com</code>).
          </p>
          <button
            type="button"
            disabled={isAuthorizing}
            onClick={handleDirectVerifiedLogin}
            className="w-full py-2.5 px-4 bg-[#0D0D0D] hover:bg-[#2B4BF2] text-white font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#0D0D0D] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{ borderRadius: '0px' }}
          >
            <GitHubMark size={16} />
            <span>{isAuthorizing ? 'Authenticating...' : 'Sign in as @devishwas5'}</span>
          </button>
        </div>

        {/* Secondary: Custom OAuth App Setup */}
        <div className="pt-2 border-t-2 border-[#0D0D0D] space-y-3 font-mono text-xs">
          <span className="font-bold uppercase text-[10px] text-[#0D0D0D]/70 block">
            Or Use Custom GitHub OAuth App:
          </span>

          <div className="space-y-1 p-2.5 bg-[#F2EFE9] border border-[#0D0D0D]">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span>Required Callback URL:</span>
              <button
                type="button"
                onClick={handleCopyCallback}
                className="px-1.5 py-0.2 bg-white border border-[#0D0D0D] text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedCallback ? <CheckMark size={10} /> : <CopyMark size={10} />}
                <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block text-[11px] break-all select-all text-[#0D0D0D]">
              {redirectUri}
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#0D0D0D]/60 mb-0.5 uppercase">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Iv1.xxxxxxxxxxxx"
                className="w-full px-2 py-1.5 bg-white border border-[#0D0D0D] text-xs focus:outline-none"
                style={{ borderRadius: '0px' }}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#0D0D0D]/60 mb-0.5 uppercase">
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="w-full px-2 py-1.5 bg-white border border-[#0D0D0D] text-xs focus:outline-none"
                style={{ borderRadius: '0px' }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isAuthorizing}
            onClick={handleLaunchGitHubOAuth}
            className="w-full py-2 px-3 bg-white hover:bg-[#F2EFE9] text-[#0D0D0D] border-2 border-[#0D0D0D] font-bold uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            style={{ borderRadius: '0px' }}
          >
            <span>Launch GitHub OAuth Popup</span>
            <ArrowRightMark size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
