package com.repoauditor.scanner;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public abstract class BaseScanner {

    private static final Set<String> BINARY_EXTENSIONS = new HashSet<>(Arrays.asList(
        "png", "jpg", "jpeg", "gif", "ico", "pdf", "zip", "tar", "gz", "class",
        "jar", "war", "exe", "dll", "so", "dylib", "bin", "wasm", "pyc"
    ));

    /**
     * Walks the cloned directory using java.nio.file.Files.walk()
     * and filters out binary / non-text files.
     */
    public List<Path> walkTextFiles(Path repoRoot) throws IOException {
        try (Stream<Path> stream = Files.walk(repoRoot)) {
            return stream
                .filter(Files::isRegularFile)
                .filter(this::isTextFile)
                .collect(Collectors.toList());
        }
    }

    public boolean isTextFile(Path path) {
        String filename = path.getFileName().toString();
        int dot = filename.lastIndexOf('.');
        if (dot == -1) return true; // extensionless text (e.g. Dockerfile, Makefile)
        String ext = filename.substring(dot + 1).toLowerCase();
        return !BINARY_EXTENSIONS.contains(ext);
    }

    public String readContentSafe(Path file) {
        try {
            return Files.readString(file);
        } catch (Exception e) {
            return "";
        }
    }
}
