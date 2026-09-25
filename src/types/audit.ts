export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SecurityFinding {
  id: string;
  file: string;
  line: number;
  issue: string;
  severity: SeverityLevel;
  category: 'hardcoded_secret' | 'sql_injection' | 'weak_hash' | 'input_validation' | 'insecure_dependency' | 'code_execution';
  snippet?: string;
  remediation: string;
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
  timestamp: string;
  securityGrade: SecurityGrade;
  securityScore: number;
  plagiarismScore: number;
  findingsCount: number;
  matchesCount: number;
  totalFiles: number;
}
