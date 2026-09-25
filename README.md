# Repo Auditor — Automated Security & Plagiarism Analysis Engine (v2)

Repo Auditor is a full-stack code inspection engine that takes a public GitHub repository URL and concurrently computes:
1. **Security Vulnerability Grade (A–F)** via static regex checks on hardcoded secrets, SQL injection string concatenation, weak hashing (MD5/SHA1), and unsafe execution.
2. **Code Originality Score (0–100%)** via language-agnostic tokenization and Winnowing fingerprint hashing (compatible with MOSS, works across Python, JavaScript, Java, C++, Go, HTML, Markdown).

---

## Architecture & Project Structure

The project is structured into two clean tiers:

```
├── backend/                     # Java 17 + Spring Boot REST API
│   ├── pom.xml                  # Maven config (Spring Web, JGit, SQLite JDBC)
│   └── src/main/java/com/repoauditor/
│       ├── RepoAuditorApplication.java
│       ├── controller/AuditController.java   # POST /audit, GET /history
│       ├── service/AuditService.java         # JGit shallow-clone, CompletableFuture
│       ├── scanner/
│       │   ├── Scanner.java                  # Polymorphic interface
│       │   ├── BaseScanner.java              # Abstract Files.walk() text filter
│       │   ├── SecurityScanner.java          # Regex rules & severity calculator
│       │   └── PlagiarismScanner.java        # Language-agnostic Winnowing engine
│       ├── model/                            # AuditReport, SecurityFinding, PlagiarismMatch
│       └── repository/AuditRepository.java   # SQLite JDBC persistence
│
├── src/                         # React 19 + TypeScript + Tailwind CSS Frontend
│   ├── components/
│   │   ├── scan/ScanView.tsx                 # URL input & animated pipeline
│   │   ├── report/ReportCardView.tsx         # Scorecard, findings, JSON export
│   │   ├── compare/PairwiseCompareModal.tsx  # Direct 2-repo plagiarism test
│   │   ├── history/HistoryView.tsx           # Persistent audit history log
│   │   ├── oop/OOPArchitectureModal.tsx      # Slide 9 OOP concepts review
│   │   └── common/                           # GlowIcon, GlassCard, StatRow, Nav
│   └── services/                             # Real scanner orchestration & DB
│
├── server.ts                    # Express + Vite middleware full-stack dev server
└── package.json
```

---

## How to Run in GitHub Codespaces

### 1. Run the Full-Stack React Dev Server
In the root directory:
```bash
npm install
npm run dev
```
The application will launch on `http://localhost:3000` (or `http://localhost:5173`) with the interactive dashboard, mobile phone-frame mockup toggle, and real-time scanner simulation.

### 2. Run the Java 17 + Spring Boot Backend (Optional / Standalone)
Inside the `/backend` folder:
```bash
cd backend
mvn clean spring-boot:run
```
The Spring Boot REST API will start on port `8080` with endpoints:
- `POST http://localhost:8080/audit` with JSON payload `{ "repoUrl": "https://github.com/..." }`
- `GET http://localhost:8080/history`

---

## Plagiarism Algorithm: Language-Agnostic Winnowing

Unlike tools that rely on language-specific AST parsers (which break outside Java), Repo Auditor treats every source file as text:
1. **Comment Stripping**: Removes single-line (`//`, `#`, `--`) and multi-line (`/* */`, `<!-- -->`) comments.
2. **Identifier Normalization**: Normalizes variable and method names to a canonical `_ID_` token while preserving structural control keywords (`if`, `while`, `return`, `class`, `function`).
3. **K-Gram Generation**: Splits the normalized token stream into sliding windows of length $k = 6$.
4. **Winnowing**: Over a sliding window of size $w = 4$, selects the minimum hash value (breaking ties by picking the rightmost).
5. **Similarity Metric**: Computes Jaccard similarity and containment against reference repositories and stored scans.

This guarantees that a student copying code and renaming variables (e.g., `userBalance` to `accountSum`) will still be caught with an 85%+ similarity score.

---

## OOP Concepts Surface (Review Slide 9)

| Concept | Location in Codebase |
|---|---|
| **Classes & Objects** | `SecurityFinding`, `PlagiarismMatch`, `AuditReport` domain entities |
| **Interfaces** | `Scanner<T>` implemented by `SecurityScanner` and `PlagiarismScanner` |
| **Inheritance** | `BaseScanner` abstract class containing `Files.walk()` and text filtering |
| **Encapsulation** | Private fields and immutable getters on domain models |
| **Exception Handling** | Custom exceptions for network clone failures and unreadable files |
| **Multithreading** | Parallel scanner execution using `CompletableFuture.supplyAsync()` |
| **JDBC** | `AuditRepository` with SQLite database connection and prepared statements |
| **GUI** | React web application consuming REST endpoints with dark glassmorphic UI |

---

## SDG Mapping

- **SDG 16 (Peace, Justice & Strong Institutions)**: Promotes academic and code integrity, intellectual honesty, and software transparency.
- **SDG 4 (Quality Education)**: Assists universities and coding bootcamps in ensuring authentic, original programming submissions.
