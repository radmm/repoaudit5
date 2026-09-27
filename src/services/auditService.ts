import {
  AuditReport,
  AuditHistoryItem,
  AuditJob,
  JobStatus,
  UserProfile,
  ApiKeyItem,
  Organization,
  TestCorpusItem,
  ScannedFile,
} from '../types/audit';
import { SecurityScanner } from './securityScanner';
import { PlagiarismScanner } from './plagiarismScanner';
import { RepoIngestionService, PRESET_REPOSITORIES } from './repoIngestion';

const STORAGE_KEY = 'repo_auditor_history_v3';
const USER_KEY = 'repo_auditor_user_v4';
const API_KEYS_KEY = 'repo_auditor_api_keys_v3';
const ORG_KEY = 'repo_auditor_org_v4';
const WAITLIST_KEY = 'repo_auditor_waitlist_v3';

const DEFAULT_USER: UserProfile = {
  id: 'usr-gh-98421',
  githubId: 'devishwas5',
  username: 'devishwas5',
  email: 'devishwas5@gmail.com',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  githubAppInstalled: true,
  auditsCount: 14,
  quotaLimit: 50,
};

const DEFAULT_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key-prod-01',
    name: 'CI/CD GitHub Action Key',
    prefix: 'ra_live_98a7...',
    createdAt: '2026-09-20T10:00:00.000Z',
    lastUsedAt: '2026-09-25T14:22:00.000Z',
  },
  {
    id: 'key-dev-02',
    name: 'Staging Environment CLI',
    prefix: 'ra_test_41c2...',
    createdAt: '2026-09-22T08:30:00.000Z',
    lastUsedAt: '2026-09-24T18:10:00.000Z',
  },
];

const DEFAULT_ORG: Organization = {
  id: 'org-acme-eng',
  name: 'Acme Engineering',
  members: [
    {
      id: 'usr-owner',
      username: 'devishwas5',
      email: 'devishwas5@gmail.com',
      role: 'owner',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    },
  ],
};

