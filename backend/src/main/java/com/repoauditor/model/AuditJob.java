package com.repoauditor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Represents an asynchronous audit job row in the jobs table (PRD v3 Section 2 & 3.6).
 * Enables non-blocking execution with live status tracking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditJob {
    private String id;
    private String repoUrl;
    private String compareRepoUrl;
    private String commitSha;
    private String status; // queued, cloning, scanning, aggregating, done, failed
    private String progressMessage;
    private int progressPercent;
    private String failureReason;
    private AuditReport result;
    private Instant createdAt;
    private Instant updatedAt;
}
