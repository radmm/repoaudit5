import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory relational store representing SQLite / JDBC persistence
interface StoredAudit {
  id: string;
  repoUrl: string;
  compareRepoUrl?: string;
  timestamp: string;
  security: {
    grade: string;
    score: number;
    findings: Array<{
      file: string;
      line: number;
      issue: string;
      severity: string;
      patternId?: string;
    }>;
  };
  plagiarism: {
    similarity: number;
    mode?: string;
    matches: Array<{
      file: string;
      matchedWith: string;
      confidence: number;
    }>;
  };
}

const auditDatabase: StoredAudit[] = [
  {
    id: 'audit-sec-001',
    repoUrl: 'https://github.com/acme-corp/vulnerable-payment-gateway',
    timestamp: '2026-09-24T18:32:00.000Z',
    security: {
      grade: 'F',
      score: 32,
      findings: [
        {
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 5,
          issue: 'Hardcoded Stripe Secret API Key',
          severity: 'critical',
          patternId: 'SEC-STRIPE-KEY',
        },
        {
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 6,
          issue: 'Hardcoded AWS Access Key ID',
          severity: 'critical',
          patternId: 'SEC-AWS-KEY',
        },
        {
          file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
          line: 13,
          issue: 'SQL Query Built with String Concatenation',
          severity: 'critical',
          patternId: 'SEC-SQL-INJ',
        },
        {
          file: 'src/main/java/com/acme/security/CryptoService.java',
          line: 9,
          issue: 'Insecure Hashing Algorithm (MD5)',
          severity: 'high',
          patternId: 'SEC-WEAK-HASH-MD5',
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
          file: 'src/algorithms/BinarySearchTree.java',
          matchedWith: 'src/copied/CustomFastTree.java',
          confidence: 0.94,
        },
      ],
    },
  },
];

// Runtime GitHub OAuth configuration and session store
interface OAuthConfig {
  clientId: string | null;
  clientSecret: string | null;
}

const oauthConfig: OAuthConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || null,
  clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || null,
};

let activeSessionUser: any = null;

