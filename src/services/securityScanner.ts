import { SecurityFinding, SecurityGrade, ScannedFile } from '../types/audit';

interface SecurityRule {
  id: string;
  category: SecurityFinding['category'];
  name: string;
  severity: SecurityFinding['severity'];
  regex: RegExp;
  remediation: string;
  fileFilter?: (path: string) => boolean;
}

const SECURITY_RULES: SecurityRule[] = [
  // 1. Hardcoded Secrets
  {
    id: 'SEC-AWS-KEY',
    category: 'hardcoded_secret',
    name: 'Hardcoded AWS Access Key ID',
    severity: 'critical',
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/,
    remediation: 'Remove AWS key and load credentials from AWS Secrets Manager or environment variables.',
  },
  {
    id: 'SEC-STRIPE-KEY',
    category: 'hardcoded_secret',
    name: 'Hardcoded Stripe Secret API Key',
    severity: 'critical',
    regex: /sk_live_[0-9a-zA-Z]{24,34}/,
    remediation: 'Revoke this Stripe key immediately and inject via secure vault or STRIPE_SECRET_KEY env var.',
  },
  {
    id: 'SEC-GITHUB-TOKEN',
    category: 'hardcoded_secret',
    name: 'Hardcoded GitHub Personal Access Token',
    severity: 'critical',
    regex: /ghp_[0-9a-zA-Z]{36}/,
    remediation: 'Revoke the personal access token on GitHub and configure GitHub Actions secrets.',
  },
  {
    id: 'SEC-GOOGLE-API-KEY',
    category: 'hardcoded_secret',
    name: 'Hardcoded Google Cloud / Maps API Key',
    severity: 'high',
    regex: /AIza[0-9A-Za-z-_]{35}/,
    remediation: 'Restrict key by HTTP referrer and IP, or move calls to a backend proxy route.',
  },
  {
    id: 'SEC-GENERIC-PASSWORD',
    category: 'hardcoded_secret',
    name: 'Plaintext Password or Secret in Source Code',
    severity: 'high',
    regex: /(?:password|passwd|pwd|db_pass|secret_key|api_secret)\s*[:=]\s*["'][^"']{6,40}["']/i,
    remediation: 'Store passwords in a secure configuration service or encrypted credentials file.',
  },
  {
    id: 'SEC-PRIVATE-KEY',
    category: 'hardcoded_secret',
    name: 'Exposed RSA / SSH Private Key',
    severity: 'critical',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    remediation: 'Rotate this private key and do not check .pem / id_rsa files into git.',
  },

  // 2. SQL Injection
  {
    id: 'SEC-SQL-INJECTION-CONCAT',
    category: 'sql_injection',
    name: 'SQL Query Built with String Concatenation',
    severity: 'critical',
    regex: /(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+.*?\+\s*[a-zA-Z0-9_$.]+/i,
    remediation: 'Use parameterized queries, PreparedStatement in Java, or ORM parameter binding.',
  },
  {
    id: 'SEC-SQL-TEMPLATE-INJECTION',
    category: 'sql_injection',
    name: 'Dynamic SQL String Interpolation',
    severity: 'high',
    regex: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\$\{.*?\}/i,
    remediation: 'Avoid raw string interpolation in database statements; use bound parameters.',
  },

  // 3. Weak Hashing
  {
    id: 'SEC-WEAK-HASH-MD5',
    category: 'weak_hash',
    name: 'Insecure Hashing Algorithm (MD5)',
    severity: 'high',
    regex: /(?:MessageDigest\.getInstance\(["']MD5["']\)|hashlib\.md5\(|crypto\.createHash\(["']md5["']\)|DigestUtils\.md5Hex)/i,
    remediation: 'MD5 is vulnerable to collision attacks. Upgrade to SHA-256 or bcrypt/Argon2 for passwords.',
  },
  {
    id: 'SEC-WEAK-HASH-SHA1',
    category: 'weak_hash',
    name: 'Insecure Hashing Algorithm (SHA-1)',
    severity: 'medium',
    regex: /(?:MessageDigest\.getInstance\(["']SHA-?1["']\)|hashlib\.sha1\(|crypto\.createHash\(["']sha1["']\))/i,
    remediation: 'SHA-1 is deprecated for cryptographic signatures. Use SHA-256, SHA-512, or PBKDF2.',
  },

  // 4. Missing Input Validation & Arbitrary Code Execution
  {
    id: 'SEC-CODE-EXEC',
    category: 'code_execution',
    name: 'Unsafe Dynamic Code Execution (eval / exec)',
    severity: 'critical',
    regex: /(?:\beval\s*\(|\bexec\s*\(|Runtime\.getRuntime\(\)\.exec\(|child_process\.exec\()/i,
    remediation: 'Avoid evaluating untrusted input as code. Use dedicated parsers or strictly whitelisted arguments.',
  },
  {
    id: 'SEC-INPUT-VALIDATION',
    category: 'input_validation',
    name: 'Missing Input Sanitization on System Command / Process',
    severity: 'medium',
    regex: /ProcessBuilder\s*\([^)]*request\.getParameter/i,
    remediation: 'Validate input against an allowlist before passing parameters into subprocesses.',
  },

  // 5. Insecure Dependency (Log4Shell / vulnerable npm packages)
  {
    id: 'SEC-DEP-LOG4J',
    category: 'insecure_dependency',
    name: 'Vulnerable Log4j 2.x Dependency (CVE-2021-44228 Log4Shell)',
    severity: 'critical',
    regex: /log4j-core['":\s]+(?:2\.(?:0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17\.0))/,
    fileFilter: (path) => path.endsWith('pom.xml') || path.endsWith('build.gradle'),
    remediation: 'Upgrade org.apache.logging.log4j:log4j-core to version 2.17.1 or newer.',
  },
  {
    id: 'SEC-DEP-LODASH-PROT',
    category: 'insecure_dependency',
    name: 'Vulnerable Lodash Prototype Pollution (CVE-2021-23337)',
    severity: 'medium',
    regex: /"lodash"\s*:\s*["'](?:\^|~)?4\.(?:[0-9]|1[0-6])\./,
    fileFilter: (path) => path.endsWith('package.json'),
    remediation: 'Upgrade lodash to 4.17.21 or later.',
  }
];

export class SecurityScanner {
  public scan(files: ScannedFile[]): {
    grade: SecurityGrade;
    score: number;
    findings: SecurityFinding[];
    breakdown: { critical: number; high: number; medium: number; low: number };
  } {
    const findings: SecurityFinding[] = [];

    for (const file of files) {
      if (file.isBinary || !file.content) continue;

      const lines = file.content.split('\n');

      for (const rule of SECURITY_RULES) {
        if (rule.fileFilter && !rule.fileFilter(file.path)) {
          continue;
        }

        // Check line by line to get accurate line numbers
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];
          if (rule.regex.test(lineText)) {
            // Extract snippet: 1 line before, finding line, 1 line after
            const startLine = Math.max(0, i - 1);
            const endLine = Math.min(lines.length - 1, i + 1);
            const snippet = lines.slice(startLine, endLine + 1).join('\n');

            findings.push({
              id: `${rule.id}-${file.path}-${i + 1}`,
              file: file.path,
              line: i + 1,
              issue: rule.name,
              severity: rule.severity,
              category: rule.category,
              snippet: snippet.trim(),
              remediation: rule.remediation,
            });
          }
        }
      }
    }

    // Calculate score
    const breakdown = {
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
    };

    // Severity penalties
    const penalty =
      breakdown.critical * 25 +
      breakdown.high * 15 +
      breakdown.medium * 7 +
      breakdown.low * 3;

    const score = Math.max(0, Math.min(100, 100 - penalty));

    let grade: SecurityGrade = 'A';
    if (score < 60) grade = 'F';
    else if (score < 70) grade = 'D';
    else if (score < 80) grade = 'C';
    else if (score < 90) grade = 'B';
    else grade = 'A';

    return {
      grade,
      score,
      findings,
      breakdown,
    };
  }
}
