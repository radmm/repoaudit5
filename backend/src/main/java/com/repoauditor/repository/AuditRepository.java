package com.repoauditor.repository;

import com.repoauditor.model.AuditReport;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

@Repository
public class AuditRepository {

    private static final String DB_URL = "jdbc:sqlite:repo_auditor.db";

    public AuditRepository() {
        initDatabase();
    }

    private void initDatabase() {
        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt = conn.createStatement()) {

            // Schema as defined in PRD
            String createAuditsTable = "CREATE TABLE IF NOT EXISTS audits (" +
                "id TEXT PRIMARY KEY, " +
                "repo_url TEXT NOT NULL, " +
                "timestamp TEXT NOT NULL, " +
                "security_score INTEGER, " +
                "security_grade TEXT, " +
                "plagiarism_score INTEGER" +
                ");";

            String createFindingsTable = "CREATE TABLE IF NOT EXISTS findings (" +
                "id TEXT PRIMARY KEY, " +
                "audit_id TEXT NOT NULL, " +
                "type TEXT NOT NULL, " +
                "file TEXT NOT NULL, " +
                "line INTEGER, " +
                "description TEXT, " +
                "severity TEXT, " +
                "FOREIGN KEY (audit_id) REFERENCES audits(id)" +
                ");";

            stmt.execute(createAuditsTable);
            stmt.execute(createFindingsTable);

        } catch (SQLException e) {
            System.err.println("JDBC Database initialization failed: " + e.getMessage());
        }
    }

    public void saveAudit(AuditReport report) {
        String sql = "INSERT INTO audits (id, repo_url, timestamp, security_score, security_grade, plagiarism_score) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, report.getId());
            ps.setString(2, report.getRepoUrl());
            ps.setString(3, report.getTimestamp());
            ps.setInt(4, report.getSecurity().getScore());
            ps.setString(5, report.getSecurity().getGrade());
            ps.setInt(6, report.getPlagiarism().getSimilarity());
            ps.executeUpdate();

        } catch (SQLException e) {
            System.err.println("Failed to persist audit to SQLite via JDBC: " + e.getMessage());
        }
    }
}
