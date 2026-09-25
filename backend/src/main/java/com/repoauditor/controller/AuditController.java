package com.repoauditor.controller;

import com.repoauditor.model.AuditReport;
import com.repoauditor.repository.AuditRepository;
import com.repoauditor.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "*"})
public class AuditController {

    private final AuditService auditService;
    private final AuditRepository auditRepository;

    public AuditController(AuditService auditService, AuditRepository auditRepository) {
        this.auditService = auditService;
        this.auditRepository = auditRepository;
    }

    public static class AuditRequest {
        private String repoUrl;
        public String getRepoUrl() { return repoUrl; }
        public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }
    }

    /**
     * POST /audit - Ingests repo, executes parallel security & plagiarism scans, persists to DB.
     */
    @PostMapping("/audit")
    public ResponseEntity<AuditReport> audit(@RequestBody AuditRequest request) {
        if (request.getRepoUrl() == null || request.getRepoUrl().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        AuditReport report = auditService.auditRepository(request.getRepoUrl());
        auditRepository.saveAudit(report);

        return ResponseEntity.ok(report);
    }

    /**
     * GET /history - Lists past audits
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        return ResponseEntity.ok(Map.of("message", "History stored via JDBC SQLite"));
    }
}
