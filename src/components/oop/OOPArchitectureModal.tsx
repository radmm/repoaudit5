import React, { useState } from 'react';
import { BrutalistCard } from '../common/GlassCard';
import {
  CodeMark,
  ArrowRightMark,
} from '../common/BrutalistIcon';

interface OOPConcept {
  id: string;
  name: string;
  whereItLives: string;
  category: string;
  description: string;
  codeSnippet: string;
}

const OOP_CONCEPTS: OOPConcept[] = [
  {
    id: 'classes-objects',
    name: 'Classes & Objects',
    whereItLives: 'SecurityFinding.java, PlagiarismMatch.java, AuditReport.java',
    category: 'Domain Model',
    description:
      'Domain entities represent clean, strongly-typed models for security vulnerabilities, winnowing token matches, and aggregated report cards with immutable properties.',
    codeSnippet: `public class SecurityFinding {
    private final String id;
    private final String file;
    private final int line;
    private final String issue;
    private final Severity severity;

    public SecurityFinding(String id, String file, int line, String issue, Severity severity) {
        this.id = id;
        this.file = file;
        this.line = line;
        this.issue = issue;
        this.severity = severity;
    }
    public String getFile() { return file; }
    public int getLine() { return line; }
}`,
  },
  {
    id: 'interfaces',
    name: 'Interfaces & Polymorphism',
    whereItLives: 'Scanner.java implemented by SecurityScanner & PlagiarismScanner',
    category: 'Extensibility',
    description:
      'A polymorphic Scanner interface decouples the execution engine from concrete scanners, allowing seamless addition of AST linters or CVE dependency checkers.',
    codeSnippet: `public interface Scanner<T> {
    ScanResult<T> scan(List<ScannedSourceFile> files);
}

@Service
public class SecurityScanner implements Scanner<SecurityFinding> {
    @Override
    public ScanResult<SecurityFinding> scan(List<ScannedSourceFile> files) {
        // Regex static analysis
    }
}`,
  },
  {
    id: 'inheritance',
    name: 'Inheritance & Code Reuse',
    whereItLives: 'BaseScanner.java abstract class with common file-walking logic',
    category: 'Hierarchy',
    description:
      'An abstract BaseScanner encapsulates common shallow-clone file traversal, UTF-8 text validation, comment stripping, and token stream caching.',
    codeSnippet: `public abstract class BaseScanner {
    protected List<ScannedSourceFile> walkTextFiles(Path repoRoot) throws IOException {
        try (Stream<Path> stream = Files.walk(repoRoot)) {
            return stream
                .filter(Files::isRegularFile)
                .filter(this::isTextSourceFile)
                .map(this::readSource)
                .collect(Collectors.toList());
        }
    }
    protected abstract boolean isTextSourceFile(Path path);
}`,
  },
  {
    id: 'encapsulation',
    name: 'Encapsulation & Immutability',
    whereItLives: 'AuditReportBuilder with private fields and safe getters',
    category: 'Design Pattern',
    description:
      'Report builder patterns protect internal mutable collections from direct modification during multi-step analysis, ensuring thread safety.',
    codeSnippet: `public class AuditReport {
    private final String repoUrl;
    private final SecurityGrade grade;
    private final List<SecurityFinding> findings;

    private AuditReport(Builder builder) {
        this.repoUrl = builder.repoUrl;
        this.grade = builder.grade;
        this.findings = Collections.unmodifiableList(builder.findings);
    }
    public List<SecurityFinding> getFindings() {
        return this.findings; // Unmodifiable
    }
}`,
  },
  {
    id: 'exception-handling',
    name: 'Robust Exception Handling',
    whereItLives: 'RepoCloneException, InvalidGitUrlException, FileParsingException',
    category: 'Reliability',
    description:
      'Custom exception hierarchy with GlobalExceptionHandler gracefully handles rate-limited GitHub APIs, private repos, network timeouts, and binary corruption.',
    codeSnippet: `public class RepoCloneException extends RuntimeException {
    public RepoCloneException(String repoUrl, Throwable cause) {
        super("Failed to clone: " + repoUrl, cause);
    }
}

@ExceptionHandler(RepoCloneException.class)
public ResponseEntity<ErrorResponse> handleCloneError(RepoCloneException ex) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .body(new ErrorResponse("CLONE_FAILED", ex.getMessage()));
}`,
  },
  {
    id: 'multithreading',
    name: 'Multithreading & Concurrency',
    whereItLives: 'CompletableFuture.supplyAsync() & ExecutorService in AuditService',
    category: 'Performance',
    description:
      'Parallelizes the compute-intensive regex security scanner and the winnowing k-gram hashing scanner across separate thread pools for sub-second response times.',
    codeSnippet: `ExecutorService executor = Executors.newFixedThreadPool(4);

CompletableFuture<SecurityResult> secFuture = CompletableFuture.supplyAsync(
    () -> securityScanner.scan(files), executor
);
CompletableFuture<PlagiarismResult> plagFuture = CompletableFuture.supplyAsync(
    () -> plagiarismScanner.scan(files, referenceCorpus), executor
);

CompletableFuture.allOf(secFuture, plagFuture).join();
AuditReport report = aggregate(secFuture.get(), plagFuture.get());`,
  },
  {
    id: 'jdbc-persistence',
    name: 'JDBC / Database Persistence',
    whereItLives: 'AuditRepository.java (audits & findings relational schema)',
    category: 'Storage',
    description:
      'Normalized relational persistence storing audit metadata in the audits table and relational one-to-many vulnerabilities in the findings table.',
    codeSnippet: `String sql = "INSERT INTO audits (id, repo_url, timestamp, security_score, plagiarism_score) " +
             "VALUES (?, ?, ?, ?, ?)";
try (PreparedStatement ps = connection.prepareStatement(sql)) {
    ps.setString(1, report.getId());
    ps.setString(2, report.getRepoUrl());
    ps.setTimestamp(3, Timestamp.from(Instant.now()));
    ps.setInt(4, report.getSecurityScore());
    ps.setInt(5, report.getPlagiarismSimilarity());
    ps.executeUpdate();
}`,
  },
  {
    id: 'gui-rest',
    name: 'GUI & REST Integration',
    whereItLives: 'React Vite Frontend + Spring Boot REST Controller',
    category: 'Architecture',
    description:
      'Clean client-server separation where the React frontend invokes POST /audit, GET /history, and renders glassmorphic scorecards and line diff viewers.',
    codeSnippet: `@RestController
@RequestMapping("/audit")
@CrossOrigin(origins = "*")
public class AuditController {
    @PostMapping
    public ResponseEntity<AuditReport> auditRepo(@RequestBody AuditRequest req) {
        return ResponseEntity.ok(auditService.auditRepository(req.getRepoUrl()));
    }
}`,
  },
];

