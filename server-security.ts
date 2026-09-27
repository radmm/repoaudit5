import dns from 'dns';
import crypto from 'crypto';
import path from 'path';

// --- SSRF PROTECTION ---

const PRIVATE_IP_RANGES = [
  /^127\./,                         // Loopback IPv4
  /^10\./,                          // RFC1918 Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC1918 Class B (172.16.0.0 - 172.31.255.255)
  /^192\.168\./,                    // RFC1918 Class C
  /^169\.254\./,                    // Link-local / Cloud metadata (AWS, GCP, Azure 169.254.169.254)
  /^0\./,                           // Current network
  /^::1$/,                          // Loopback IPv6
  /^[fF][cCdD]/,                    // Unique local IPv6 (fc00::/7)
  /^[fF][eE][89aAbB]/,              // Link-local IPv6 (fe80::/10)
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
  '169.254.169.254',
  'instance-data',
]);

export interface SSRFValidationResult {
  valid: boolean;
  error?: string;
  resolvedIp?: string;
}

export async function validateRepoUrlForSSRF(rawUrl: string): Promise<SSRFValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Repository URL is required' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: `Disallowed URL protocol "${parsed.protocol}". Only HTTP(S) allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    return { valid: false, error: `SSRF Violation: Target hostname "${hostname}" is blocked (internal/private host).` };
  }

  // Resolve hostname via DNS to verify target IP
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { valid: false, error: `Cannot resolve hostname "${hostname}"` };
    }

    for (const entry of lookupResult) {
      const ip = entry.address;
      for (const range of PRIVATE_IP_RANGES) {
        if (range.test(ip)) {
          return {
            valid: false,
            error: `SSRF Violation: Target hostname "${hostname}" resolves to internal/private IP address "${ip}".`,
            resolvedIp: ip,
          };
        }
      }
    }

    return { valid: true, resolvedIp: lookupResult[0].address };
  } catch (err: any) {
    return { valid: false, error: `DNS resolution failed for hostname "${hostname}": ${err.message}` };
  }
}

// --- RATE LIMITING ---

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private ipLimits: Map<string, RateLimitRecord> = new Map();
  private userLimits: Map<string, RateLimitRecord> = new Map();

  constructor(
    private maxPerIpPerMinute: number = 10,
    private maxPerUserPerMinute: number = 20
  ) {}

  public check(ip: string, userId?: string | null): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
    const now = Date.now();
    const windowMs = 60 * 1000;

    // 1. Check IP limit
    const ipRecord = this.ipLimits.get(ip) || { timestamps: [] };
    ipRecord.timestamps = ipRecord.timestamps.filter((ts) => now - ts < windowMs);

    if (ipRecord.timestamps.length >= this.maxPerIpPerMinute) {
      const oldest = ipRecord.timestamps[0];
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter), reason: 'Rate limit exceeded per IP' };
    }

    // 2. Check User limit if authenticated
    if (userId) {
      const userRecord = this.userLimits.get(userId) || { timestamps: [] };
      userRecord.timestamps = userRecord.timestamps.filter((ts) => now - ts < windowMs);

      if (userRecord.timestamps.length >= this.maxPerUserPerMinute) {
        const oldest = userRecord.timestamps[0];
        const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
        return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter), reason: 'Rate limit exceeded per User' };
      }

      userRecord.timestamps.push(now);
      this.userLimits.set(userId, userRecord);
    }

    ipRecord.timestamps.push(now);
    this.ipLimits.set(ip, ipRecord);

    return { allowed: true };
  }
}

// --- CLONE SAFETY & PATH TRAVERSAL PROTECTION ---

export interface CloneLimits {
  maxFileSize: number; // e.g. 1 MB
  maxTotalSize: number; // e.g. 50 MB
  maxFileCount: number; // e.g. 2000
  timeoutMs: number; // e.g. 60000 (60s)
}

