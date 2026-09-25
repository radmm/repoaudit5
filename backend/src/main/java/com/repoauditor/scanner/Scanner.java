package com.repoauditor.scanner;

import java.nio.file.Path;
import java.util.List;

public interface Scanner<T> {
    /**
     * Executes scan logic over ingested repository text files.
     */
    T scan(Path repoDir, List<Path> textFiles);
}