export const OOPArchitectureModal: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState<OOPConcept>(OOP_CONCEPTS[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <BrutalistCard bg="white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#0D0D0D]/60 tracking-wider">
              REVIEW SLIDE 9 OOP CONCEPTS & SYSTEM ARCHITECTURE
            </span>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D0D0D]">
              OOP CONCEPTS MAPPING
            </h1>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-1 bg-[#D7FF3E] border-2 border-[#0D0D0D]">
            SDG 16 & 4
          </span>
        </div>
      </BrutalistCard>

      {/* Grid: Concepts on left, code on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-1.5">
          {OOP_CONCEPTS.map((concept, index) => {
            const isSelected = selectedConcept.id === concept.id;
            return (
              <div
                key={concept.id}
                onClick={() => setSelectedConcept(concept)}
                className={`p-3 border-2 border-[#0D0D0D] cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#D7FF3E] shadow-[3px_3px_0px_#0D0D0D] font-bold'
                    : 'bg-white hover:bg-[#F2EFE9]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0D0D0D]/50 font-bold">{index + 1}.</span>
                    <span className="text-[#0D0D0D]">{concept.name}</span>
                  </div>
                  <span className="text-[10px] uppercase text-[#0D0D0D]/60">
                    {concept.category}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[#0D0D0D]/70 truncate mt-1">
                  {concept.whereItLives}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Code & Explanation (7 cols) */}
        <div className="lg:col-span-7">
          <BrutalistCard bg="white" className="h-full flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0D0D0D]">
                <div>
                  <h2 className="font-display font-bold text-base text-[#0D0D0D]">
                    {selectedConcept.name}
                  </h2>
                  <p className="font-mono text-[10px] text-[#2B4BF2] mt-0.5">
                    {selectedConcept.whereItLives}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-[#0D0D0D] bg-[#F2EFE9]">
                  {selectedConcept.category}
                </span>
              </div>

              <p className="font-sans text-xs text-[#0D0D0D]/80 mt-3 leading-relaxed">
                {selectedConcept.description}
              </p>

              <div className="mt-3">
                <div className="px-3 py-1 bg-[#E8E4DA] border-t-2 border-x-2 border-[#0D0D0D] font-mono text-[10px] uppercase text-[#0D0D0D] font-bold">
                  Java 17 Implementation
                </div>
                <pre
                  className="p-3 bg-[#0D0D0D] text-[#D7FF3E] font-mono text-xs overflow-x-auto border-2 border-[#0D0D0D]"
                  style={{ borderRadius: '0px' }}
                >
                  <code>{selectedConcept.codeSnippet}</code>
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-[#0D0D0D]/20 font-mono text-[10px] text-[#0D0D0D]/60 flex justify-between">
              <span>Ready for Review Defense</span>
              <span className="font-bold text-[#0D0D0D]">Slide 9 Prepared</span>
            </div>
          </BrutalistCard>
        </div>
      </div>
    </div>
  );
};
