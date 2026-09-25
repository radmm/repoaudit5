package com.repoauditor.model;

public class PlagiarismMatch {
    private String id;
    private String file;
    private String matchedWith;
    private double confidence;
    private String matchedLinesRange;
    private int tokenOverlapCount;
    private String snippet;
    private String matchedSnippet;

    public PlagiarismMatch() {}

    public PlagiarismMatch(String id, String file, String matchedWith, double confidence, String matchedLinesRange, int tokenOverlapCount, String snippet, String matchedSnippet) {
        this.id = id;
        this.file = file;
        this.matchedWith = matchedWith;
        this.confidence = confidence;
        this.matchedLinesRange = matchedLinesRange;
        this.tokenOverlapCount = tokenOverlapCount;
        this.snippet = snippet;
        this.matchedSnippet = matchedSnippet;
    }

    public String getId() { return id; }
    public String getFile() { return file; }
    public String getMatchedWith() { return matchedWith; }
    public double getConfidence() { return confidence; }
    public String getMatchedLinesRange() { return matchedLinesRange; }
    public int getTokenOverlapCount() { return tokenOverlapCount; }
    public String getSnippet() { return snippet; }
    public String getMatchedSnippet() { return matchedSnippet; }
}
