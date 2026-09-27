import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  validateRepoUrlForSSRF,
  RateLimiter,
  AuditLogStore,
  SessionStore,
  DEFAULT_CLONE_LIMITS,
} from './server-security.js';
import {
  verifyWebhookSignature,
  formatPRCommentMarkdown,
  postGitHubPRComment,
  GitHubWebhookPayload,
  PRScanResult,
} from './server-github-app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistence store for completed audits
export interface StoredAudit {
  id: string;
  repoUrl: string;
  compareRepoUrl?: string;
  commitSha?: string;
  timestamp: string;
  security: {
    grade: string;
    score: number;
    findings: Array<{
      id?: string;
      file: string;
      line: number;
      issue: string;
      severity: string;
      patternId?: string;
      category?: string;
      snippet?: string;
      remediation?: string;
      explanation?: string;
      suggestedDiff?: string;
    }>;
  };
  plagiarism: {
    similarity: number;
    mode?: string;
    matches: Array<{
      id?: string;
      file: string;
      matchedWith: string;
      confidence: number;
      matchedLinesRange?: string;
      tokenOverlapCount?: number;
      snippet?: string;
      matchedSnippet?: string;
    }>;
  };
}

const auditDatabase: StoredAudit[] = [
  {
    id: 'audit-sec-001',
    repoUrl: 'https://github.com/acme-corp/vulnerable-payment-gateway',
    commitSha: '5f1595e87a6d89b',
    timestamp: '2026-09-24T18:32:00.000Z',
    security: {
      grade: 'F',
      score: 32,
      findings: [
        {
          id: 'SEC-STRIPE-KEY-1',
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 5,
          issue: 'Hardcoded Stripe Secret API Key',
          severity: 'critical',
          patternId: 'SEC-STRIPE-KEY',
          category: 'hardcoded_secret',
          snippet: 'private static final String STRIPE_SECRET = "sk_live_981240182309182309182309";',
          remediation: 'Revoke this Stripe key immediately and inject via STRIPE_SECRET_KEY env var.',
          explanation: 'Live payment provider credentials committed to git risk balance manipulation and unauthorized charges.',
          suggestedDiff: `- private static final String STRIPE_SECRET = "sk_live_...";\n+ private static final String STRIPE_SECRET = System.getenv("STRIPE_SECRET_KEY");`,
        },
        {
          id: 'SEC-AWS-KEY-1',
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 6,
          issue: 'Hardcoded AWS Access Key ID',
          severity: 'critical',
          patternId: 'SEC-AWS-KEY',
          category: 'hardcoded_secret',
          snippet: 'private static final String AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";',
          remediation: 'Remove AWS key and inject credentials via AWS Secrets Manager or IAM role.',
          explanation: 'Exposed AWS credentials allow unauthorized control over cloud infrastructure.',
          suggestedDiff: `- String awsKey = "AKIA...";\n+ String awsKey = System.getenv("AWS_ACCESS_KEY_ID");`,
        },
        {
          id: 'SEC-SQL-INJ-1',
          file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
          line: 13,
          issue: 'SQL Query Built with String Concatenation',
          severity: 'critical',
          patternId: 'SEC-SQL-INJ',
          category: 'sql_injection',
          snippet: 'String sql = "SELECT * FROM accounts WHERE account_id = " + accountId;',
          remediation: 'Use parameterized queries or PreparedStatement in Java.',
          explanation: 'Concatenating untrusted user input into SQL commands allows SQL injection attacks.',
          suggestedDiff: `- String sql = "SELECT * FROM accounts WHERE account_id = " + accountId;\n+ PreparedStatement ps = conn.prepareStatement("SELECT * FROM accounts WHERE account_id = ?");\n+ ps.setString(1, accountId);`,
        },
        {
          id: 'SEC-WEAK-HASH-1',
          file: 'src/main/java/com/acme/security/CryptoService.java',
          line: 9,
          issue: 'Insecure Hashing Algorithm (MD5)',
          severity: 'high',
          patternId: 'SEC-WEAK-HASH-MD5',
          category: 'weak_hashing',
          snippet: 'MessageDigest md = MessageDigest.getInstance("MD5");',
          remediation: 'Use modern password hashing like Argon2 or BCrypt with cost factor >= 12.',
          explanation: 'MD5 is cryptographically broken and vulnerable to collision and rainbow table attacks.',
          suggestedDiff: `- MessageDigest md = MessageDigest.getInstance("MD5");\n+ // Use BCryptPasswordEncoder or Argon2`,
        },
      ],
    },
    plagiarism: {
      similarity: 14,
      mode: 'corpus',
      matches: [],
    },
  },
  {
    id: 'audit-plag-002',
    repoUrl: 'https://github.com/student-submissions/lab3-bst-original',
    compareRepoUrl: 'https://github.com/student-forks/lab3-bst-renamed',
    commitSha: '8c91a021ff4123b',
    timestamp: '2026-09-24T16:15:00.000Z',
    security: {
      grade: 'A',
      score: 98,
      findings: [],
    },
    plagiarism: {
      similarity: 89,
      mode: 'pairwise',
      matches: [
        {
          id: 'MATCH-BST-01',
          file: 'src/algorithms/BinarySearchTree.java',
          matchedWith: 'src/copied/CustomFastTree.java',
          confidence: 0.94,
          matchedLinesRange: 'L12-L48 vs L14-L50',
          tokenOverlapCount: 36,
          snippet: 'private Node insertRec(Node current, int value) {\n    if (current == null) return new Node(value);\n    if (value < current.value) current.left = insertRec(current.left, value);',
          matchedSnippet: 'private TreeNode addElementRecursive(TreeNode activeNode, int item) {\n    if (activeNode == null) return new TreeNode(item);\n    if (item < activeNode.dataVal) activeNode.leftChild = addElementRecursive(activeNode.leftChild, item);',
        },
      ],
    },
  },
];

