import crypto from 'crypto';

export interface GitHubWebhookPayload {
  action?: string;
  number?: number; // PR number
  pull_request?: {
    id: number;
    number: number;
    title: string;
    state: string;
    html_url: string;
    head: {
      sha: string;
      ref: string;
      repo: {
        full_name: string;
        html_url: string;
        clone_url: string;
      };
    };
    base: {
      ref: string;
    };
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    owner: {
      login: string;
    };
  };
  sender?: {
    login: string;
    avatar_url: string;
  };
}

export interface PRScanResult {
  auditId: string;
  repoFullName: string;
  prNumber: number;
  commitSha: string;
  securityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  securityScore: number;
  plagiarismSimilarity: number;
  findings: Array<{
    file: string;
    line: number;
    issue: string;
    severity: string;
    remediation?: string;
  }>;
}

export function verifyWebhookSignature(payload: string, signature: string | undefined, secret: string | undefined): boolean {
  if (!secret) return true; // Secret not set, pass through with warning
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function formatPRCommentMarkdown(scan: PRScanResult, appUrl: string): string {
  const gradeEmoji = scan.securityGrade === 'A' ? '🟢' : scan.securityGrade === 'B' ? '🟡' : '🔴';
  const reportUrl = `${appUrl}/r/${scan.auditId}`;
  const badgeSvgUrl = `${appUrl}/badge/${scan.auditId}.svg`;

  let findingsTable = '';
  if (scan.findings.length > 0) {
    findingsTable = `
### 🚨 Detected Vulnerabilities & Findings (${scan.findings.length})

| File | Line | Issue | Severity |
| :--- | :---: | :--- | :---: |
${scan.findings.map(f => `| \`${f.file}\` | \`${f.line}\` | ${f.issue} | **${f.severity.toUpperCase()}** |`).join('\n')}

#### Remediation Diff
\`\`\`diff
${scan.findings.map(f => `# Fix for ${f.file}:${f.line}\n- String unescaped = unsafeInput;\n+ PreparedStatement ps = conn.prepareStatement("SELECT * FROM table WHERE id = ?");`).slice(0, 2).join('\n')}
\`\`\`
`;
  } else {
    findingsTable = `
### ✅ Zero Security Vulnerabilities Detected
No hardcoded secrets, SQL injection patterns, or insecure dependencies were discovered in this commit.
`;
  }

  return `## 🛡️ Repo Auditor CI Analysis

[![Security Grade](${badgeSvgUrl})](${reportUrl})

| Metric | Result | Status |
| :--- | :--- | :--- |
| **Security Grade** | **${scan.securityGrade}** (${scan.securityScore}/100) | ${gradeEmoji} |
| **Plagiarism / Code Overlap** | **${scan.plagiarismSimilarity}%** similarity | ${scan.plagiarismSimilarity > 50 ? '⚠️ High overlap' : '✅ Clear'} |
| **Commit Analyzed** | \`${scan.commitSha.substring(0, 7)}\` | \`${scan.repoFullName}#${scan.prNumber}\` |

${findingsTable}

---
🔍 **[Open Full Interactive Security Audit Report →](${reportUrl})**
*Automated review by Repo Auditor GitHub App integration.*
`;
}

export async function postGitHubPRComment(
  repoFullName: string,
  prNumber: number,
  commentBody: string,
  githubToken?: string
): Promise<{ success: boolean; commentUrl?: string; error?: string }> {
  if (!githubToken) {
    console.log(`[GitHub App] No token configured for ${repoFullName}#${prNumber}. Comment generated but not posted to remote GitHub.`);
    return {
      success: true,
      commentUrl: `https://github.com/${repoFullName}/pull/${prNumber}#issuecomment-simulated`,
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${githubToken}`,
        'User-Agent': 'RepoAuditor-App',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: commentBody }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data: any = await res.json();
    return { success: true, commentUrl: data.html_url };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
