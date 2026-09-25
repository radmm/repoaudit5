package com.repoauditor.model;

import java.util.List;
import java.util.Map;

public class AuditReport {
    private String id;
    private String repoUrl;
    private String compareRepoUrl;
    private String timestamp;
    private SecuritySection security;
    private PlagiarismSection plagiarism;

    public static class SecuritySection {
        private String grade;
        private int score;
        private List<SecurityFinding> findings;

        public SecuritySection() {}
        public SecuritySection(String grade, int score, List<SecurityFinding> findings) {
            this.grade = grade;
            this.score = score;
            this.findings = findings;
        }

        public String getGrade() { return grade; }
        public int getScore() { return score; }
        public List<SecurityFinding> getFindings() { return findings; }
    }

    public static class PlagiarismSection {
        private int similarity;
        private List<PlagiarismMatch> matches;

        public PlagiarismSection() {}
        public PlagiarismSection(int similarity, List<PlagiarismMatch> matches) {
            this.similarity = similarity;
            this.matches = matches;
        }

        public int getSimilarity() { return similarity; }
        public List<PlagiarismMatch> getMatches() { return matches; }
    }

    public AuditReport() {}

    public AuditReport(String id, String repoUrl, String compareRepoUrl, String timestamp, SecuritySection security, PlagiarismSection plagiarism) {
        this.id = id;
        this.repoUrl = repoUrl;
        this.compareRepoUrl = compareRepoUrl;
        this.timestamp = timestamp;
        this.security = security;
        this.plagiarism = plagiarism;
    }

    public String getId() { return id; }
    public String getRepoUrl() { return repoUrl; }
    public String getCompareRepoUrl() { return compareRepoUrl; }
    public String getTimestamp() { return timestamp; }
    public SecuritySection getSecurity() { return security; }
    public PlagiarismSection getPlagiarism() { return plagiarism; }
}