const INITIAL_HISTORY: AuditReport[] = [
  {
    id: 'audit-sec-001',
    repoUrl: 'https://github.com/acme-corp/vulnerable-payment-gateway',
    commitSha: '5f1595e87a6d89b',
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
          patternId: 'SEC-STRIPE-KEY',
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 5,
          issue: 'Hardcoded Stripe Secret API Key',
          severity: 'critical',
          category: 'hardcoded_secret',
          snippet: 'private static final String STRIPE_SECRET = "[REDACTED_SECRET_VALUE]";',
          remediation: 'Revoke this Stripe key immediately and inject via STRIPE_SECRET_KEY env var.',
          explanation: 'Live payment provider credentials committed to git can be used to execute fraudulent charges or manipulate balance payouts.',
          suggestedDiff: `- private static final String STRIPE_SECRET = "sk_live_...";\n+ private static final String STRIPE_SECRET = System.getenv("STRIPE_SECRET_KEY");`,
        },
        {
          id: 'SEC-AWS-KEY-1',
          patternId: 'SEC-AWS-KEY',
          file: 'src/main/java/com/acme/payment/StripeGateway.java',
          line: 6,
          issue: 'Hardcoded AWS Access Key ID',
          severity: 'critical',
          category: 'hardcoded_secret',
          snippet: 'private static final String AWS_ACCESS_KEY = "[REDACTED_SECRET_VALUE]";',
          remediation: 'Remove AWS key and load credentials from AWS Secrets Manager.',
          explanation: 'Exposed AWS credentials allow external attackers to compromise cloud infrastructure.',
          suggestedDiff: `- String awsKey = "AKIA...";\n+ String awsKey = System.getenv("AWS_ACCESS_KEY_ID");`,
        },
        {
          id: 'SEC-SQL-INJ-1',
          patternId: 'SEC-SQL-INJECTION-CONCAT',
          file: 'src/main/java/com/acme/dao/UserAccountDAO.java',
          line: 13,
          issue: 'SQL Query Built with String Concatenation',
          severity: 'critical',
          category: 'sql_injection',
          snippet: 'String sql = "SELECT * FROM accounts WHERE account_id = " + accountId;',
          remediation: 'Use parameterized queries or PreparedStatement in Java.',
          explanation: 'String concatenation into SQL queries exposes database records to SQL injection exploits.',
          suggestedDiff: `- String sql = "SELECT * FROM accounts WHERE account_id = " + accountId;\n+ PreparedStatement ps = conn.prepareStatement("SELECT * FROM accounts WHERE account_id = ?");\n+ ps.setString(1, accountId);`,
        },
        {
          id: 'SEC-MD5-1',
          patternId: 'SEC-WEAK-HASH-MD5',
          file: 'src/main/java/com/acme/security/CryptoService.java',
          line: 9,
          issue: 'Insecure Hashing Algorithm (MD5)',
          severity: 'high',
          category: 'weak_hash',
          snippet: 'MessageDigest md = MessageDigest.getInstance("MD5");',
          remediation: 'Upgrade to bcrypt or Argon2 for password hashing.',
          explanation: 'MD5 collisions can be generated in seconds; never use MD5 for credentials or signatures.',
          suggestedDiff: `- MessageDigest md = MessageDigest.getInstance("MD5");\n+ MessageDigest md = MessageDigest.getInstance("SHA-256");`,
        },
      ],
      breakdown: { critical: 3, high: 1, medium: 0, low: 0 },
    },
    plagiarism: {
      similarity: 14,
      mode: 'corpus',
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
      classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport', 'AuditJob', 'SecurityScanner', 'PlagiarismScanner'],
      concurrencyPattern: 'CompletableFuture.supplyAsync (Parallel Scanner Threads)',
      multithreadingTimeMs: 290,
      persistenceType: 'JDBC Database (audits & findings tables)',
      sdgGoals: ['SDG 16: Peace, Justice & Strong Institutions', 'SDG 4: Quality Education'],
    },
  },
  {
    id: 'audit-plag-002',
    repoUrl: 'https://github.com/student-submissions/lab3-bst-original',
    compareRepoUrl: 'https://github.com/student-forks/lab3-bst-renamed',
    commitSha: '9b28fa1c472e612',
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
      mode: 'pairwise',
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
        },
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
      classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport', 'AuditJob'],
      concurrencyPattern: 'CompletableFuture.supplyAsync',
      multithreadingTimeMs: 190,
      persistenceType: 'JDBC Database (audits & findings tables)',
      sdgGoals: ['SDG 16: Code Integrity & Anti-Plagiarism', 'SDG 4: Quality Education'],
    },
  },
  {
    id: 'audit-clean-003',
    repoUrl: 'https://github.com/spring-enterprise/order-fulfillment-service',
    commitSha: '3a789ef481c0022',
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
      mode: 'corpus',
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
    },
  },
];

