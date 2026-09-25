import { PlagiarismMatch, ScannedFile } from '../types/audit';

interface Fingerprint {
  hash: number;
  filePath: string;
  tokenIndex: number;
  line: number;
  rawSnippet?: string;
}

const COMMON_KEYWORDS = new Set([
  'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'break', 'continue',
  'return', 'function', 'class', 'struct', 'interface', 'implements', 'extends',
  'public', 'private', 'protected', 'static', 'final', 'const', 'let', 'var',
  'def', 'import', 'export', 'from', 'package', 'try', 'catch', 'throw', 'throws',
  'finally', 'async', 'await', 'yield', 'new', 'this', 'super', 'typeof',
  'sizeof', 'void', 'int', 'float', 'double', 'bool', 'boolean', 'char', 'string',
  'null', 'undefined', 'true', 'false', 'select', 'where', 'from', 'table',
]);

// 32-bit FNV-1a Hash
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class PlagiarismScanner {
  private kgramSize: number = 6;
  private windowSize: number = 4;

  constructor(kgramSize: number = 6, windowSize: number = 4) {
    this.kgramSize = kgramSize;
    this.windowSize = windowSize;
  }

  /**
   * Tokenizes text language-agnostically:
   * Strips comments, collapses whitespace, normalizes identifiers to _ID_
   */
  public tokenize(content: string): { tokens: string[]; lineMap: number[] } {
    // Strip multi-line comments: /* */ and <!-- --> and """ """
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/"""[\s\S]*?"""/g, ' ')
      .replace(/'''[\s\S]*?'''/g, ' ');

    const lines = cleanContent.split('\n');
    const tokens: string[] = [];
    const lineMap: number[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      let line = lines[lineIdx];

      // Strip single-line comments //, #, --, ;
      line = line.replace(/(\/\/|#|--|;).*$/, '');

      // Replace string literals with _STR_
      line = line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, ' _STR_ ');

      // Replace numeric literals with _NUM_
      line = line.replace(/\b\d+(\.\d+)?\b/g, ' _NUM_ ');

      // Split into word & symbol tokens
      const matches = line.match(/[a-zA-Z_][a-zA-Z0-9_]*|[^\s\w]/g);
      if (!matches) continue;

      for (const rawToken of matches) {
        let token = rawToken.trim();
        if (!token) continue;

        const lower = token.toLowerCase();
        if (COMMON_KEYWORDS.has(lower)) {
          tokens.push(lower);
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
          // Normalize user-defined identifier to _ID_
          tokens.push('_ID_');
        } else {
          // Punctuation / Operator token
          tokens.push(token);
        }
        lineMap.push(lineIdx + 1);
      }
    }

    return { tokens, lineMap };
  }

  /**
   * Winnowing algorithm:
   * Computes k-gram hashes, then selects the minimum hash in each sliding window.
   */
  public generateFingerprints(file: ScannedFile): Fingerprint[] {
    if (file.isBinary || !file.content) return [];

    const { tokens, lineMap } = this.tokenize(file.content);
    if (tokens.length < this.kgramSize) return [];

    // Step 1: Compute hashes for all sliding k-grams
    const hashes: { hash: number; tokenIndex: number; line: number }[] = [];
    for (let i = 0; i <= tokens.length - this.kgramSize; i++) {
      const kgram = tokens.slice(i, i + this.kgramSize).join('');
      const hash = fnv1aHash(kgram);
      hashes.push({
        hash,
        tokenIndex: i,
        line: lineMap[i] || 1,
      });
    }

    if (hashes.length === 0) return [];

    // Step 2: Winnowing across sliding window of size w
    const fingerprints: Fingerprint[] = [];
    let lastSelectedIdx = -1;

    for (let i = 0; i <= hashes.length - this.windowSize; i++) {
      // Find minimum hash in window [i ... i + windowSize - 1]
      // Tie-breaking: pick the rightmost minimum
      let minIdx = i;
      let minHash = hashes[i].hash;

      for (let j = 1; j < this.windowSize; j++) {
        const curIdx = i + j;
        if (hashes[curIdx].hash <= minHash) {
          minHash = hashes[curIdx].hash;
          minIdx = curIdx;
        }
      }

      // If minIdx is new or moved, record fingerprint
      if (minIdx !== lastSelectedIdx) {
        lastSelectedIdx = minIdx;
        const entry = hashes[minIdx];

        // Extract a readable snippet around this line
        const lines = (file.content || '').split('\n');
        const startL = Math.max(0, entry.line - 2);
        const endL = Math.min(lines.length - 1, entry.line + 2);
        const rawSnippet = lines.slice(startL, endL + 1).join('\n');

        fingerprints.push({
          hash: entry.hash,
          filePath: file.path,
          tokenIndex: entry.tokenIndex,
          line: entry.line,
          rawSnippet,
        });
      }
    }

    return fingerprints;
  }

  /**
   * Scans a target repository's files against reference corpus fingerprints or a second comparison repo.
   */
  public scan(
    targetFiles: ScannedFile[],
    referenceFiles?: ScannedFile[]
  ): {
    similarity: number;
    matches: PlagiarismMatch[];
    fingerprintCount: number;
    algorithm: string;
    details: {
      matchedKgrams: number;
      totalKgrams: number;
      windowSize: number;
      kgramSize: number;
    };
  } {
    // 1. Generate target fingerprints
    const targetFingerprintsMap = new Map<string, Fingerprint[]>();
    const allTargetHashes = new Set<number>();
    let totalTargetFps = 0;

    for (const file of targetFiles) {
      if (file.isBinary) continue;
      const fps = this.generateFingerprints(file);
      targetFingerprintsMap.set(file.path, fps);
      totalTargetFps += fps.length;
      for (const fp of fps) {
        allTargetHashes.add(fp.hash);
      }
    }

    // 2. Reference fingerprints
    const refFingerprintsByHash = new Map<number, Fingerprint[]>();
    const allRefHashes = new Set<number>();
    let totalRefFps = 0;

    const refCorpus = referenceFiles || this.getDefaultCorpus();

    for (const refFile of refCorpus) {
      if (refFile.isBinary) continue;
      const fps = this.generateFingerprints(refFile);
      totalRefFps += fps.length;
      for (const fp of fps) {
        allRefHashes.add(fp.hash);
        const list = refFingerprintsByHash.get(fp.hash) || [];
        list.push(fp);
        refFingerprintsByHash.set(fp.hash, list);
      }
    }

    // 3. Find intersections and compute matches
    const matches: PlagiarismMatch[] = [];
    let matchedHashCount = 0;

    for (const [targetPath, targetFps] of targetFingerprintsMap.entries()) {
      const fileMatchedRefs = new Map<string, { count: number; linesTarget: number[]; linesRef: number[]; snippetTarget?: string; snippetRef?: string }>();

      for (const fp of targetFps) {
        const hits = refFingerprintsByHash.get(fp.hash);
        if (hits && hits.length > 0) {
          matchedHashCount++;
          for (const hit of hits) {
            const current = fileMatchedRefs.get(hit.filePath) || {
              count: 0,
              linesTarget: [],
              linesRef: [],
              snippetTarget: fp.rawSnippet,
              snippetRef: hit.rawSnippet,
            };
            current.count += 1;
            current.linesTarget.push(fp.line);
            current.linesRef.push(hit.line);
            fileMatchedRefs.set(hit.filePath, current);
          }
        }
      }

      // If significant overlap with any reference file
      for (const [refPath, data] of fileMatchedRefs.entries()) {
        const fileTargetFps = targetFps.length;
        if (fileTargetFps === 0) continue;

        const confidence = Math.min(0.99, Number((data.count / Math.max(data.count + 2, fileTargetFps * 0.7)).toFixed(2)));

        if (confidence >= 0.25 || data.count >= 3) {
          const minTargetLine = Math.min(...data.linesTarget);
          const maxTargetLine = Math.max(...data.linesTarget);
          const minRefLine = Math.min(...data.linesRef);
          const maxRefLine = Math.max(...data.linesRef);

          matches.push({
            id: `MATCH-${targetPath}-${refPath}`.replace(/[^a-zA-Z0-9-]/g, '_'),
            file: targetPath,
            matchedWith: refPath,
            confidence: Math.max(0.35, Math.min(0.98, confidence)),
            matchedLinesRange: `L${minTargetLine}-${maxTargetLine} vs L${minRefLine}-${maxRefLine}`,
            tokenOverlapCount: data.count,
            snippet: data.snippetTarget,
            matchedSnippet: data.snippetRef,
          });
        }
      }
    }

    // Calculate overall similarity %
    // Jaccard similarity between target fingerprints and reference fingerprints
    let sharedHashes = 0;
    for (const h of allTargetHashes) {
      if (allRefHashes.has(h)) sharedHashes++;
    }

    const unionSize = allTargetHashes.size + allRefHashes.size - sharedHashes;
    const similarityRaw = unionSize > 0 ? (sharedHashes / allTargetHashes.size) * 100 : 0;
    const similarity = Math.min(100, Math.round(similarityRaw));

    return {
      similarity,
      matches: matches.sort((a, b) => b.confidence - a.confidence),
      fingerprintCount: totalTargetFps,
      algorithm: 'Winnowing (MOSS-compatible Sliding Window K-gram Hash)',
      details: {
        matchedKgrams: sharedHashes,
        totalKgrams: allTargetHashes.size,
        windowSize: this.windowSize,
        kgramSize: this.kgramSize,
      },
    };
  }

  /**
   * Reference corpus for plagiarism detection when scanning standalone repos
   */
  private getDefaultCorpus(): ScannedFile[] {
    return [
      {
        path: 'reference/algorithms/BinarySearchTree.java',
        size: 1420,
        extension: 'java',
        isBinary: false,
        linesCount: 52,
        content: `package com.academic.structures;

public class BinarySearchTree {
    private Node root;

    public void insert(int value) {
        root = insertRec(root, value);
    }

    private Node insertRec(Node current, int value) {
        if (current == null) {
            return new Node(value);
        }
        if (value < current.value) {
            current.left = insertRec(current.left, value);
        } else if (value > current.value) {
            current.right = insertRec(current.right, value);
        }
        return current;
    }

    public boolean search(int key) {
        return searchRec(root, key);
    }

    private boolean searchRec(Node current, int key) {
        if (current == null) return false;
        if (current.value == key) return true;
        return key < current.value 
            ? searchRec(current.left, key) 
            : searchRec(current.right, key);
    }
}`,
      },
      {
        path: 'reference/web/AuthenticationHandler.ts',
        size: 1890,
        extension: 'ts',
        isBinary: false,
        linesCount: 65,
        content: `export async function verifyUserToken(token: string, secret: string) {
    if (!token || !secret) {
        throw new Error("Missing auth credentials");
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
        return { valid: false, reason: "Malformed token" };
    }
    const [header, payload, signature] = parts;
    const computedSig = createHmac('sha256', secret).update(\`\${header}.\${payload}\`).digest('base64url');
    if (computedSig !== signature) {
        return { valid: false, reason: "Signature mismatch" };
    }
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (claims.exp < Date.now() / 1000) {
        return { valid: false, reason: "Token expired" };
    }
    return { valid: true, user: claims.sub };
}`,
      },
      {
        path: 'reference/scripts/data_pipeline.py',
        size: 1250,
        extension: 'py',
        isBinary: false,
        linesCount: 45,
        content: `import json
import os

def normalize_dataset(records, primary_key="id"):
    seen_keys = set()
    cleaned = []
    for row in records:
        key = row.get(primary_key)
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        cleaned.append({
            "id": key,
            "val": row.get("value", 0),
            "status": row.get("status", "pending").lower()
        })
    return cleaned
`,
      }
    ];
  }
}