export const DEFAULT_CLONE_LIMITS: CloneLimits = {
  maxFileSize: 1 * 1024 * 1024,      // 1 MB
  maxTotalSize: 50 * 1024 * 1024,    // 50 MB
  maxFileCount: 2000,
  timeoutMs: 60 * 1000,              // 60 seconds wall-clock timeout
};

export function validateSafeFilePath(tempBaseDir: string, relativePath: string): { safe: boolean; fullPath?: string; error?: string } {
  // Reject null bytes
  if (relativePath.includes('\0')) {
    return { safe: false, error: 'Path traversal: Null byte in path string' };
  }

  // Reject paths containing directory traversal or starting with slash
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    return { safe: false, error: `Path traversal: Illegal relative path "${relativePath}"` };
  }

  const resolvedBase = path.resolve(tempBaseDir);
  const resolvedFull = path.resolve(tempBaseDir, normalized);

  // Must remain strictly inside tempBaseDir
  if (!resolvedFull.startsWith(resolvedBase + path.sep)) {
    return { safe: false, error: `Path traversal: File resolved outside sandbox: "${resolvedFull}"` };
  }

  return { safe: true, fullPath: resolvedFull };
}

// --- AUDIT LOGGING FOR SENSITIVE ACTIONS ---

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorUsername: string;
  action: 'api_key.create' | 'api_key.revoke' | 'org.role_change' | 'org.member_invite' | 'org.member_remove' | 'auth.login' | 'auth.logout';
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ip: string;
}

export class AuditLogStore {
  private logs: AuditLogEntry[] = [
    {
      id: 'log-seed-01',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      actorId: 'usr-gh-98421',
      actorUsername: 'devishwas5',
      action: 'api_key.create',
      targetType: 'api_key',
      targetId: 'key-prod-01',
      details: { name: 'CI/CD GitHub Action Key', prefix: 'ra_live_98a7...' },
      ip: '127.0.0.1',
    },
    {
      id: 'log-seed-02',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      actorId: 'usr-gh-98421',
      actorUsername: 'devishwas5',
      action: 'org.role_change',
      targetType: 'org_member',
      targetId: 'usr-owner',
      details: { orgId: 'org-acme-eng', newRole: 'owner', previousRole: 'admin' },
      ip: '127.0.0.1',
    },
  ];

  public record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const record: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(record);
    if (this.logs.length > 500) this.logs.pop();
    return record;
  }

  public getLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }
}

// --- SECURE SESSION & CSRF MANAGEMENT ---

export interface SessionData {
  sessionId: string;
  csrfToken: string;
  user: any;
  createdAt: number;
  expiresAt: number;
}

export class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private anonCsrfTokens: Map<string, { token: string; expiresAt: number }> = new Map();

  public createSession(user: any): SessionData {
    const sessionId = crypto.randomUUID();
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const session: SessionData = {
      sessionId,
      csrfToken,
      user,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000, // 7 days
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): SessionData | null {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  public destroySession(sessionId: string): void {
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
  }

  public getOrCreateAnonCsrf(anonId: string): string {
    const existing = this.anonCsrfTokens.get(anonId);
    if (existing && Date.now() < existing.expiresAt) {
      return existing.token;
    }
    const token = crypto.randomBytes(32).toString('hex');
    this.anonCsrfTokens.set(anonId, { token, expiresAt: Date.now() + 24 * 3600 * 1000 });
    return token;
  }

  public validateCsrf(sessionId: string | undefined, anonId: string | undefined, providedToken: string | undefined): boolean {
    if (!providedToken) return false;

    if (sessionId) {
      const session = this.getSession(sessionId);
      if (session && session.csrfToken === providedToken) {
        return true;
      }
    }

    if (anonId) {
      const anon = this.anonCsrfTokens.get(anonId);
      if (anon && anon.token === providedToken) {
        return true;
      }
    }

    return false;
  }
}
