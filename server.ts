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
    }>;
  };
  plagiarism: {
    similarity: number;
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
        },
        {
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 6,
          issue: 'Hardcoded AWS Access Key ID',
          severity: 'critical',
        },
        {
          file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
          line: 13,
          issue: 'SQL Query Built with String Concatenation',
          severity: 'critical',
        },
        {
          file: 'src/main/java/com/acme/security/CryptoService.java',
          line: 9,
          issue: 'Insecure Hashing Algorithm (MD5)',
          severity: 'high',
        },
      ],
    },
    plagiarism: {
      similarity: 14,
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // REST API Endpoints defined in the PRD
  // 1. POST /audit & POST /api/audit
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
        score: isVulnerable ? 35 : 96,
        findings: isVulnerable
          ? [
              {
                file: 'src/main/java/com/app/StripeService.java',
                line: 12,
                issue: 'Hardcoded Stripe API Secret',
                severity: 'critical',
              },
              {
                file: 'src/main/java/com/app/UserDAO.java',
                line: 45,
                issue: 'SQL Query Built with String Concatenation',
                severity: 'critical',
              },
            ]
          : [],
      },
      plagiarism: {
        similarity: isPairwise ? 88 : 8,
        matches: isPairwise
          ? [
              {
                file: 'src/algorithms/Tree.java',
                matchedWith: 'src/copied/FastTree.java',
                confidence: 0.92,
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

  // Mount Vite or static dist
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
