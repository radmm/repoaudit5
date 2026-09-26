import { SecurityFinding, SecurityGrade, ScannedFile } from '../types/audit';

interface SecurityRule {
  id: string;
  category: SecurityFinding['category'];
  name: string;
  severity: SecurityFinding['severity'];
  regex: RegExp;
  remediation: string;
  explanation: string;
  suggestedDiff: string;
  fileFilter?: (path: string) => boolean;
}

const SECURITY_RULES: SecurityRule[] = [
  // 1. Hardcoded Secrets (Redacted on detection)
  {
    id: 'SEC-AWS-KEY',
    category: 'hardcoded_secret',
    name: 'Hardcoded AWS Access Key ID',
    severity: 'critical',
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/,
    remediation: 'Remove AWS key and inject credentials via AWS Secrets Manager or environment variables.',
    explanation: 'AWS credentials stored in source code can be extracted by anyone with repository read access, risking cloud resource compromise and unauthorized infrastructure modifications.',
    suggestedDiff: `- String awsKey = "AKIAIOSFODNN7EXAMPLE";\n+ String awsKey = System.getenv("AWS_ACCESS_KEY_ID");`,
  },
  {
    id: 'SEC-STRIPE-KEY',
    category: 'hardcoded_secret',
    name: 'Hardcoded Stripe Secret API Key',
    severity: 'critical',
    regex: /sk_live_[0-9a-zA-Z]{24,34}/,
    remediation: 'Revoke this Stripe key immediately and inject via STRIPE_SECRET_KEY env var.',
    explanation: 'A live Stripe API secret key provides full access to merchant billing charges, customer records, and payout balance manipulation.',
    suggestedDiff: `- String stripeSecret = "sk_live_981240182309182309182309";\n+ String stripeSecret = System.getenv("STRIPE_SECRET_KEY");`,
  },
  {
    id: 'SEC-GITHUB-TOKEN',
    category: 'hardcoded_secret',
    name: 'Hardcoded GitHub Personal Access Token',
    severity: 'critical',
    regex: /ghp_[0-9a-zA-Z]{36}/,
    remediation: 'Revoke the token on GitHub and configure GitHub Actions repository secrets.',
    explanation: 'Committed GitHub tokens allow attackers to read private repositories, push unauthorized commits, or bypass branch protections.',
    suggestedDiff: `- const token = "ghp_1234567890abcdef1234567890abcdef1234";\n+ const token = process.env.GITHUB_TOKEN;`,
  },
  {
    id: 'SEC-GOOGLE-API-KEY',
    category: 'hardcoded_secret',
    name: 'Hardcoded Google Cloud / Maps API Key',
    severity: 'high',
    regex: /AIza[0-9A-Za-z-_]{35}/,
    remediation: 'Restrict key by HTTP referrer and IP address, or move calls to a backend proxy route.',
    explanation: 'Unrestricted Google Cloud API keys can be abused to consume project quota and incur unexpected billing charges.',
    suggestedDiff: `- const apiKey = "AIzaSyD-1234567890abcdefghijklmnopqrst";\n+ const apiKey = process.env.GOOGLE_API_KEY;`,
  },
  {
    id: 'SEC-GENERIC-PASSWORD',
    category: 'hardcoded_secret',
    name: 'Plaintext Password or Secret in Source Code',
    severity: 'high',
    regex: /(?:password|passwd|pwd|db_pass|secret_key|api_secret)\s*[:=]\s*["'][^"']{6,40}["']/i,
    remediation: 'Store passwords in a secure configuration service or encrypted credentials file.',
    explanation: 'Plaintext passwords embedded in code repositories violate credential hygiene and are visible across all commits in version history.',
    suggestedDiff: `- String dbPass = "mypassword123";\n+ String dbPass = System.getenv("DB_PASSWORD");`,
  },
  {
    id: 'SEC-PRIVATE-KEY',
    category: 'hardcoded_secret',
    name: 'Exposed RSA / SSH Private Key',
    severity: 'critical',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    remediation: 'Rotate this private key and do not check .pem / id_rsa files into git.',
    explanation: 'Exposed private keys compromise cryptographic identity, allowing attackers to impersonate servers or decrypt secure communications.',
    suggestedDiff: `- [RAW PRIVATE KEY BLOCK]\n+ // Load private key from secure vault or filesystem mount`,
  },

  // 2. SQL Injection
  {
    id: 'SEC-SQL-INJECTION-CONCAT',
    category: 'sql_injection',
    name: 'SQL Query Built with String Concatenation',
    severity: 'critical',
    regex: /(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+.*?\+\s*[a-zA-Z0-9_$.]+/i,
    remediation: 'Use parameterized queries, PreparedStatement in Java, or ORM parameter binding.',
    explanation: 'Directly concatenating untrusted user input into SQL commands allows SQL injection attacks, leading to data exfiltration or table destruction.',
    suggestedDiff: `- String sql = "SELECT * FROM users WHERE id = " + userId;\n+ String sql = "SELECT * FROM users WHERE id = ?";\n+ PreparedStatement ps = conn.prepareStatement(sql);\n+ ps.setString(1, userId);`,
  },
  {
    id: 'SEC-SQL-TEMPLATE-INJECTION',
    category: 'sql_injection',
    name: 'Dynamic SQL String Interpolation',
    severity: 'high',
    regex: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\$\{.*?\}/i,
    remediation: 'Avoid raw string interpolation in database statements; use bound parameters.',
    explanation: 'String template interpolation bypasses driver-level escaping, allowing query structure manipulation.',
    suggestedDiff: `- const q = \`SELECT * FROM accounts WHERE id = \${accId}\`;\n+ const q = 'SELECT * FROM accounts WHERE id = $1';\n+ db.query(q, [accId]);`,
  },

  // 3. Weak Hashing
  {
    id: 'SEC-WEAK-HASH-MD5',
    category: 'weak_hash',
    name: 'Insecure Hashing Algorithm (MD5)',
    severity: 'high',
    regex: /(?:MessageDigest\.getInstance\(["']MD5["']\)|hashlib\.md5\(|crypto\.createHash\(["']md5["']\)|DigestUtils\.md5Hex)/i,
    remediation: 'MD5 is vulnerable to collision attacks. Upgrade to SHA-256 or bcrypt/Argon2 for passwords.',
    explanation: 'MD5 hash collisions can be generated in seconds, rendering MD5 completely unsuitable for password hashing or cryptographic signatures.',
    suggestedDiff: `- MessageDigest md = MessageDigest.getInstance("MD5");\n+ // Use BCrypt for passwords or SHA-256 for checksums\n+ MessageDigest md = MessageDigest.getInstance("SHA-256");`,
  },
  {
    id: 'SEC-WEAK-HASH-SHA1',
    category: 'weak_hash',
    name: 'Insecure Hashing Algorithm (SHA-1)',
    severity: 'medium',
    regex: /(?:MessageDigest\.getInstance\(["']SHA-?1["']\)|hashlib\.sha1\(|crypto\.createHash\(["']sha1["']\))/i,
    remediation: 'SHA-1 is deprecated for cryptographic signatures. Use SHA-256, SHA-512, or PBKDF2.',
    explanation: 'Practical chosen-prefix collision attacks exist against SHA-1, making it unsafe for integrity checks or signatures.',
    suggestedDiff: `- MessageDigest md = MessageDigest.getInstance("SHA-1");\n+ MessageDigest md = MessageDigest.getInstance("SHA-256");`,
  },

  // 4. Missing Input Validation & Arbitrary Code Execution
  {
    id: 'SEC-CODE-EXEC',
    category: 'code_execution',
    name: 'Unsafe Dynamic Code Execution (eval / exec)',
    severity: 'critical',
    regex: /(?:\beval\s*\(|\bexec\s*\(|Runtime\.getRuntime\(\)\.exec\(|child_process\.exec\()/i,
    remediation: 'Avoid evaluating untrusted input as code. Use dedicated parsers or strictly whitelisted arguments.',
    explanation: 'Evaluating dynamic code from user input leads to Remote Code Execution (RCE) on the host server.',
    suggestedDiff: `- eval(userInputFormula);\n+ // Use safe math expression parser without eval`,
  },
  {
    id: 'SEC-INPUT-VALIDATION',
    category: 'input_validation',
    name: 'Missing Input Sanitization on System Command / Process',
    severity: 'medium',
    regex: /ProcessBuilder\s*\([^)]*request\.getParameter/i,
    remediation: 'Validate input against an allowlist before passing parameters into subprocesses.',
    explanation: 'Passing unsanitized request parameters to system processes enables command injection via shell metacharacters.',
    suggestedDiff: `- new ProcessBuilder("run.sh", request.getParameter("cmd")).start();\n+ String validatedCmd = validateAllowlist(request.getParameter("cmd"));\n+ new ProcessBuilder("run.sh", validatedCmd).start();`,
  },

  // 5. Insecure Dependency (Log4Shell / vulnerable packages)
  {
    id: 'SEC-DEP-LOG4J',
    category: 'insecure_dependency',
    name: 'Vulnerable Log4j 2.x Dependency (CVE-2021-44228 Log4Shell)',
    severity: 'critical',
    regex: /log4j-core['":\s]+(?:2\.(?:0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17\.0))/,
    fileFilter: (path) => path.endsWith('pom.xml') || path.endsWith('build.gradle'),
    remediation: 'Upgrade org.apache.logging.log4j:log4j-core to version 2.17.1 or newer.',
    explanation: 'CVE-2021-44228 allows remote unauthenticated attackers to execute arbitrary code via JNDI lookup expressions in logged strings.',
    suggestedDiff: `- <version>2.14.1</version>\n+ <version>2.17.1</version>`,
  },
  {
    id: 'SEC-DEP-LODASH-PROT',
    category: 'insecure_dependency',
    name: 'Vulnerable Lodash Prototype Pollution (CVE-2021-23337)',
    severity: 'medium',
    regex: /"lodash"\s*:\s*["'](?:\^|~)?4\.(?:[0-9]|1[0-6])\./,
    fileFilter: (path) => path.endsWith('package.json'),
    remediation: 'Upgrade lodash to 4.17.21 or later.',
    explanation: 'Prototype pollution in lodash allows modifying Object.prototype, potentially leading to denial of service or code execution.',
    suggestedDiff: `- "lodash": "^4.17.15"\n+ "lodash": "^4.17.21"`,
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

        // Check line by line for pattern match
        for (let i = 0; i < lines.length; i++) {
          const rawLineText = lines[i];
          if (rule.regex.test(rawLineText)) {
            // REDACTION FIX (PRD v3): Never persist or store actual secret tokens
            let safeLineText = rawLineText;
            if (rule.category === 'hardcoded_secret') {
              safeLineText = rawLineText.replace(rule.regex, '[REDACTED_SECRET_VALUE]');
            }

            // Extract context snippet with redaction applied
            const startLine = Math.max(0, i - 1);
            const endLine = Math.min(lines.length - 1, i + 1);
            const snippetLines = lines.slice(startLine, endLine + 1).map((l, idx) => {
              if (startLine + idx === i && rule.category === 'hardcoded_secret') {
                return l.replace(rule.regex, '[REDACTED_SECRET_VALUE]');
              }
              return l;
            });
            const snippet = snippetLines.join('\n');

            findings.push({
              id: `${rule.id}-${file.path}-${i + 1}`,
              patternId: rule.id,
              file: file.path,
              line: i + 1,
              issue: rule.name,
              severity: rule.severity,
              category: rule.category,
              snippet: snippet.trim(),
              remediation: rule.remediation,
              explanation: rule.explanation,
              suggestedDiff: rule.suggestedDiff,
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
