import React, { useState, useEffect } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  GitHubMark,
  KeyMark,
  UserMark,
  SettingsMark,
  TrashMark,
  CopyMark,
  CheckMark,
  ExternalLinkMark,
} from '../common/BrutalistIcon';
import { auditService } from '../../services/auditService';
import { ApiKeyItem, Organization, UserProfile } from '../../types/audit';

interface SettingsViewProps {
  onOpenDocs?: (section?: 'corpus' | 'oop') => void;
  csrfToken?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenDocs, csrfToken }) => {
  const [user, setUser] = useState<UserProfile | null>(() => auditService.getUser());
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => auditService.getApiKeys());
  const [org, setOrg] = useState<Organization>(() => auditService.getOrg());

  // Webhook Test Simulation
  const [webhookRepo, setWebhookRepo] = useState('acme-corp/vulnerable-payment-gateway');
  const [webhookPr, setWebhookPr] = useState(42);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // OAuth App Config
  const [oauthConfig, setOauthConfig] = useState<{
    configured: boolean;
    clientId: string | null;
    redirectUri: string;
  }>({
    configured: false,
    clientId: null,
    redirectUri: `${window.location.origin}/auth/callback`,
  });

  const [inputClientId, setInputClientId] = useState('');
  const [inputClientSecret, setInputClientSecret] = useState('');
  const [oauthSaved, setOauthSaved] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // API Key creation
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Org member invite state
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setOauthConfig(data);
          if (data.rawClientId) setInputClientId(data.rawClientId);
        }
      })
      .catch(() => {});

    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch {}
    setLoadingLogs(false);
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookTesting(true);
    setWebhookResult(null);

    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          repoFullName: webhookRepo.trim(),
          prNumber: Number(webhookPr),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWebhookResult(data);
      }
    } catch (err) {
      console.error('Webhook simulation failed', err);
    }
    setWebhookTesting(false);
  };

  const handleSaveOAuthConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId.trim()) return;

    try {
      const res = await fetch('/api/auth/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          clientId: inputClientId.trim(),
          clientSecret: inputClientSecret.trim(),
        }),
      });
      if (res.ok) {
        setOauthSaved(true);
        setOauthConfig((prev) => ({
          ...prev,
          configured: true,
          clientId: inputClientId.trim(),
        }));
        fetchAuditLogs();
        setTimeout(() => setOauthSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save OAuth config', err);
    }
  };

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(oauthConfig.redirectUri);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const { rawKey } = auditService.generateApiKey(newKeyName.trim());
    setGeneratedRawKey(rawKey);
    setApiKeys(auditService.getApiKeys());
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    auditService.revokeApiKey(id);
    setApiKeys(auditService.getApiKeys());
  };

  const handleCopyRawKey = () => {
    if (!generatedRawKey) return;
    navigator.clipboard.writeText(generatedRawKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;
    auditService.inviteOrgMember(inviteIdentifier.trim(), inviteRole);
    setOrg(auditService.getOrg());
    setInviteIdentifier('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handleRemoveMember = (memberId: string) => {
    auditService.removeOrgMember(memberId);
    setOrg(auditService.getOrg());
  };

  const displayUser: UserProfile = user || {
    id: 'usr-guest',
    githubId: 'guest',
    username: 'guest',
    email: 'guest@repoauditor.io',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    githubAppInstalled: false,
    auditsCount: 0,
    quotaLimit: 50,
  };

  const toggleAppInstall = () => {
    const updated = { ...displayUser, githubAppInstalled: !displayUser.githubAppInstalled };
    auditService.setUser(updated);
    setUser(updated);
  };

  // Check if org has only the owner (genuine empty state per Problem 4)
  const isOwnerOnly = org.members.length <= 1;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <BrutalistCard bg="white" className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <SettingsMark size={20} />
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
            WORKSPACE SETTINGS
          </h1>
        </div>
        <p className="font-mono text-xs text-[#0D0D0D]/60 mt-1">
          GitHub App connection, OAuth credentials, programmatic API keys, and team access.
        </p>
      </BrutalistCard>

      {/* 2. Connected GitHub Account & GitHub App Integration */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <GitHubMark size={18} />
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
              GitHub Connection & App Integration
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-[#D7FF3E] border border-[#0D0D0D] font-bold">
            OAuth Linked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="flex items-center gap-3 p-3 bg-[#F2EFE9] border-2 border-[#0D0D0D]">
            <img
              src={displayUser.avatarUrl}
              alt={displayUser.username}
              className="w-10 h-10 border-2 border-[#0D0D0D]"
            />
            <div>
              <div className="font-mono font-bold text-xs text-[#0D0D0D]">@{displayUser.username}</div>
              <div className="font-mono text-[10px] text-[#0D0D0D]/60">{displayUser.email}</div>
            </div>
          </div>

          <div className="p-3 border-2 border-[#0D0D0D] bg-white flex items-center justify-between">
            <div>
              <div className="font-mono font-bold text-xs text-[#0D0D0D]">
                Repo Auditor GitHub App
              </div>
              <div className="font-mono text-[10px] text-[#0D0D0D]/60">
                Scopes: contents:read, pull_requests:write
              </div>
            </div>

            <button
              onClick={toggleAppInstall}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer ${
                displayUser.githubAppInstalled
                  ? 'bg-[#D7FF3E] text-[#0D0D0D]'
                  : 'bg-[#FF5A36] text-white'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {displayUser.githubAppInstalled ? 'Installed' : 'Install App'}
            </button>
          </div>
        </div>
      </BrutalistCard>

      {/* 3. GitHub OAuth App Configuration (End-to-End Auth Debugging) */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <GitHubMark size={18} />
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
              OAuth App Configuration
            </h2>
          </div>
          <span
            className={`font-mono text-[10px] uppercase px-2 py-0.5 border border-[#0D0D0D] font-bold ${
              oauthConfig.configured ? 'bg-[#D7FF3E] text-[#0D0D0D]' : 'bg-[#FF5A36] text-white'
            }`}
          >
            {oauthConfig.configured ? 'Credentials Configured' : 'Credentials Missing'}
          </span>
        </div>

        {/* Callback URI Display to copy to GitHub settings */}
        <div className="space-y-1.5 p-3 bg-[#F2EFE9] border-2 border-[#0D0D0D]">
          <div className="flex items-center justify-between font-mono text-xs font-bold">
            <span>Authorization Callback URL (add to your GitHub OAuth App):</span>
            <button
              type="button"
              onClick={handleCopyCallback}
              className="px-2 py-0.5 bg-white border border-[#0D0D0D] text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedCallback ? <CheckMark size={12} /> : <CopyMark size={12} />}
              <span>{copiedCallback ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
          <code className="block p-2 bg-white border border-[#0D0D0D] font-mono text-xs break-all select-all text-[#0D0D0D]">
            {oauthConfig.redirectUri}
          </code>
        </div>

        {/* Credential Setup Form */}
        <form onSubmit={handleSaveOAuthConfig} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/70 mb-1">
                GitHub Client ID
              </label>
              <input
                type="text"
                required
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                placeholder="Iv1.xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-[#F2EFE9] border-2 border-[#0D0D0D] font-mono text-xs focus:outline-none focus:bg-white"
                style={{ borderRadius: '0px' }}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#0D0D0D]/70 mb-1">
                GitHub Client Secret
              </label>
              <input
                type="password"
                value={inputClientSecret}
                onChange={(e) => setInputClientSecret(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="w-full px-3 py-2 bg-[#F2EFE9] border-2 border-[#0D0D0D] font-mono text-xs focus:outline-none focus:bg-white"
                style={{ borderRadius: '0px' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[10px] text-[#0D0D0D]/60">
              Credentials are saved to server memory and used for /auth/callback token exchange.
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D0D0D] hover:bg-[#2B4BF2] text-white font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] cursor-pointer whitespace-nowrap"
              style={{ borderRadius: '0px' }}
            >
              {oauthSaved ? 'Saved!' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </BrutalistCard>

      {/* 4. Team Organization & Members (Problem 4 - Honest Empty State vs Real Members) */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <UserMark size={18} />
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
              Organization: {org.name}
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#0D0D0D]/60">
            {org.members.length} {org.members.length === 1 ? 'Member' : 'Members'}
          </span>
        </div>

        {/* Invite Member Form (Input for email or GitHub username per Problem 4) */}
        <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={inviteIdentifier}
            onChange={(e) => setInviteIdentifier(e.target.value)}
            placeholder="Invite by email or GitHub username..."
            className="flex-1 px-3 py-2 bg-[#F2EFE9] border-2 border-[#0D0D0D] text-xs font-mono focus:outline-none focus:bg-white"
            style={{ borderRadius: '0px' }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            className="px-3 py-2 bg-white border-2 border-[#0D0D0D] text-xs font-mono font-bold uppercase"
            style={{ borderRadius: '0px' }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-[#D7FF3E] hover:bg-[#cbf52f] text-[#0D0D0D] font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer whitespace-nowrap"
            style={{ borderRadius: '0px' }}
          >
            Invite Member
          </button>
        </form>

        {inviteSuccess && (
          <div className="p-2 bg-[#D7FF3E]/30 border border-[#0D0D0D] font-mono text-xs font-bold text-[#0D0D0D]">
            Invitation created for team member!
          </div>
        )}

        {/* Member List: Single real row (owner) + honest empty state notice per Problem 4 */}
        <div className="space-y-2 pt-1">
          {org.members.map((member) => (
            <div
              key={member.id}
              className="p-3 border-2 border-[#0D0D0D] bg-[#F2EFE9] flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatarUrl || displayUser.avatarUrl}
                  alt={member.username}
                  className="w-8 h-8 border border-[#0D0D0D]"
                />
                <div>
                  <div className="font-bold text-[#0D0D0D] flex items-center gap-2">
                    <span>@{member.username}</span>
                    {member.role === 'owner' && (
                      <span className="text-[9px] px-1 bg-[#0D0D0D] text-white">Owner</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#0D0D0D]/60">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold uppercase text-[10px] px-2 py-0.5 bg-white border border-[#0D0D0D]">
                  {member.role}
                </span>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 hover:bg-[#FF5A36] hover:text-white border border-transparent hover:border-[#0D0D0D] cursor-pointer"
                    title="Remove member"
                  >
                    <TrashMark size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Honest Empty State Notice per Problem 4 */}
          {isOwnerOnly && (
            <div className="p-3.5 bg-white border-2 border-dashed border-[#0D0D0D]/40 text-center font-mono text-xs text-[#0D0D0D]/75">
              You're the only member of {org.name} — invite your team to collaborate on audits.
            </div>
          )}
        </div>
      </BrutalistCard>

      {/* 5. Programmatic API Keys */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <KeyMark size={18} />
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
              API Keys (CI/CD Access)
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#0D0D0D]/60">
            Authenticated programmatic access: POST /api/v1/audit
          </span>
        </div>

        {/* Generate Key Form */}
        <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key descriptor (e.g. GitHub Actions PR Bot)"
            className="flex-1 px-3 py-2 bg-[#F2EFE9] border-2 border-[#0D0D0D] text-xs font-mono focus:outline-none focus:bg-white"
            style={{ borderRadius: '0px' }}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0D0D0D] text-white hover:bg-[#2B4BF2] font-mono text-xs font-bold uppercase border-2 border-[#0D0D0D] transition-all cursor-pointer whitespace-nowrap"
            style={{ borderRadius: '0px' }}
          >
            Generate Key
          </button>
        </form>

        {/* One-Time Raw Key Display */}
        {generatedRawKey && (
          <div className="p-3 bg-[#D7FF3E]/30 border-2 border-[#0D0D0D] space-y-2">
            <div className="flex items-center justify-between font-mono text-xs font-bold">
              <span>Save this key now (it will not be shown again):</span>
              <button
                onClick={handleCopyRawKey}
                className="px-2 py-0.5 bg-white border border-[#0D0D0D] text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedKey ? <CheckMark size={12} /> : <CopyMark size={12} />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 bg-white border border-[#0D0D0D] font-mono text-xs break-all select-all">
              {generatedRawKey}
            </code>
          </div>
        )}

        {/* Key List & Empty State */}
        {apiKeys.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-[#0D0D0D]/30 text-center font-mono text-xs text-[#0D0D0D]/60">
            No API keys yet. Generate an API key to configure the CLI or GitHub Action.
          </div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className={`p-3 border-2 border-[#0D0D0D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
                  key.revokedAt ? 'bg-[#FF5A36]/10 opacity-70' : 'bg-[#F2EFE9]'
                }`}
              >
                <div>
                  <div className="font-bold text-[#0D0D0D] flex items-center gap-2">
                    <span>{key.name}</span>
                    {key.revokedAt && (
                      <span className="text-[10px] px-1 bg-[#FF5A36] text-white border border-[#0D0D0D]">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#0D0D0D]/60 mt-0.5">
                    Prefix: <span className="font-bold">{key.prefix}</span> • Created:{' '}
                    {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {!key.revokedAt && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="px-2 py-1 bg-white hover:bg-[#FF5A36] hover:text-white border border-[#0D0D0D] text-[10px] font-bold uppercase transition-all cursor-pointer self-start sm:self-auto"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </BrutalistCard>

      {/* 6. GitHub App Webhook & PR-Comment Simulator */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-[#D7FF3E] border border-[#0D0D0D]">
              CI/CD Automation
            </span>
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D] mt-1">
              GitHub App Webhook & PR Comment Distribution
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#0D0D0D]/60">
            Endpoint: <code className="bg-[#F2EFE9] px-1 py-0.5 border border-[#0D0D0D]">/api/webhooks/github</code>
          </span>
        </div>

        <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
          When the GitHub App is installed, incoming <code className="font-mono bg-[#F2EFE9] px-1">pull_request</code> events trigger automated scans. Results are rendered as markdown tables with diff remediations and posted directly as PR comments.
        </p>

        <form onSubmit={handleSimulateWebhook} className="p-4 bg-[#F2EFE9] border-2 border-[#0D0D0D] space-y-3 font-mono text-xs">
          <div className="font-bold uppercase text-[10px] text-[#0D0D0D]">
            Simulate Incoming PR Webhook & Comment Generator:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#0D0D0D]/70 mb-1 uppercase">
                Repository (owner/repo)
              </label>
              <input
                type="text"
                value={webhookRepo}
                onChange={(e) => setWebhookRepo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#0D0D0D] text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#0D0D0D]/70 mb-1 uppercase">
                Pull Request #
              </label>
              <input
                type="number"
                value={webhookPr}
                onChange={(e) => setWebhookPr(parseInt(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#0D0D0D] text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={webhookTesting}
            className="px-4 py-2 bg-[#0D0D0D] hover:bg-[#2B4BF2] text-white font-bold uppercase text-xs cursor-pointer shadow-[2px_2px_0px_#0D0D0D] flex items-center gap-2"
          >
            <GitHubMark size={14} />
            <span>{webhookTesting ? 'Simulating...' : 'Test Webhook & Preview PR Comment'}</span>
          </button>
        </form>

        {webhookResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[#3FB950]">
                ✓ Webhook Processed Successfully (Audit ID: {webhookResult.scanResult?.auditId})
              </span>
              <span className="text-[10px] text-[#0D0D0D]/60">
                Grade: {webhookResult.scanResult?.securityGrade} ({webhookResult.scanResult?.securityScore}/100)
              </span>
            </div>

            <div className="p-3 bg-[#0D0D0D] text-white font-mono text-xs overflow-x-auto border-2 border-[#0D0D0D] max-h-60">
              <pre className="text-[11px] text-[#D7FF3E] whitespace-pre-wrap">
                {webhookResult.commentMarkdown}
              </pre>
            </div>
          </div>
        )}
      </BrutalistCard>

      {/* 7. Security Audit Log for Sensitive Actions */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-[#FF5A36] text-white border border-[#0D0D0D]">
              Sec 6 Security
            </span>
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D] mt-1">
              Sensitive Action Audit Logs
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="px-2 py-1 bg-white hover:bg-[#F2EFE9] border border-[#0D0D0D] font-mono text-[10px] font-bold uppercase cursor-pointer"
          >
            {loadingLogs ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>

        <p className="font-sans text-xs text-[#0D0D0D]/80 leading-relaxed">
          Immutable server-side audit logs tracking sensitive administrative actions (OAuth changes, API key creation/revocation, organization role modifications, and login sessions).
        </p>

        <div className="border-2 border-[#0D0D0D] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#0D0D0D] text-white text-[10px] uppercase">
                <th className="p-2 border-r border-[#30363d]">Timestamp</th>
                <th className="p-2 border-r border-[#30363d]">Actor</th>
                <th className="p-2 border-r border-[#30363d]">Action</th>
                <th className="p-2 border-r border-[#30363d]">Target</th>
                <th className="p-2">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-[#0D0D0D]/60 bg-[#F2EFE9]">
                    No audit log entries recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[#0D0D0D]/20 hover:bg-[#F2EFE9]">
                    <td className="p-2 border-r border-[#0D0D0D]/20 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-2 border-r border-[#0D0D0D]/20 font-bold">
                      @{log.actorUsername}
                    </td>
                    <td className="p-2 border-r border-[#0D0D0D]/20">
                      <span className="px-1.5 py-0.5 bg-[#D7FF3E] border border-[#0D0D0D] text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2 border-r border-[#0D0D0D]/20 text-[11px]">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="p-2 text-[11px] text-[#0D0D0D]/60">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BrutalistCard>

      {/* 8. Academic Review Materials */}
      {onOpenDocs && (
        <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#0D0D0D]">
            <div>
              <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
                Project Documentation & Review Materials
              </h2>
              <p className="font-mono text-[10px] text-[#0D0D0D]/60 mt-0.5">
                Academic evaluation benchmarks and object-oriented architecture specifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onOpenDocs('corpus')}
              className="p-3 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#D7FF3E]/30 text-left font-mono transition-all cursor-pointer flex items-center justify-between"
              style={{ borderRadius: '0px' }}
            >
              <div>
                <span className="font-bold text-xs text-[#0D0D0D] block">
                  Accuracy Validation (Sec 9)
                </span>
                <span className="text-[10px] text-[#0D0D0D]/60">
                  Labeled ground-truth test corpus & metrics
                </span>
              </div>
              <ExternalLinkMark size={14} />
            </button>

            <button
              onClick={() => onOpenDocs('oop')}
              className="p-3 border-2 border-[#0D0D0D] bg-[#F2EFE9] hover:bg-[#2B4BF2]/20 text-left font-mono transition-all cursor-pointer flex items-center justify-between"
              style={{ borderRadius: '0px' }}
            >
              <div>
                <span className="font-bold text-xs text-[#0D0D0D] block">
                  OOP Architecture (Sec 10)
                </span>
                <span className="text-[10px] text-[#0D0D0D]/60">
                  Classes, inheritance, polymorphism & SDG 16/4
                </span>
              </div>
              <ExternalLinkMark size={14} />
            </button>
          </div>
        </BrutalistCard>
      )}
    </div>
  );
};
