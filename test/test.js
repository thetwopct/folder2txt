import test from 'ava';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

import {
    processFiles,
    writeOutput,
    main,
    cli
} from '../folder2txt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createTestFile(filepath, content) {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, content);
}

test.beforeEach(async t => {
    process.env.NODE_ENV = 'test';
    t.context.tempDir = path.join(os.tmpdir(), `folder2txt-test-${Date.now()}`);
    await fs.mkdir(t.context.tempDir, { recursive: true });
});

test.afterEach(async t => {
    if (t.context.tempDir) {
        await fs.rm(t.context.tempDir, { recursive: true, force: true }).catch(() => {});
    }
});

test('processFiles skips ignored patterns', async t => {
    const testDir = t.context.tempDir;
    const validFile = path.join(testDir, 'valid.txt');
    const ignoredFile = path.join(testDir, '.env');

    await createTestFile(validFile, 'This is valid');
    await createTestFile(ignoredFile, 'Should be ignored');

    const output = await processFiles(testDir, { threshold: 1, includeAll: true }, path.join(testDir, 'subdir', 'output.txt'));

    t.regex(output, /File: valid\.txt/, 'Should process valid files');
    t.notRegex(output, /\.env/, 'Should skip ignored files');
});

test('processFiles respects file size threshold', async t => {
    const testDir = t.context.tempDir;
    const smallFile = path.join(testDir, 'small.txt');
    const largeFile = path.join(testDir, 'large.txt');

    await createTestFile(smallFile, 'Small content');
    await createTestFile(largeFile, 'X'.repeat(1024 * 1024)); // 1MB file

    const output = await processFiles(testDir, { threshold: 0.5, includeAll: false }, path.join(testDir, 'subdir', 'output.txt'));

    t.regex(output, /File: small\.txt/, 'Should process small files');
    t.notRegex(output, /File: large\.txt/, 'Should skip large files');
});

test('processFiles handles ignored patterns in subdirectories', async t => {
    const testDir = t.context.tempDir;
    const subDir = path.join(testDir, 'subdir');
    const validFile = path.join(subDir, 'valid.txt');
    const ignoredFile = path.join(subDir, '.env');

    await createTestFile(validFile, 'This is valid');
    await createTestFile(ignoredFile, 'Should be ignored');

    const output = await processFiles(testDir, { threshold: 1, includeAll: true }, path.join(testDir, 'out', 'output.txt'));

    t.regex(output, /File: subdir\/valid\.txt/, 'Should process valid files');
    t.notRegex(output, /\.env/, 'Should skip ignored files in subdirectories');
});

test('processFiles handles empty directory', async t => {
    const testDir = t.context.tempDir;

    // Test with an empty directory
    const output = await processFiles(testDir, { threshold: 1, includeAll: true }, path.join(testDir, 'subdir', 'output.txt'));

    // Empty directory should produce empty output
    t.is(output, '', 'Should produce empty output for empty directory');
});