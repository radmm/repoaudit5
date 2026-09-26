export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SecurityFinding {
  id: string;
  patternId: string;
  file: string;
  line: number;
  issue: string;
  severity: SeverityLevel;
  category: 'hardcoded_secret' | 'sql_injection' | 'weak_hash' | 'input_validation' | 'insecure_dependency' | 'code_execution';
  snippet?: string;
  remediation: string;
  explanation?: string;
  suggestedDiff?: string;
}

export interface PlagiarismMatch {
  id: string;
  file: string;
  matchedWith: string;
  confidence: number; // 0.00 to 1.00
  matchedLinesRange: string;
  tokenOverlapCount: number;
  snippet?: string;
  matchedSnippet?: string;
}

export interface ScannedFile {
  path: string;
  size: number;
  extension: string;
  isBinary: boolean;
  content?: string;
  linesCount: number;
}

export interface AuditReport {
  id: string;
  repoUrl: string;
  compareRepoUrl?: string;
  commitSha: string;
  isCached?: boolean;
  timestamp: string;
  summary: {
    totalFiles: number;
    textFilesScanned: number;
    binaryFilesSkipped: number;
    scanDurationMs: number;
    linesOfCode: number;
    languages: { [lang: string]: number };
  };
  security: {
    grade: SecurityGrade;
    score: number; // 0 - 100
    findings: SecurityFinding[];
    breakdown: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  plagiarism: {
    similarity: number; // 0 - 100
    mode: 'pairwise' | 'corpus';
    matches: PlagiarismMatch[];
    fingerprintCount: number;
    algorithm: string;
    details: {
      matchedKgrams: number;
      totalKgrams: number;
      windowSize: number;
      kgramSize: number;
    };
  };
  oopMetadata?: {
    classesUsed: string[];
    concurrencyPattern: string;
    multithreadingTimeMs: number;
    persistenceType: string;
    sdgGoals: string[];
  };
}

export interface AuditHistoryItem {
  id: string;
  repoUrl: string;
  compareRepoUrl?: string;
  commitSha: string;
  timestamp: string;
  securityGrade: SecurityGrade;
  securityScore: number;
  plagiarismScore: number;
  plagiarismMode: 'pairwise' | 'corpus';
  findingsCount: number;
  matchesCount: number;
  totalFiles: number;
}

export type JobStatus = 'queued' | 'cloning' | 'scanning' | 'aggregating' | 'done' | 'failed';

export interface AuditJob {
  id: string;
  repoUrl: string;
  compareRepoUrl?: string;
  status: JobStatus;
  progressMessage: string;
  progressPercent: number;
  failureReason?: string;
  result?: AuditReport;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  githubAppInstalled: boolean;
  auditsCount: number;
  quotaLimit: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface OrgMember {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatarUrl: string;
}

export interface Organization {
  id: string;
  name: string;
  members: OrgMember[];
}

export interface TestCorpusItem {
  id: string;
  name: string;
  category: 'security_true_positive' | 'plagiarism_copy' | 'clean_control';
  repoUrl: string;
  expectedOutcome: string;
  actualOutcome: string;
  status: 'passed' | 'failed';
  precision: number;
  recall: number;
}