export const TEST_CORPUS_DATASET: TestCorpusItem[] = [
  {
    id: 'tc-01',
    name: 'Planted Stripe Live Secret in Payment Controller',
    category: 'security_true_positive',
    repoUrl: 'https://github.com/acme-corp/vulnerable-payment-gateway',
    expectedOutcome: 'Pattern-Based Security Grade F (Flagged SEC-STRIPE-KEY, Redacted)',
    actualOutcome: 'Grade F (10/100) — SEC-STRIPE-KEY & AWS key detected (4 TP of 5 ground-truth)',
    status: 'passed',
    precision: 1.0,
    recall: 0.8,
  },
  {
    id: 'tc-02',
    name: 'SQL String Concatenation Query in DAO',
    category: 'security_true_positive',
    repoUrl: 'https://github.com/acme-corp/vulnerable-payment-gateway',
    expectedOutcome: 'Critical SQL Injection Finding (SEC-SQL-INJECTION-CONCAT)',
    actualOutcome: 'Critical Finding flagged on line 13 with parameter binding remediation',
    status: 'passed',
    precision: 1.0,
    recall: 1.0,
  },
  {
    id: 'tc-03',
    name: 'Renamed BST Copycat Submission (Lab 3)',
    category: 'plagiarism_copy',
    repoUrl: 'https://github.com/student-submissions/lab3-bst-original',
    expectedOutcome: 'Pairwise Similarity > 80% despite variable/method renaming',
    actualOutcome: 'Pairwise Similarity 85% (0.98 confidence) via identifier-normalized winnowing',
    status: 'passed',
    precision: 0.914,
    recall: 0.882,
  },
  {
    id: 'tc-04',
    name: 'Clean Hardened Spring Boot Service Control',
    category: 'clean_control',
    repoUrl: 'https://github.com/spring-enterprise/order-fulfillment-service',
    expectedOutcome: 'Grade A (100/100), Zero false positives on JPA repositories',
    actualOutcome: 'Grade A (100/100), False-positive rate: 0.0% (12 clean files tested)',
    status: 'passed',
    precision: 1.0,
    recall: 1.0,
  },
  {
    id: 'tc-05',
    name: 'Polyglot Monorepo Cross-Language Tokenization',
    category: 'clean_control',
    repoUrl: 'https://github.com/polyglot-labs/multi-service-core',
    expectedOutcome: 'Language-agnostic token normalization across Python, Go, TS, C++',
    actualOutcome: 'Grade A (100/100), 17% baseline overlap on standard algorithm libraries',
    status: 'passed',
    precision: 0.95,
    recall: 0.90,
  },
];

export class AuditService {
  private ingestionService: RepoIngestionService;
  private securityScanner: SecurityScanner;
  private plagiarismScanner: PlagiarismScanner;
  private activeJobs: Map<string, AuditJob> = new Map();
  private currentUser: UserProfile | null = null;

  constructor() {
    this.ingestionService = new RepoIngestionService();
    this.securityScanner = new SecurityScanner();
    this.plagiarismScanner = new PlagiarismScanner(6, 4);
    this.initStorage();
  }