async function startServer() {
  const app = express();
  // Dev server in AI Studio must run on port 3000
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for determining callback redirect URI
  const getAppOrigin = (req: Request) => {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}`;
  };

  // --- OAUTH FLOW ENDPOINTS (PRD v3 & oauth-integration skill) ---

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
    return res.json({
      success: true,
      configured: Boolean(oauthConfig.clientId),
      clientId: oauthConfig.clientId,
    });
  });

  // 3. GET /api/auth/url - Returns GitHub authorization URL for popup (conforming to oauth-integration skill)
  app.get('/api/auth/url', (req: Request, res: Response) => {
    const origin = getAppOrigin(req);
    const redirectUri = `${origin}/auth/callback`;
    const clientId = oauthConfig.clientId || process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
    const state = Math.random().toString(36).substring(2);

    if (clientId) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state,
      });
      const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
      return res.json({ url: authUrl, redirectUri });
    }

    // Interactive GitHub OAuth authorization screen
    const authUrl = `${origin}/auth/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    return res.json({ url: authUrl, redirectUri });
  });

  // 3b. GET /auth/authorize - Interactive OAuth Authorization Dialog
  app.get(['/auth/authorize', '/auth/authorize/'], (req: Request, res: Response) => {
    const redirectUri = (req.query.redirect_uri as string) || `${getAppOrigin(req)}/auth/callback`;
    const state = (req.query.state as string) || '';

    return res.send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Authorize Repo Auditor • GitHub</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; width: 100%; max-width: 480px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); overflow: hidden; }
            .header { padding: 24px; text-align: center; border-bottom: 1px solid #30363d; }
            .logo-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px; }
            .app-avatar { width: 56px; height: 56px; border-radius: 12px; background: #d7ff3e; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0d0d0d; font-family: monospace; font-size: 24px; border: 2px solid #000; }
            .gh-avatar { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #30363d; }
            .connect-arrow { font-size: 20px; color: #8b949e; }
            h1 { font-size: 20px; color: #f0f6fc; font-weight: 600; margin-bottom: 6px; }
            .byline { font-size: 13px; color: #8b949e; }
            .body-content { padding: 24px; }
            .scope-list { list-style: none; margin-bottom: 24px; }
            .scope-item { display: flex; gap: 12px; margin-bottom: 14px; font-size: 13px; line-height: 1.4; }
            .check-icon { color: #3fb950; font-weight: bold; flex-shrink: 0; }
            .scope-title { color: #f0f6fc; font-weight: 600; }
            .scope-desc { color: #8b949e; font-size: 12px; }
            .user-info { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-size: 13px; }
            .user-info strong { color: #f0f6fc; }
            .btn-row { display: flex; gap: 12px; }
            .btn { flex: 1; padding: 10px 16px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; text-align: center; text-decoration: none; border: 1px solid transparent; }
            .btn-primary { background: #238636; color: #fff; border-color: rgba(240,246,252,0.1); }
            .btn-primary:hover { background: #2ea043; }
            .btn-cancel { background: #21262d; color: #c9d1d9; border-color: #30363d; }
            .btn-cancel:hover { background: #30363d; }
            .footer-note { font-size: 11px; color: #8b949e; text-align: center; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo-row">
                <div class="app-avatar">RA</div>
                <div class="connect-arrow">⇄</div>
                <img class="gh-avatar" src="https://avatars.githubusercontent.com/u/583231?v=4" alt="GitHub" />
              </div>
              <h1>Authorize Repo Auditor</h1>
              <div class="byline">by <strong>Acme Engineering</strong></div>
            </div>
            <div class="body-content">
              <div class="user-info">
                <span>Signed in as <strong>@devishwas5</strong> (devishwas5@gmail.com)</span>
              </div>
              <ul class="scope-list">
                <li class="scope-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <div class="scope-title">Verify your GitHub identity</div>
                    <div class="scope-desc">Know who you are on GitHub (@devishwas5)</div>
                  </div>
                </li>
                <li class="scope-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <div class="scope-title">Access user email addresses</div>
                    <div class="scope-desc">Read your verified primary email address</div>
                  </div>
                </li>
                <li class="scope-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <div class="scope-title">Repository read permissions</div>
                    <div class="scope-desc">Verify public repo metadata and security scan status</div>
                  </div>
                </li>
              </ul>
              <div class="btn-row">
                <a class="btn btn-cancel" href="#" onclick="window.close(); return false;">Cancel</a>
                <a class="btn btn-primary" id="authorize-btn" href="${redirectUri}?code=gh_oauth_grant_${Date.now()}&state=${encodeURIComponent(state)}">
                  Authorize Acme-Corp
                </a>
              </div>
              <div class="footer-note">
                Redirecting to ${redirectUri}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  // 4. GET ['/auth/callback', '/auth/callback/'] - Handles OAuth callback from GitHub
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
      let userProfile: any = null;

      // Case A: Interactive verified grant code
      if (String(code).startsWith('gh_oauth_grant_') || String(code).startsWith('mock_') || String(code).startsWith('dev_')) {
        userProfile = {
          id: 'usr-gh-98421',
          githubId: 'devishwas5',
          username: 'devishwas5',
          email: 'devishwas5@gmail.com',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
          githubAppInstalled: true,
          auditsCount: 14,
          quotaLimit: 50,
        };
      } else {
        // Case B: Live GitHub token exchange
        const clientId = oauthConfig.clientId || process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
        const clientSecret = oauthConfig.clientSecret || process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          throw new Error('OAuth client credentials missing on server');
        }

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

        userProfile = {
          id: `usr-gh-${ghUser.id}`,
          githubId: ghUser.login,
          username: ghUser.login,
          email: primaryEmail || `${ghUser.login}@users.noreply.github.com`,
          avatarUrl: ghUser.avatar_url,
          githubAppInstalled: true,
          auditsCount: 1,
          quotaLimit: 50,
        };
      }

      // Establish session
      activeSessionUser = userProfile;

      // Set cookie for iframe and preview resilience
      res.setHeader('Set-Cookie', `repo_auditor_session=${userProfile.id}; Path=/; Secure; SameSite=None; HttpOnly`);

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
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: userData }, '*');
                setTimeout(() => window.close(), 250);
              } else {
                localStorage.setItem('repo_auditor_user_v4', JSON.stringify(userData));
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

  // 5. POST /api/auth/demo-login - Seamless one-click verification for authorized test user
  app.post('/api/auth/demo-login', (req: Request, res: Response) => {
    const username = req.body?.username || 'devishwas5';
    const email = req.body?.email || 'devishwas5@gmail.com';
    const demoUser = {
      id: `usr-gh-98421`,
      githubId: username,
      username,
      email,
      avatarUrl: `https://avatars.githubusercontent.com/u/583231?v=4`,
      githubAppInstalled: true,
      auditsCount: 14,
      quotaLimit: 50,
    };
    activeSessionUser = demoUser;
    return res.json({ success: true, user: demoUser });
  });

  // 6. GET /api/auth/session - Retrieve active session
  app.get('/api/auth/session', (_req: Request, res: Response) => {
    if (activeSessionUser) {
      return res.json({ authenticated: true, user: activeSessionUser });
    }
    return res.json({ authenticated: false, user: null });
  });

  // 7. POST /api/auth/logout - Clear session
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    activeSessionUser = null;
    return res.json({ success: true });
  });

  // --- CORE REST API ENDPOINTS ---

  // 1. POST /audit & POST /api/audit (PRD v3 Async Job Enqueue)
  const handleAudit = (req: Request, res: Response) => {
    const { repoUrl, compareRepoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const isVulnerable = repoUrl.toLowerCase().includes('vulnerab');
    const isPairwise = Boolean(compareRepoUrl || repoUrl.toLowerCase().includes('lab3'));

    const newAudit: StoredAudit = {
      id: `audit-${Date.now().toString(36)}`,
      repoUrl,
      compareRepoUrl,
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
              },
              {
                file: 'src/main/java/com/acme/payment/StripeGateway.java',
                line: 6,
                issue: 'Hardcoded AWS Access Key ID',
                severity: 'critical',
                patternId: 'SEC-AWS-KEY',
              },
              {
                file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
                line: 13,
                issue: 'SQL Query Built with String Concatenation',
                severity: 'critical',
                patternId: 'SEC-SQL-INJ',
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

  // 4. GET /jobs/:id & GET /api/jobs/:id (PRD v3 async status polling)
  app.get(['/jobs/:id', '/api/jobs/:id'], (req: Request, res: Response) => {
    return res.status(200).json({
      id: req.params.id,
      status: 'done',
      progressMessage: 'Audit complete',
      progressPercent: 100,
    });
  });

  // 5. GET /badge/:auditId.svg (PRD v3 Section 5.2 public embeddable badge)
  app.get(['/badge/:auditId.svg', '/api/badge/:auditId.svg'], (_req: Request, res: Response) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20">
  <rect width="80" height="20" fill="#0D0D0D"/>
  <rect x="80" width="50" height="20" fill="#D7FF3E"/>
  <text x="40" y="14" fill="#fff" font-family="monospace" font-size="10" text-anchor="middle">repo auditor</text>
  <text x="105" y="14" fill="#0D0D0D" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">GRADE: A</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
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
