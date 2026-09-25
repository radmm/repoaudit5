package com.repoauditor.scanner;

import com.repoauditor.model.AuditReport.SecuritySection;
import com.repoauditor.model.SecurityFinding;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SecurityScanner extends BaseScanner implements Scanner<SecuritySection> {

    private static class CheckRule {
        String id;
        String issue;
        String severity;
        String category;
        Pattern pattern;
        String remediation;

        CheckRule(String id, String issue, String severity, String category, String regex, String remediation) {
            this.id = id;
            this.issue = issue;
            this.severity = severity;
            this.category = category;
            this.pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
            this.remediation = remediation;
        }
    }

    private final List<CheckRule> rules = new ArrayList<>();

    public SecurityScanner() {
        // 1. Secrets
        rules.add(new CheckRule("SEC-AWS", "Hardcoded AWS Access Key", "critical", "hardcoded_secret",
            "(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}", "Use AWS Secrets Manager or environment variables."));
        rules.add(new CheckRule("SEC-STRIPE", "Hardcoded Stripe Secret API Key", "critical", "hardcoded_secret",
            "sk_live_[0-9a-zA-Z]{24,34}", "Revoke this live API secret and inject via secure vault."));
        rules.add(new CheckRule("SEC-PWD", "Hardcoded Plaintext Password/Token", "high", "hardcoded_secret",
            "(?:password|passwd|secret_key|api_secret)\\s*[:=]\\s*['\"][^'\"]{6,40}['\"]", "Store passwords in secure environment credentials."));

        // 2. SQL Injection
        rules.add(new CheckRule("SEC-SQLI", "SQL Built with String Concatenation", "critical", "sql_injection",
            "(?:SELECT|INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+.*?\\+\\s*[a-zA-Z0-9_$.]+", "Use parameterized queries or PreparedStatement."));

        // 3. Weak Hashing
        rules.add(new CheckRule("SEC-MD5", "Insecure Hashing Algorithm (MD5)", "high", "weak_hash",
            "MessageDigest\\.getInstance\\([\"']MD5[\"']\\)|hashlib\\.md5", "MD5 has known collisions. Upgrade to SHA-256 or bcrypt."));
    }

    @Override
    public SecuritySection scan(Path repoDir, List<Path> textFiles) {
        List<SecurityFinding> findings = new ArrayList<>();

        for (Path file : textFiles) {
            String content = readContentSafe(file);
            if (content.isEmpty()) continue;

            String relativePath = repoDir.relativize(file).toString().replace('\\', '/');
            String[] lines = content.split("\\r?\\n");

            for (CheckRule rule : rules) {
                for (int i = 0; i < lines.length; i++) {
                    Matcher matcher = rule.pattern.matcher(lines[i]);
                    if (matcher.find()) {
                        findings.add(new SecurityFinding(
                            rule.id + "-" + relativePath + "-" + (i + 1),
                            relativePath,
                            i + 1,
                            rule.issue,
                            rule.severity,
                            rule.category,
                            lines[i].trim(),
                            rule.remediation
                        ));
                    }
                }
            }
        }

        // Calculate severity penalty
        int criticalCount = 0;
        int highCount = 0;
        for (SecurityFinding f : findings) {
            if ("critical".equalsIgnoreCase(f.getSeverity())) criticalCount++;
            else if ("high".equalsIgnoreCase(f.getSeverity())) highCount++;
        }

        int score = Math.max(0, 100 - (criticalCount * 25 + highCount * 15));
        String grade = "A";
        if (score < 60) grade = "F";
        else if (score < 70) grade = "D";
        else if (score < 80) grade = "C";
        else if (score < 90) grade = "B";

        return new SecuritySection(grade, score, findings);
    }
}
