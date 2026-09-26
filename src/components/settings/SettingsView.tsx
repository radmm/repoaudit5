import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  GitHubMark,
  KeyMark,
  UserMark,
  SettingsMark,
  TrashMark,
  CopyMark,
  CheckMark,
} from '../common/BrutalistIcon';
import { auditService } from '../../services/auditService';
import { ApiKeyItem, Organization, UserProfile } from '../../types/audit';

export const SettingsView: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(() => auditService.getUser());
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => auditService.getApiKeys());
  const [org, setOrg] = useState<Organization>(() => auditService.getOrg());

  // API Key creation modal / state
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Org member invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteSuccess, setInviteSuccess] = useState(false);

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
    if (!inviteEmail.trim()) return;
    auditService.inviteOrgMember(inviteEmail.trim(), inviteRole);
    setOrg(auditService.getOrg());
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const toggleAppInstall = () => {
    const updated = { ...user, githubAppInstalled: !user.githubAppInstalled };
    auditService.setUser(updated);
    setUser(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <BrutalistCard bg="white" className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <SettingsMark size={20} />
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
            WORKSPACE SETTINGS
          </h1>
        </div>
        <p className="font-mono text-xs text-[#0D0D0D]/60 mt-1">
          GitHub App connection, programmatic API keys, and team access.
        </p>
      </BrutalistCard>

      {/* 1. Connected GitHub Account & GitHub App Status */}
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
              src={user.avatarUrl}
              alt={user.username}
              className="w-10 h-10 border-2 border-[#0D0D0D]"
            />
            <div>
              <div className="font-mono font-bold text-xs text-[#0D0D0D]">@{user.username}</div>
              <div className="font-mono text-[10px] text-[#0D0D0D]/60">{user.email}</div>
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
                user.githubAppInstalled
                  ? 'bg-[#D7FF3E] text-[#0D0D0D]'
                  : 'bg-[#FF5A36] text-white'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {user.githubAppInstalled ? 'Installed' : 'Install App'}
            </button>
          </div>
        </div>
      </BrutalistCard>

      {/* 2. Programmatic API Keys */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <KeyMark size={18} />
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
              API Keys (CI/CD Access)
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#0D0D0D]/60">
            Authenticated endpoints: POST /api/v1/audit
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

      {/* 3. Team & Organization Management */}
      <BrutalistCard bg="white" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-2">
            <UserMark size={18} />
            <h2 className="font-mono font-bold text-xs sm:text-sm uppercase text-[#0D0D0D]">
              Organization: {org.name}
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#0D0D0D]/60">
            {org.members.length} Members
          </span>
        </div>

        {/* Invite Member Form */}
        <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
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
            Invitation sent to team member!
          </div>
        )}

        {/* Member List */}
        <div className="space-y-2">
          {org.members.map((member) => (
            <div
              key={member.id}
              className="p-3 border-2 border-[#0D0D0D] bg-[#F2EFE9] flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatarUrl}
                  alt={member.username}
                  className="w-8 h-8 border border-[#0D0D0D]"
                />
                <div>
                  <div className="font-bold text-[#0D0D0D]">{member.username}</div>
                  <div className="text-[10px] text-[#0D0D0D]/60">{member.email}</div>
                </div>
              </div>

              <span className="font-bold uppercase text-[10px] px-2 py-0.5 bg-white border border-[#0D0D0D]">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </BrutalistCard>
    </div>
  );
};
