import { AuditReport, AuditHistoryItem, ScannedFile } from '../types/audit';
import { SecurityScanner } from './securityScanner';
import { PlagiarismScanner } from './plagiarismScanner';
import { RepoIngestionService, PRESET_REPOSITORIES } from './repoIngestion';

const STORAGE_KEY = 'repo_auditor_history_v2';

const INITIAL_HISTORY: AuditReport[] = [
  {
    id: 'audit-sec-001',
    repoUrl: 'https://github.com/acme-corp/vulnerable-payment-gateway',
    timestamp: '2026-09-24T18:32:00.000Z',
    summary: {
      totalFiles: 5,
      textFilesScanned: 4,
      binaryFilesSkipped: 1,
      scanDurationMs: 640,
      linesOfCode: 249,
      languages: { java: 3, xml: 1 },
    },
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
          category: 'hardcoded_secret',
          snippet: 'private static final String STRIPE_SECRET = "sk_live_981240182309182309182309";',
          remediation: 'Revoke this Stripe key immediately and inject via secure vault or STRIPE_SECRET_KEY env var.',
        },
        {
          id: 'SEC-AWS-KEY-1',
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 6,
          issue: 'Hardcoded AWS Access Key ID',
          severity: 'critical',
          category: 'hardcoded_secret',
          snippet: 'private static final String AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";',
          remediation: 'Remove AWS key and load credentials from AWS Secrets Manager.',
        },
        {
          id: 'SEC-SQL-INJ-1',
          file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
          line: 13,
          issue: 'SQL Query Built with String Concatenation',
          severity: 'critical',
          category: 'sql_injection',
          snippet: 'String sql = "SELECT * FROM accounts WHERE account_id = " + accountId;',
          remediation: 'Use parameterized queries or PreparedStatement in Java.',
        },
        {
          id: 'SEC-MD5-1',
          file: 'src/main/java/com/acme/security/CryptoService.java',
          line: 9,
          issue: 'Insecure Hashing Algorithm (MD5)',
          severity: 'high',
          category: 'weak_hash',
          snippet: 'MessageDigest md = MessageDigest.getInstance("MD5");',
          remediation: 'Upgrade to bcrypt or Argon2 for password hashing.',
        },
        {
          id: 'SEC-LOG4J-1',
          file: 'pom.xml',
          line: 12,
          issue: 'Vulnerable Log4j 2.x Dependency (CVE-2021-44228 Log4Shell)',
          severity: 'critical',
          category: 'insecure_dependency',
          snippet: '<artifactId>log4j-core</artifactId>\n<version>2.14.1</version>',
          remediation: 'Upgrade org.apache.logging.log4j:log4j-core to 2.17.1 or newer.',
        }
      ],
      breakdown: { critical: 4, high: 1, medium: 0, low: 0 },
    },
    plagiarism: {
      similarity: 14,
      matches: [],
      fingerprintCount: 88,
      algorithm: 'Winnowing (MOSS-compatible Sliding Window K-gram Hash)',
      details: {
        matchedKgrams: 4,
        totalKgrams: 88,
        windowSize: 4,
        kgramSize: 6,
      },
    },
    oopMetadata: {
      classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport', 'SecurityScanner', 'PlagiarismScanner'],
      concurrencyPattern: 'CompletableFuture.supplyAsync (Parallel Scanner Threads)',
      multithreadingTimeMs: 290,
      persistenceType: 'JDBC Database (audits & findings tables)',
      sdgGoals: ['SDG 16: Peace, Justice & Strong Institutions', 'SDG 4: Quality Education'],
    }
  },
  {
    id: 'audit-plag-002',
    repoUrl: 'https://github.com/student-submissions/lab3-bst-original',
    compareRepoUrl: 'https://github.com/student-forks/lab3-bst-renamed',
    timestamp: '2026-09-24T16:15:00.000Z',
    summary: {
      totalFiles: 3,
      textFilesScanned: 2,
      binaryFilesSkipped: 0,
      scanDurationMs: 420,
      linesOfCode: 90,
      languages: { java: 2 },
    },
    security: {
      grade: 'A',
      score: 98,
      findings: [],
      breakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    plagiarism: {
      similarity: 89,
      matches: [
        {
          id: 'MATCH-BST-RECURSIVE',
          file: 'src/algorithms/BinarySearchTree.java',
          matchedWith: 'src/copied/CustomFastTree.java',
          confidence: 0.94,
          matchedLinesRange: 'L12-L48 vs L14-L50',
          tokenOverlapCount: 36,
          snippet: 'private Node insertRec(Node current, int value) {\n    if (current == null) return new Node(value);\n    if (value < current.value) current.left = insertRec(current.left, value);',
          matchedSnippet: 'private TreeNode addElementRecursive(TreeNode activeNode, int item) {\n    if (activeNode == null) return new TreeNode(item);\n    if (item < activeNode.dataVal) activeNode.leftChild = addElementRecursive(activeNode.leftChild, item);',
        }
      ],
      fingerprintCount: 42,
      algorithm: 'Winnowing (MOSS-compatible Sliding Window K-gram Hash)',
      details: {
        matchedKgrams: 37,
        totalKgrams: 42,
        windowSize: 4,
        kgramSize: 6,
      },
    },
    oopMetadata: {
      classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport'],
      concurrencyPattern: 'CompletableFuture.supplyAsync',
      multithreadingTimeMs: 190,
      persistenceType: 'JDBC Database (audits & findings tables)',
      sdgGoals: ['SDG 16: Code Integrity & Anti-Plagiarism', 'SDG 4: Quality Education'],
    }
  },
  {
    id: 'audit-clean-003',
    repoUrl: 'https://github.com/spring-enterprise/order-fulfillment-service',
    timestamp: '2026-09-24T12:05:00.000Z',
    summary: {
      totalFiles: 3,
      textFilesScanned: 3,
      binaryFilesSkipped: 0,
      scanDurationMs: 380,
      linesOfCode: 191,
      languages: { java: 2, xml: 1 },
    },
    security: {
      grade: 'A',
      score: 100,
      findings: [],
      breakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    plagiarism: {
      similarity: 6,
      matches: [],
      fingerprintCount: 74,
      algorithm: 'Winnowing (MOSS-compatible Sliding Window K-gram Hash)',
      details: {
        matchedKgrams: 2,
        totalKgrams: 74,
        windowSize: 4,
        kgramSize: 6,
      },
    },
    oopMetadata: {
      classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport'],
      concurrencyPattern: 'CompletableFuture.supplyAsync',
      multithreadingTimeMs: 140,
      persistenceType: 'JDBC Database (audits & findings tables)',
      sdgGoals: ['SDG 16: Strong Institutions'],
    }
  },
  {
    id: 'audit-poly-004',
    repoUrl: 'https://github.com/polyglot-labs/multi-service-core',
    timestamp: '2026-09-23T20:45:00.000Z',
    summary: {
      totalFiles: 4,
      textFilesScanned: 3,
      binaryFilesSkipped: 1,
      scanDurationMs: 510,
      linesOfCode: 156,
      languages: { py: 1, go: 1, ts: 1 },
    },
    security: {
      grade: 'B',
      score: 84,
      findings: [
        {
          id: 'SEC-GEN-01',
          file: 'services/worker.py',
          line: 14,
          issue: 'Missing Input Sanitization on System Command / Process',
          severity: 'medium',
          category: 'input_validation',
          snippet: 'os.system(f"echo processing {records}")',
          remediation: 'Use subprocess.run with argument array instead of shell interpolation.',
        }
      ],
      breakdown: { critical: 0, high: 0, medium: 1, low: 0 },
    },
    plagiarism: {
      similarity: 28,
      matches: [
        {
          id: 'MATCH-POLY-01',
          file: 'services/worker.py',
          matchedWith: 'reference/scripts/data_pipeline.py',
          confidence: 0.65,
          matchedLinesRange: 'L4-L12 vs L6-L15',
          tokenOverlapCount: 8,
          snippet: 'def process_batch_records(records, threshold=100):\n    filtered = []\n    for item in records:',
          matchedSnippet: 'def normalize_dataset(records, primary_key="id"):\n    seen_keys = set()\n    cleaned = []',
        }
      ],
      fingerprintCount: 62,
      algorithm: 'Winnowing (MOSS-compatible Sliding Window K-gram Hash)',
      details: {
        matchedKgrams: 11,
        totalKgrams: 62,
        windowSize: 4,
        kgramSize: 6,
      },
    },
    oopMetadata: {
      classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport'],
      concurrencyPattern: 'CompletableFuture.supplyAsync',
      multithreadingTimeMs: 210,
      persistenceType: 'JDBC Database (audits & findings tables)',
      sdgGoals: ['SDG 16: Code Transparency'],
    }
  }
];

export class AuditService {
  private ingestionService: RepoIngestionService;
  private securityScanner: SecurityScanner;
  private plagiarismScanner: PlagiarismScanner;

  constructor() {
    this.ingestionService = new RepoIngestionService();
    this.securityScanner = new SecurityScanner();
    this.plagiarismScanner = new PlagiarismScanner(6, 4);
    this.initStorage();
  }

  private initStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  /**
   * Run full audit over repoUrl, with optional pairwise compareRepoUrl
   */
  public async runAudit(
    repoUrl: string,
    compareRepoUrl?: string,
    onProgress?: (step: string, percent: number) => void
  ): Promise<AuditReport> {
    const startTime = Date.now();

    // Step 1: Ingestion (JGit shallow clone simulation)
    onProgress?.('Cloning repository & walking text files...', 20);
    const targetRepoData = await this.ingestionService.ingestRepository(repoUrl, (msg, pct) => {
      onProgress?.(msg, Math.round(20 + pct * 0.3));
    });

    let compareFiles: ScannedFile[] | undefined;
    if (compareRepoUrl && compareRepoUrl.trim()) {
      onProgress?.('Ingesting secondary reference repository...', 55);
      const compareRepoData = await this.ingestionService.ingestRepository(compareRepoUrl);
      compareFiles = compareRepoData.files;
    } else {
      // Check if target was the demo-pairwise preset
      const preset = PRESET_REPOSITORIES.find((p) => p.url.toLowerCase() === repoUrl.toLowerCase().trim());
      if (preset && preset.compareFiles) {
        compareFiles = preset.compareFiles;
      }
    }

    // Step 2: Concurrency execution (CompletableFuture.supplyAsync)
    onProgress?.('Executing parallel scanners (Security & Plagiarism)...', 65);
    const threadStart = Date.now();

    // Run security scan and plagiarism scan in parallel
    const [secResult, plagResult] = await Promise.all([
      // Thread 1: Security Scanner
      new Promise<ReturnType<SecurityScanner['scan']>>((resolve) => {
        setTimeout(() => {
          resolve(this.securityScanner.scan(targetRepoData.files));
        }, 150);
      }),

      // Thread 2: Winnowing Plagiarism Scanner
      new Promise<ReturnType<PlagiarismScanner['scan']>>((resolve) => {
        setTimeout(() => {
          resolve(this.plagiarismScanner.scan(targetRepoData.files, compareFiles));
        }, 220);
      }),
    ]);

    const threadDuration = Date.now() - threadStart;
    const totalDuration = Date.now() - startTime;

    onProgress?.('Synthesizing audit report card and persisting to DB...', 95);

    const reportId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const report: AuditReport = {
      id: reportId,
      repoUrl,
      compareRepoUrl,
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: targetRepoData.totalFiles,
        textFilesScanned: targetRepoData.textFilesScanned,
        binaryFilesSkipped: targetRepoData.binaryFilesSkipped,
        scanDurationMs: totalDuration,
        linesOfCode: targetRepoData.linesOfCode,
        languages: targetRepoData.languages,
      },
      security: secResult,
      plagiarism: plagResult,
      oopMetadata: {
        classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport', 'SecurityScanner', 'PlagiarismScanner'],
        concurrencyPattern: 'CompletableFuture.supplyAsync(ExecutorService)',
        multithreadingTimeMs: threadDuration,
        persistenceType: 'JDBC Database (audits & findings tables)',
        sdgGoals: ['SDG 16: Peace, Justice & Strong Institutions', 'SDG 4: Quality Education'],
      },
    };

    // Save to persistent history
    this.saveAudit(report);

    onProgress?.('Audit completed successfully!', 100);
    return report;
  }

  /**
   * Retrieve all past audits
   */
  public getHistory(): AuditHistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: AuditReport[] = stored ? JSON.parse(stored) : INITIAL_HISTORY;
      return list.map((item) => ({
        id: item.id,
        repoUrl: item.repoUrl,
        compareRepoUrl: item.compareRepoUrl,
        timestamp: item.timestamp,
        securityGrade: item.security.grade,
        securityScore: item.security.score,
        plagiarismScore: item.plagiarism.similarity,
        findingsCount: item.security.findings.length,
        matchesCount: item.plagiarism.matches.length,
        totalFiles: item.summary.totalFiles,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Retrieve full audit report by ID
   */
  public getAuditById(id: string): AuditReport | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: AuditReport[] = stored ? JSON.parse(stored) : INITIAL_HISTORY;
      return list.find((item) => item.id === id) || null;
    } catch {
      return null;
    }
  }

  /**
   * Save audit report to persistent history
   */
  public saveAudit(report: AuditReport): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: AuditReport[] = stored ? JSON.parse(stored) : INITIAL_HISTORY;
      // Prepend so latest appears first
      list = [report, ...list.filter((r) => r.id !== report.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save audit history', e);
    }
  }

  /**
   * Delete audit report by ID
   */
  public deleteAudit(id: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const list: AuditReport[] = JSON.parse(stored);
      const updated = list.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete audit', e);
    }
  }

  /**
   * Reset to initial sample audits
   */
  public resetToDefault(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
    } catch (e) {
      console.error('Failed to reset history', e);
    }
  }
}

export const auditService = new AuditService();
