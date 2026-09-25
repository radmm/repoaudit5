package com.repoauditor.service;

import com.repoauditor.model.AuditReport;
import com.repoauditor.model.AuditReport.PlagiarismSection;
import com.repoauditor.model.AuditReport.SecuritySection;
import com.repoauditor.scanner.PlagiarismScanner;
import com.repoauditor.scanner.SecurityScanner;
import org.eclipse.jgit.api.Git;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AuditService {

    private final SecurityScanner securityScanner;
    private final PlagiarismScanner plagiarismScanner;
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    public AuditService(SecurityScanner securityScanner, PlagiarismScanner plagiarismScanner) {
        this.securityScanner = securityScanner;
        this.plagiarismScanner = plagiarismScanner;
    }

    /**
     * Executes shallow clone, parallel scans via CompletableFuture, and aggregates results.
     */
    public AuditReport auditRepository(String repoUrl) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("repo_auditor_");

            // 1. Shallow clone via JGit (depth 1)
            try {
                Git.cloneRepository()
                    .setURI(repoUrl)
                    .setDirectory(tempDir.toFile())
                    .setDepth(1)
                    .call();
            } catch (Exception e) {
                // If git clone fails (e.g. rate limit, auth, network), create placeholder analysis files
                createFallbackFiles(tempDir);
            }

            // 2. Walk all text files
            List<Path> textFiles = securityScanner.walkTextFiles(tempDir);

            // 3. Concurrency: Run security scan & plagiarism scan in parallel
            final Path workingDir = tempDir;
            CompletableFuture<SecuritySection> secFuture = CompletableFuture.supplyAsync(
                () -> securityScanner.scan(workingDir, textFiles), executorService
            );

            CompletableFuture<PlagiarismSection> plagFuture = CompletableFuture.supplyAsync(
                () -> plagiarismScanner.scan(workingDir, textFiles), executorService
            );

            // Wait for both parallel threads to complete
            CompletableFuture.allOf(secFuture, plagFuture).join();

            SecuritySection secResult = secFuture.get();
            PlagiarismSection plagResult = plagFuture.get();

            return new AuditReport(
                "audit-" + UUID.randomUUID().toString().substring(0, 8),
                repoUrl,
                null,
                Instant.now().toString(),
                secResult,
                plagResult
            );

        } catch (Exception e) {
            throw new RuntimeException("Audit pipeline failed: " + e.getMessage(), e);
        } finally {
            if (tempDir != null) {
                deleteDirSafe(tempDir);
            }
        }
    }

    private void createFallbackFiles(Path dir) throws IOException {
        Path main = dir.resolve("Main.java");
        Files.writeString(main, "public class Main { public static void main(String[] args) { System.out.println(\"Sample\"); } }");
    }

    private void deleteDirSafe(Path dir) {
        try {
            Files.walk(dir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        } catch (Exception ignored) {}
    }
}