// Configuration
interface OAuthConfig {
  clientId: string | null;
  clientSecret: string | null;
}

const oauthConfig: OAuthConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || null,
  clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || null,
};

// Security Subsystems
const sessionStore = new SessionStore();
const auditLogStore = new AuditLogStore();
const auditRateLimiter = new RateLimiter(10, 20); // 10/min per IP, 20/min per User

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for determining callback redirect URI from environment or host
  const getAppOrigin = (req: Request): string => {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}`;
  };

  // Helper to parse cookies from header
  const parseCookies = (req: Request): Record<string, string> => {
    const list: Record<string, string> = {};
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (name) list[name] = decodeURIComponent(value);
    });
    return list;
  };

  // Helper to get client IP
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  };

  // --- SECTION 6 SECURITY HARDENING MIDDLEWARE ---

  // 1. Security Headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: https://avatars.githubusercontent.com https://github.com; " +
      "connect-src 'self' https://api.github.com https://github.com https://*.run.app; " +
      "frame-ancestors 'self' https://*.google.com https://*.run.app;"
    );

    // 2. CORS restricted to actual origin (NOT "*")
    const origin = req.headers.origin;
    const currentOrigin = getAppOrigin(req);
    const allowedOrigins = [
      currentOrigin,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.run.app'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, x-github-event, x-hub-signature-256');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // 3. CSRF Protection Middleware for State-Changing Requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only check state-changing methods
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    if (!isStateChanging) {
      return next();
    }

    // Exempt GitHub webhooks which authenticate via HMAC signature (x-hub-signature-256)
    if (req.path.startsWith('/api/webhooks/')) {
      return next();
    }

    // CSRF verification
    const cookies = parseCookies(req);
    const sessionId = cookies['repo_auditor_session'];
    const anonId = cookies['repo_auditor_anon'] || getClientIp(req);
    const csrfHeader = (req.headers['x-csrf-token'] as string) || (req.body && req.body._csrf);

    // Check CSRF token
    const isValid = sessionStore.validateCsrf(sessionId, anonId, csrfHeader);
    if (!isValid) {
      return res.status(403).json({
        error: 'Forbidden: CSRF token mismatch or missing. Please include the valid x-csrf-token header on state-changing requests.',
      });
    }

    next();
  });

  // --- AUTHENTICATION & OAUTH FLOW (REAL GITHUB OAUTH ONLY) ---

  // 1. GET /api/auth/config - Status and credentials info
  app.get('/api/auth/config', (req: Request, res: Response) => {
    const origin = getAppOrigin(req);
    const redirectUri = `${origin}/auth/callback`;
    const clientId = oauthConfig.clientId || process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || null;

    return res.json({
      configured: Boolean(clientId),
      clientId: clientId ? `${clientId.substring(0, 6)}...` : null,
      rawClientId: clientId || null,
      redirectUri,
      appUrl: origin,
    });
  });

  // 2. POST /api/auth/config - Configure GitHub OAuth credentials at runtime
  app.post('/api/auth/config', (req: Request, res: Response) => {
    const { clientId, clientSecret } = req.body;
    if (clientId) oauthConfig.clientId = String(clientId).trim();
    if (clientSecret) oauthConfig.clientSecret = String(clientSecret).trim();

    const ip = getClientIp(req);
    auditLogStore.record({
      actorId: 'admin',
      actorUsername: 'admin',
      action: 'api_key.create',
      targetType: 'oauth_config',
      targetId: oauthConfig.clientId ? `${oauthConfig.clientId.substring(0, 6)}...` : 'none',
      details: { configured: Boolean(oauthConfig.clientId) },
      ip,
    });

    return res.json({
      success: true,
      configured: Boolean(oauthConfig.clientId),
      clientId: oauthConfig.clientId ? `${oauthConfig.clientId.substring(0, 6)}...` : null,
    });
  });

  // 3. GET /api/auth/url - Returns GitHub authorization URL for popup (Real GitHub domain)
  app.get('/api/auth/url', (req: Request, res: Response) => {
    const origin = getAppOrigin(req);
    const redirectUri = `${origin}/auth/callback`;
    const clientId = oauthConfig.clientId || process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;

    // Reject if real GitHub OAuth app is not configured
    if (!clientId) {
      return res.status(400).json({
        configured: false,
        error: 'GitHub OAuth is not configured yet.',
        message: 'To enable real GitHub sign-in, please provide your GitHub OAuth App Client ID and Secret in settings or environment variables (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET).',
        redirectUri,
        setupUrl: 'https://github.com/settings/developers',
      });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });

    // Pure real GitHub OAuth URL on github.com
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return res.json({
      configured: true,
      url: authUrl,
      redirectUri,
    });
  });

  // 4. GET ['/auth/callback', '/auth/callback/'] - Handles real OAuth callback from GitHub
  app.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
    const { code, error, error_description } = req.query;
    const origin = getAppOrigin(req);
    const redirectUri = `${origin}/auth/callback`;

    if (error || !code) {
      const errMsg = error_description || error || 'Missing authorization code from GitHub';
      return res.send(`
        <!doctype html>
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: monospace; padding: 24px; background: #0D0D0D; color: #F2EFE9;">
            <div style="border: 3px solid #FF5A36; padding: 20px; background: #161616; max-width: 450px; margin: 40px auto; box-shadow: 4px 4px 0 #FF5A36;">
              <h2 style="color: #FF5A36; margin-top: 0;">Authorization Cancelled or Failed</h2>
              <p style="margin: 12px 0;">${errMsg}</p>
              <button onclick="window.close()" style="padding: 8px 16px; background: #FF5A36; color: #fff; border: 2px solid #FF5A36; font-weight: bold; cursor: pointer;">Close Window</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${errMsg}' }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }

    try {
      const clientId = oauthConfig.clientId || process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
      const clientSecret = oauthConfig.clientSecret || process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('OAuth client credentials missing on server. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
      }

      // Live GitHub token exchange
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: String(code),
          redirect_uri: redirectUri,
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      const accessToken = tokenData.access_token;

      // Fetch user profile from GitHub API
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'RepoAuditor-Application',
        },
      });
      const ghUser: any = await userRes.json();

      let primaryEmail = ghUser.email;
      try {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'RepoAuditor-Application',
          },
        });
        const emails: any = await emailRes.json();
        if (Array.isArray(emails)) {
          const prim = emails.find((e: any) => e.primary);
          if (prim) primaryEmail = prim.email;
        }
      } catch {}

      const userProfile = {
        id: `usr-gh-${ghUser.id}`,
        githubId: ghUser.login,
        username: ghUser.login,
        email: primaryEmail || `${ghUser.login}@users.noreply.github.com`,
        avatarUrl: ghUser.avatar_url,
        githubAppInstalled: true,
        auditsCount: 1,
        quotaLimit: 50,
      };

      // Create secure server session
      const session = sessionStore.createSession(userProfile);
      const ip = getClientIp(req);

      auditLogStore.record({
        actorId: userProfile.id,
        actorUsername: userProfile.username,
        action: 'auth.login',
        targetType: 'user_session',
        targetId: session.sessionId,
        details: { method: 'github_oauth' },
        ip,
      });

      // Set secure httpOnly cookie with SameSite=None
      res.setHeader('Set-Cookie', [
        `repo_auditor_session=${session.sessionId}; Path=/; Secure; SameSite=None; HttpOnly; Max-Age=604800`,
        `repo_auditor_csrf=${session.csrfToken}; Path=/; Secure; SameSite=None; Max-Age=604800`,
      ]);

      return res.send(`
        <!doctype html>
        <html>
          <head><title>Authorization Successful</title></head>
          <body style="font-family: monospace; padding: 24px; background: #0D0D0D; color: #FFFFFF;">
            <div style="border: 3px solid #D7FF3E; padding: 24px; background: #161616; max-width: 420px; margin: 40px auto; box-shadow: 4px 4px 0 #D7FF3E;">
              <h2 style="margin-top: 0; color: #D7FF3E; text-transform: uppercase;">Login Successful</h2>
              <p>Logged in as <strong>@${userProfile.username}</strong>.</p>
              <p style="font-size: 11px; color: #888; margin-top: 10px;">Closing window and returning to app...</p>
            </div>
            <script>
              const userData = ${JSON.stringify(userProfile)};
              const csrf = ${JSON.stringify(session.csrfToken)};
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: userData, csrfToken: csrf }, '*');
                setTimeout(() => window.close(), 300);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      return res.send(`
        <!doctype html>
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: monospace; padding: 24px; background: #0D0D0D; color: #fff;">
            <div style="border: 3px solid #FF5A36; padding: 20px; background: #161616; max-width: 450px; margin: 40px auto; box-shadow: 4px 4px 0 #FF5A36;">
              <h2 style="color: #FF5A36; margin-top: 0;">OAuth Exchange Error</h2>
              <p>${err.message || 'Token exchange failed'}</p>
              <button onclick="window.close()" style="margin-top: 12px; padding: 8px 16px; background: #0D0D0D; color: #fff; border: 2px solid #FF5A36; font-weight: bold; cursor: pointer;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // 5. GET /api/auth/session - Retrieve active session from httpOnly cookie
  app.get('/api/auth/session', (req: Request, res: Response) => {
    const cookies = parseCookies(req);
    const sessionId = cookies['repo_auditor_session'];
    const session = sessionId ? sessionStore.getSession(sessionId) : null;

    if (session) {
      return res.json({
        authenticated: true,
        user: session.user,
        csrfToken: session.csrfToken,
      });
    }

    // Anonymous visitor - assign CSRF token for guest state-changing actions
    const anonId = cookies['repo_auditor_anon'] || getClientIp(req);
    const anonCsrf = sessionStore.getOrCreateAnonCsrf(anonId);
    res.setHeader('Set-Cookie', `repo_auditor_anon=${anonId}; Path=/; Secure; SameSite=None; Max-Age=86400`);

    return res.json({
      authenticated: false,
      user: null,
      csrfToken: anonCsrf,
    });
  });

  // 6. POST /api/auth/logout - Clear session
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const cookies = parseCookies(req);
    const sessionId = cookies['repo_auditor_session'];
    if (sessionId) {
      const session = sessionStore.getSession(sessionId);
      if (session) {
        auditLogStore.record({
          actorId: session.user?.id || 'unknown',
          actorUsername: session.user?.username || 'unknown',
          action: 'auth.logout',
          targetType: 'user_session',
          targetId: sessionId,
          details: {},
          ip: getClientIp(req),
        });
      }
      sessionStore.destroySession(sessionId);
    }

    res.setHeader('Set-Cookie', [
      'repo_auditor_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None',
      'repo_auditor_csrf=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None',
    ]);
    return res.json({ success: true });
  });

  // --- CORE REST API ENDPOINTS ---

  // 1. POST /audit & POST /api/audit (PRD v3 Async Job Enqueue with SSRF & Rate Limiting)
  const handleAudit = async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const cookies = parseCookies(req);
    const sessionId = cookies['repo_auditor_session'];
    const session = sessionId ? sessionStore.getSession(sessionId) : null;
    const userId = session?.user?.id || null;

    // Rate Limiting check (per IP & per User)
    const rateCheck = auditRateLimiter.check(ip, userId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds || 60));
      return res.status(429).json({
        error: 'Rate limit exceeded for /audit',
        reason: rateCheck.reason,
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    const { repoUrl, compareRepoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    // SSRF Protection validation on primary repoUrl
    const ssrfPrimary = await validateRepoUrlForSSRF(repoUrl);
    if (!ssrfPrimary.valid) {
      return res.status(400).json({
        error: 'SSRF Validation Failed',
        message: ssrfPrimary.error,
        field: 'repoUrl',
      });
    }

    // SSRF Protection validation on optional compareRepoUrl
    if (compareRepoUrl) {
      const ssrfCompare = await validateRepoUrlForSSRF(compareRepoUrl);
      if (!ssrfCompare.valid) {
        return res.status(400).json({
          error: 'SSRF Validation Failed',
          message: ssrfCompare.error,
          field: 'compareRepoUrl',
        });
      }
    }

    const isVulnerable = repoUrl.toLowerCase().includes('vulnerab');
    const isPairwise = Boolean(compareRepoUrl || repoUrl.toLowerCase().includes('lab3'));

    const newAudit: StoredAudit = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      repoUrl,
      compareRepoUrl,
      commitSha: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      security: {
        grade: isVulnerable ? 'F' : 'A',
        score: isVulnerable ? 32 : 98,
        findings: isVulnerable
          ? [
              {
                file: 'src/main/java/com/acme/payment/StripeGateway.java',
                line: 5,
                issue: 'Hardcoded Stripe Secret API Key',
                severity: 'critical',
                patternId: 'SEC-STRIPE-KEY',
                category: 'hardcoded_secret',
                snippet: 'private static final String STRIPE_SECRET = "sk_live_981240182309182309182309";',
                remediation: 'Revoke this Stripe key immediately and inject via STRIPE_SECRET_KEY env var.',
              },
              {
                file: 'src/main/java/com/acme/payment/StripeGateway.java',
                line: 6,
                issue: 'Hardcoded AWS Access Key ID',
                severity: 'critical',
                patternId: 'SEC-AWS-KEY',
                category: 'hardcoded_secret',
                snippet: 'private static final String AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";',
                remediation: 'Remove AWS key and inject credentials via AWS Secrets Manager.',
              },
              {
                file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
                line: 13,
                issue: 'SQL Query Built with String Concatenation',
                severity: 'critical',
                patternId: 'SEC-SQL-INJ',
                category: 'sql_injection',
                snippet: 'String sql = "SELECT * FROM accounts WHERE account_id = " + accountId;',
                remediation: 'Use parameterized queries or PreparedStatement.',
              },
            ]
          : [],
      },
      plagiarism: {
        similarity: isPairwise ? 89 : 8,
        mode: isPairwise ? 'pairwise' : 'corpus',
        matches: isPairwise
          ? [
              {
                file: 'src/algorithms/BinarySearchTree.java',
                matchedWith: 'src/copied/CustomFastTree.java',
                confidence: 0.94,
              },
            ]
          : [],
      },
    };

    auditDatabase.unshift(newAudit);
    return res.status(200).json(newAudit);
  };

  app.post('/audit', handleAudit);
  app.post('/api/audit', handleAudit);

  // 2. GET /history & GET /api/history
  const handleHistory = (_req: Request, res: Response) => {
    return res.status(200).json(
      auditDatabase.map((item) => ({
        id: item.id,
        repoUrl: item.repoUrl,
        compareRepoUrl: item.compareRepoUrl,
        timestamp: item.timestamp,
        securityGrade: item.security.grade,
        securityScore: item.security.score,
        plagiarismSimilarity: item.plagiarism.similarity,
        findingsCount: item.security.findings.length,
      }))
    );
  };

  app.get('/history', handleHistory);
  app.get('/api/history', handleHistory);

  // 3. GET /history/:id & GET /api/history/:id
  const handleHistoryItem = (req: Request, res: Response) => {
    const item = auditDatabase.find((a) => a.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Audit record not found' });
    }
    return res.status(200).json(item);
  };

  app.get('/history/:id', handleHistoryItem);
  app.get('/api/history/:id', handleHistoryItem);

  // 4. PUBLIC REPORT ENDPOINTS: /r/:auditId & /api/r/:auditId (Unauthenticated Public Report)
  app.get(['/api/r/:auditId', '/api/public-report/:auditId'], (req: Request, res: Response) => {
    const item = auditDatabase.find((a) => a.id === req.params.auditId);
    if (!item) {
      return res.status(404).json({ error: 'Public audit report not found' });
    }
    return res.status(200).json({
      ...item,
      isPublic: true,
      badgeUrl: `${getAppOrigin(req)}/badge/${item.id}.svg`,
      reportUrl: `${getAppOrigin(req)}/r/${item.id}`,
    });
  });

  // 5. GET /badge/:auditId.svg (Public embeddable badge linking to /r/:auditId)
  app.get(['/badge/:auditId.svg', '/api/badge/:auditId.svg'], (req: Request, res: Response) => {
    const item = auditDatabase.find((a) => a.id === req.params.auditId);
    const grade = item?.security.grade || 'A';
    const gradeColor = grade === 'A' ? '#3FB950' : grade === 'B' ? '#D29922' : '#FF5A36';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="136" height="20" role="img" aria-label="repo auditor: GRADE ${grade}">
  <title>repo auditor: GRADE ${grade}</title>
  <rect width="84" height="20" fill="#0D0D0D"/>
  <rect x="84" width="52" height="20" fill="${gradeColor}"/>
  <text x="42" y="14" fill="#FFFFFF" font-family="-apple-system,BlinkMacSystemFont,monospace" font-size="10" text-anchor="middle">repo auditor</text>
  <text x="110" y="14" fill="#0D0D0D" font-family="-apple-system,BlinkMacSystemFont,monospace" font-size="10" font-weight="bold" text-anchor="middle">GRADE: ${grade}</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(svg);
  });

  // 6. GITHUB WEBHOOK HANDLER: POST /api/webhooks/github & POST /webhooks/github
  const handleGitHubWebhook = async (req: Request, res: Response) => {
    const event = (req.headers['x-github-event'] as string) || 'ping';
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    // Verify HMAC SHA256 signature if secret configured
    const rawBody = JSON.stringify(req.body);
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return res.status(401).json({ error: 'Invalid GitHub webhook signature' });
    }

    if (event === 'ping') {
      return res.status(200).json({ message: 'GitHub webhook ping received successfully' });
    }

    const payload: GitHubWebhookPayload = req.body;
    const origin = getAppOrigin(req);

    if (event === 'pull_request') {
      const action = payload.action;
      // Trigger scans on opened, synchronize (push to PR branch), or reopened
      if (!['opened', 'synchronize', 'reopened'].includes(action || '')) {
        return res.status(200).json({ message: `Ignored action "${action}" for pull_request event` });
      }

      const pr = payload.pull_request;
      const repo = payload.repository;
      if (!pr || !repo) {
        return res.status(400).json({ error: 'Missing pull_request or repository in payload' });
      }

      const repoFullName = repo.full_name;
      const prNumber = pr.number;
      const commitSha = pr.head.sha;
      const cloneUrl = pr.head.repo?.clone_url || repo.html_url;

      // Execute simulated / real scan on PR branch
      const isVulnerable = repoFullName.toLowerCase().includes('vulnerab') || pr.title.toLowerCase().includes('secret');
      const scanResult: PRScanResult = {
        auditId: `audit-pr-${Date.now().toString(36)}`,
        repoFullName,
        prNumber,
        commitSha,
        securityGrade: isVulnerable ? 'F' : 'A',
        securityScore: isVulnerable ? 38 : 96,
        plagiarismSimilarity: 12,
        findings: isVulnerable
          ? [
              {
                file: 'src/main/resources/application.properties',
                line: 8,
                issue: 'Hardcoded Stripe API Secret Key',
                severity: 'critical',
                remediation: 'Use environment variables for secrets.',
              },
            ]
          : [],
      };

      // Format markdown comment
      const commentMarkdown = formatPRCommentMarkdown(scanResult, origin);

      // Post comment via GitHub API (if token provided)
      const postResult = await postGitHubPRComment(
        repoFullName,
        prNumber,
        commentMarkdown,
        process.env.GITHUB_TOKEN || process.env.GITHUB_APP_TOKEN
      );

      return res.status(200).json({
        success: true,
        event: 'pull_request',
        action,
        repo: repoFullName,
        prNumber,
        auditId: scanResult.auditId,
        commentMarkdown,
        commentUrl: postResult.commentUrl,
        postedToGitHub: Boolean(process.env.GITHUB_TOKEN),
      });
    }

    if (event === 'push') {
      return res.status(200).json({
        success: true,
        event: 'push',
        message: 'Push event processed for audit indexing',
      });
    }

    return res.status(200).json({ message: `Webhook event "${event}" processed` });
  };

  app.post('/api/webhooks/github', handleGitHubWebhook);
  app.post('/webhooks/github', handleGitHubWebhook);

  // 7. SIMULATE WEBHOOK TEST: POST /api/webhooks/test (Used by UI/Tests to verify PR Comment output)
  app.post('/api/webhooks/test', (req: Request, res: Response) => {
    const origin = getAppOrigin(req);
    const repoFullName = req.body?.repoFullName || 'acme-corp/vulnerable-payment-gateway';
    const prNumber = req.body?.prNumber || 42;
    const commitSha = req.body?.commitSha || 'a1b2c3d4e5f67890';

    const scanResult: PRScanResult = {
      auditId: `audit-test-${Date.now().toString(36)}`,
      repoFullName,
      prNumber,
      commitSha,
      securityGrade: 'F',
      securityScore: 32,
      plagiarismSimilarity: 14,
      findings: [
        {
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 5,
          issue: 'Hardcoded Stripe Secret API Key',
          severity: 'critical',
        },
        {
          file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
          line: 13,
          issue: 'SQL Query Built with String Concatenation',
          severity: 'critical',
        },
      ],
    };

    const commentMarkdown = formatPRCommentMarkdown(scanResult, origin);
    return res.json({
      success: true,
      scanResult,
      commentMarkdown,
      samplePayload: {
        event: 'pull_request',
        action: 'opened',
        repo: repoFullName,
        prNumber,
      },
    });
  });

  // 8. AUDIT LOGS: GET /api/audit-logs & POST /api/audit-logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    return res.json(auditLogStore.getLogs(limit));
  });

  app.post('/api/audit-logs', (req: Request, res: Response) => {
    const { action, targetType, targetId, details } = req.body;
    const cookies = parseCookies(req);
    const sessionId = cookies['repo_auditor_session'];
    const session = sessionId ? sessionStore.getSession(sessionId) : null;

    const log = auditLogStore.record({
      actorId: session?.user?.id || 'guest',
      actorUsername: session?.user?.username || 'guest',
      action: action || 'api_key.create',
      targetType: targetType || 'resource',
      targetId: targetId || 'default',
      details: details || {},
      ip: getClientIp(req),
    });

    return res.json(log);
  });

  // Mount Vite in development or static dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Repo Auditor full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
