package com.repoauditor.model;

public class SecurityFinding {
    private String id;
    private String file;
    private int line;
    private String issue;
    private String severity; // critical, high, medium, low
    private String category;
    private String snippet;
    private String remediation;

    public SecurityFinding() {}

    public SecurityFinding(String id, String file, int line, String issue, String severity, String category, String snippet, String remediation) {
        this.id = id;
        this.file = file;
        this.line = line;
        this.issue = issue;
        this.severity = severity;
        this.category = category;
        this.snippet = snippet;
        this.remediation = remediation;
    }

    public String getId() { return id; }
    public String getFile() { return file; }
    public int getLine() { return line; }
    public String getIssue() { return issue; }
    public String getSeverity() { return severity; }
    public String getCategory() { return category; }
    public String getSnippet() { return snippet; }
    public String getRemediation() { return remediation; }
}