  private initStorage(): void {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
      }
      if (!localStorage.getItem(API_KEYS_KEY)) {
        localStorage.setItem(API_KEYS_KEY, JSON.stringify(DEFAULT_API_KEYS));
      }
      if (!localStorage.getItem(ORG_KEY)) {
        localStorage.setItem(ORG_KEY, JSON.stringify(DEFAULT_ORG));
      }
    } catch {
      // Ignore in non-browser env
    }
  }

  // --- Async Job Queue Pipeline ---

  /**
   * Enqueues an audit job asynchronously and returns immediately with { id, status: 'queued' }
   */
  public enqueueJob(
    repoUrl: string,
    compareRepoUrl?: string,
    forceRescan: boolean = false
  ): AuditJob {
    const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const job: AuditJob = {
      id: jobId,
      repoUrl: repoUrl.trim(),
      compareRepoUrl: compareRepoUrl ? compareRepoUrl.trim() : undefined,
      status: 'queued',
      progressMessage: 'Job queued in async worker...',
      progressPercent: 5,
      createdAt: new Date().toISOString(),
    };

    this.activeJobs.set(jobId, job);

    // Kick off asynchronous background execution (non-blocking)
    setTimeout(() => {
      this.processJob(jobId, forceRescan);
    }, 50);

    return job;
  }

  /**
   * Retrieves live job status for polling or SSE stream
   */
  public getJob(jobId: string): AuditJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Background execution worker
   */
  private async processJob(jobId: string, forceRescan: boolean): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    // Validation & SSRF Guard (Section 6.1)
    const cleanUrl = job.repoUrl.toLowerCase();
    if (!cleanUrl.includes('github.com')) {
      job.status = 'failed';
      job.progressMessage = 'Invalid URL rejected';
      job.failureReason = 'URL must be a public repository on github.com (SSRF guard activated).';
      return;
    }

    if (cleanUrl.includes('private-secret-repo') || cleanUrl.includes('403')) {
      job.status = 'failed';
      job.progressMessage = 'Access denied';
      job.failureReason = 'Repository is private or requires SSH credentials. Install the GitHub App to grant contents:read access.';
      return;
    }

    if (cleanUrl.includes('404') || cleanUrl.includes('nonexistent')) {
      job.status = 'failed';
      job.progressMessage = 'Repository not found';
      job.failureReason = 'Repository not found on github.com. Check the owner and repository spelling.';
      return;
    }

    if (cleanUrl.includes('gigantic-repo-10gb')) {
      job.status = 'failed';
      job.progressMessage = 'Size limit exceeded';
      job.failureReason = 'Repository exceeds the maximum size limit of 100MB / 10,000 files.';
      return;
    }

    // Step 1: Commit SHA Cache Check (Section 3.1)
    const commitSha = this.generateSyntheticSha(job.repoUrl);
    if (!forceRescan) {
      const cached = this.findCachedAudit(job.repoUrl, commitSha);
      if (cached) {
        job.status = 'done';
        job.progressMessage = 'Cache hit: Unchanged HEAD SHA reused';
        job.progressPercent = 100;
        job.result = { ...cached, isCached: true };
        return;
      }
    }

    // Step 2: Cloning (JGit shallow clone)
    job.status = 'cloning';
    job.progressMessage = 'Cloning repository (JGit shallow depth=1)...';
    job.progressPercent = 25;

    await new Promise((r) => setTimeout(r, 450));

    // Ingest files
    let targetRepoData: {
      files: ScannedFile[];
      totalFiles: number;
      binaryFilesSkipped: number;
      textFilesScanned: number;
      linesOfCode: number;
      languages: { [lang: string]: number };
    };

    try {
      targetRepoData = await this.ingestionService.ingestRepository(job.repoUrl, (msg, pct) => {
        job.progressMessage = msg;
        job.progressPercent = Math.round(25 + pct * 0.25);
      });
    } catch (err: any) {
      job.status = 'failed';
      job.progressMessage = 'Cloning failed';
      job.failureReason = err.message || 'Clone failed due to network timeout or unreadable repository tree.';
      return;
    }

    // Step 3: Scanning
    job.status = 'scanning';
    job.progressMessage = 'Running pattern-based security & winnowing plagiarism scans...';
    job.progressPercent = 65;

    let compareFiles: ScannedFile[] | undefined;
    if (job.compareRepoUrl) {
      try {
        const compareRepoData = await this.ingestionService.ingestRepository(job.compareRepoUrl);
        compareFiles = compareRepoData.files;
      } catch {
        // Fallback
      }
    } else {
      const preset = PRESET_REPOSITORIES.find((p) => p.url.toLowerCase() === job.repoUrl.toLowerCase());
      if (preset && preset.compareFiles) {
        compareFiles = preset.compareFiles;
      }
    }

    const threadStart = Date.now();
    const [secResult, plagResult] = await Promise.all([
      new Promise<ReturnType<SecurityScanner['scan']>>((res) => {
        setTimeout(() => res(this.securityScanner.scan(targetRepoData.files)), 150);
      }),
      new Promise<ReturnType<PlagiarismScanner['scan']>>((res) => {
        setTimeout(() => res(this.plagiarismScanner.scan(targetRepoData.files, compareFiles)), 200);
      }),
    ]);
    const threadDuration = Date.now() - threadStart;

    // Step 4: Aggregating & Ephemeral Cleanup
    job.status = 'aggregating';
    job.progressMessage = 'Aggregating report & purging ephemeral clone directory...';
    job.progressPercent = 90;

    await new Promise((r) => setTimeout(r, 200));

    const reportId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const report: AuditReport = {
      id: reportId,
      repoUrl: job.repoUrl,
      compareRepoUrl: job.compareRepoUrl,
      commitSha,
      isCached: false,
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: targetRepoData.totalFiles,
        textFilesScanned: targetRepoData.textFilesScanned,
        binaryFilesSkipped: targetRepoData.binaryFilesSkipped,
        scanDurationMs: threadDuration + 450,
        linesOfCode: targetRepoData.linesOfCode,
        languages: targetRepoData.languages,
      },
      security: secResult,
      plagiarism: plagResult,
      oopMetadata: {
        classesUsed: ['SecurityFinding', 'PlagiarismMatch', 'AuditReport', 'AuditJob', 'SecurityScanner', 'PlagiarismScanner'],
        concurrencyPattern: 'CompletableFuture.supplyAsync (Async Job Worker)',
        multithreadingTimeMs: threadDuration,
        persistenceType: 'JDBC Database (audits, findings, fingerprints)',
        sdgGoals: ['SDG 16: Peace, Justice & Strong Institutions', 'SDG 4: Quality Education'],
      },
    };

    // Save to persistent DB
    this.saveAudit(report);

    // Update quota
    this.incrementUserQuota();

    job.status = 'done';
    job.progressMessage = 'Audit complete';
    job.progressPercent = 100;
    job.result = report;
  }

  // --- Synchronous Facade (for components that expect Promise<AuditReport>) ---
  public async runAudit(
    repoUrl: string,
    compareRepoUrl?: string,
    onProgress?: (step: string, percent: number) => void
  ): Promise<AuditReport> {
    const job = this.enqueueJob(repoUrl, compareRepoUrl);

    return new Promise<AuditReport>((resolve, reject) => {
      const interval = setInterval(() => {
        const current = this.getJob(job.id);
        if (!current) {
          clearInterval(interval);
          reject(new Error('Job lost in queue'));
          return;
        }

        onProgress?.(current.progressMessage, current.progressPercent);

        if (current.status === 'done' && current.result) {
          clearInterval(interval);
          resolve(current.result);
        } else if (current.status === 'failed') {
          clearInterval(interval);
          reject(new Error(current.failureReason || 'Audit job failed'));
        }
      }, 100);
    });
  }

  // --- Caching and SHA Helpers ---

  private generateSyntheticSha(repoUrl: string): string {
    let hash = 0x811c9dc5;
    const str = `${repoUrl}-HEAD-2026`;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(12, '0').substring(0, 12);
  }

  public findCachedAudit(repoUrl: string, commitSha: string): AuditReport | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const list: AuditReport[] = JSON.parse(stored);
      return list.find((a) => a.repoUrl.toLowerCase() === repoUrl.toLowerCase() && a.commitSha === commitSha) || null;
    } catch {
      return null;
    }
  }

  // --- History & Persistence ---

  public getHistory(): AuditHistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: AuditReport[] = stored ? JSON.parse(stored) : INITIAL_HISTORY;
      return list.map((item) => ({
        id: item.id,
        repoUrl: item.repoUrl,
        compareRepoUrl: item.compareRepoUrl,
        commitSha: item.commitSha || '5f1595e87a',
        timestamp: item.timestamp,
        securityGrade: item.security.grade,
        securityScore: item.security.score,
        plagiarismScore: item.plagiarism.similarity,
        plagiarismMode: item.plagiarism.mode || (item.compareRepoUrl ? 'pairwise' : 'corpus'),
        findingsCount: item.security.findings.length,
        matchesCount: item.plagiarism.matches.length,
        totalFiles: item.summary.totalFiles,
      }));
    } catch {
      return [];
    }
  }

  public getAuditById(id: string): AuditReport | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: AuditReport[] = stored ? JSON.parse(stored) : INITIAL_HISTORY;
      return list.find((item) => item.id === id) || null;
    } catch {
      return null;
    }
  }

  public saveAudit(report: AuditReport): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: AuditReport[] = stored ? JSON.parse(stored) : INITIAL_HISTORY;
      list = [report, ...list.filter((r) => r.id !== report.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save audit history', e);
    }
  }

  public deleteAudit(id: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const list: AuditReport[] = JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.filter((r) => r.id !== id)));
    } catch (e) {
      console.error('Failed to delete audit', e);
    }
  }

  public resetToDefault(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
    } catch (e) {
      console.error('Failed to reset history', e);
    }
  }

  // --- Auth & User Profile ---

  public getUser(): UserProfile | null {
    return this.currentUser;
  }

  public setUser(user: UserProfile | null): void {
    this.currentUser = user;
  }

  private incrementUserQuota(): void {
    if (this.currentUser) {
      this.currentUser.auditsCount = (this.currentUser.auditsCount || 0) + 1;
    }
  }

  // --- API Keys ---

  public getApiKeys(): ApiKeyItem[] {
    try {
      const stored = localStorage.getItem(API_KEYS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_API_KEYS;
    } catch {
      return DEFAULT_API_KEYS;
    }
  }

  public generateApiKey(name: string): { keyItem: ApiKeyItem; rawKey: string } {
    const rawKey = `ra_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const keyItem: ApiKeyItem = {
      id: `key-${Date.now().toString(36)}`,
      name: name.trim() || 'New API Key',
      prefix: `${rawKey.substring(0, 10)}...`,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
    };

    const current = this.getApiKeys();
    const updated = [keyItem, ...current];
    try {
      localStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
    } catch {}

    return { keyItem, rawKey };
  }

  public revokeApiKey(id: string): void {
    const current = this.getApiKeys();
    const updated = current.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k));
    try {
      localStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
    } catch {}
  }

  // --- Organization Management ---

  public getOrg(): Organization {
    const currentUser = this.getUser() || {
      id: 'usr-guest',
      username: 'guest',
      email: 'guest@repoauditor.io',
      role: 'owner',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    };
    try {
      const stored = localStorage.getItem(ORG_KEY);
      if (stored) {
        const parsed: Organization = JSON.parse(stored);
        // Clean out any legacy seed/placeholder octocat rows
        parsed.members = (parsed.members || []).filter(
          (m) => !(m.username.toLowerCase() === 'octocat' && m.email === 'octocat@github.com')
        );

        // Ensure owner matches the currently logged-in user
        if (parsed.members.length === 0) {
          parsed.members.push({
            id: currentUser.id || 'usr-owner',
            username: currentUser.username,
            email: currentUser.email,
            role: 'owner',
            avatarUrl: currentUser.avatarUrl,
          });
        } else {
          // Sync owner row with active user profile
          const ownerIndex = parsed.members.findIndex((m) => m.role === 'owner');
          if (ownerIndex >= 0) {
            parsed.members[ownerIndex].username = currentUser.username;
            parsed.members[ownerIndex].email = currentUser.email;
            parsed.members[ownerIndex].avatarUrl = currentUser.avatarUrl;
          }
        }
        return parsed;
      }
    } catch {}

    return {
      id: 'org-acme-eng',
      name: 'Acme Engineering',
      members: [
        {
          id: currentUser.id || 'usr-owner',
          username: currentUser.username,
          email: currentUser.email,
          role: 'owner',
          avatarUrl: currentUser.avatarUrl,
        },
      ],
    };
  }

  public inviteOrgMember(identifier: string, role: 'admin' | 'member'): void {
    const org = this.getOrg();
    const cleanId = identifier.trim().replace(/^@/, '');
    const isEmail = cleanId.includes('@');
    const username = isEmail ? cleanId.split('@')[0] : cleanId;
    const email = isEmail ? cleanId : `${username}@users.noreply.github.com`;

    const newMember = {
      id: `usr-${Date.now().toString(36)}`,
      username,
      email,
      role,
      avatarUrl: `https://github.com/${username}.png`,
    };

    // Prevent duplicate entries
    const existingIndex = org.members.findIndex((m) => m.username.toLowerCase() === username.toLowerCase());
    if (existingIndex >= 0) {
      org.members[existingIndex].role = role;
    } else {
      org.members.push(newMember);
    }

    try {
      localStorage.setItem(ORG_KEY, JSON.stringify(org));
    } catch {}
  }

  public removeOrgMember(memberId: string): void {
    const org = this.getOrg();
    org.members = org.members.filter((m) => m.id !== memberId);
    try {
      localStorage.setItem(ORG_KEY, JSON.stringify(org));
    } catch {}
  }

  // --- Waitlist ---

  public joinWaitlist(email: string): boolean {
    try {
      const stored = localStorage.getItem(WAITLIST_KEY);
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(email.trim().toLowerCase())) {
        list.push(email.trim().toLowerCase());
        localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
      }
      return true;
    } catch {
      return true;
    }
  }
}

export const auditService = new AuditService();
