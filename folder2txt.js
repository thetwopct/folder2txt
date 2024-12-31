#!/usr/bin/env node

/**
 * folder2txt - A command-line tool to combine text files in the current folder into a single output file.
 * 
 * Based on https://github.com/addyosmani/git2txt
 * 
 * Features:
 * - Processes text files in the current folder and subfolders
 * - Filters binary and large files
 * - Customizable file size threshold
 * - Debug mode for troubleshooting
 * - Progress indicators for long operations
 * 
 * @module folder2txt
 */

import meow from 'meow';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { filesize as formatFileSize } from 'filesize';
import { isBinaryFile } from 'isbinaryfile';

// CLI help text with usage instructions and examples
const helpText = `
  ${chalk.bold('Usage')}
    $ folder2txt [options]

  ${chalk.bold('Options')}
    --output, -o     Specify output file path
    --threshold, -t  Set file size threshold in MB (default: 0.5)
    --include-all    Include all files regardless of size or type
    --debug          Enable debug mode with verbose logging
    --help           Show help
    --version        Show version

  ${chalk.bold('Examples')}
    $ folder2txt
    $ folder2txt --output=output.txt
`;

// Initialize CLI parser with meow
export const cli = meow(helpText, {
    importMeta: import.meta,
    flags: {
        output: {
            type: 'string',
            shortFlag: 'o'
        },
        threshold: {
            type: 'number',
            shortFlag: 't',
            default: 0.1
        },
        includeAll: {
            type: 'boolean',
            default: false
        },
        debug: {
            type: 'boolean',
            default: false
        }
    }
});

/**
 * Patterns for folders and files to ignore
 */
const ignoredPatterns = [
    // Folders
    'node_modules',
    'vendor',
    '.git',
    '.github',

    // Files
    '*.lock',
    'package-lock.json',
    '.env'
];

/**
 * Checks if a file or folder should be ignored
 * @param {string} name - The name of the file or folder
 * @returns {boolean} True if the file or folder should be ignored
 */
function isIgnored(name) {
    return ignoredPatterns.some((pattern) => {
        const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')); // Convert wildcard to regex
        return regex.test(name);
    });
}

/**
 * Processes files in the current directory and combines them into a single text output.
 * @param {string} directory - Path to the directory to process
 * @param {Object} options - Processing options
 * @param {number} options.threshold - File size threshold in MB
 * @param {boolean} options.includeAll - Whether to include all files regardless of size/type
 * @returns {Promise<string>} Combined content of all processed files
 */
export async function processFiles(directory, options, outputFilePath) {
    const spinner = process.env.NODE_ENV !== 'test' ? ora('Processing files...').start() : null;
    const thresholdBytes = options.threshold * 1024 * 1024;
    const outputDir = path.dirname(outputFilePath);
    const outputFileName = path.basename(outputFilePath); // Get output file name
    let output = '';
    let processedFiles = 0;
    let skippedFiles = 0;

    async function processDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip ignored files and folders
            if (isIgnored(entry.name)) {
                if (cli.flags.debug) console.log(`Skipping ignored item: ${fullPath}`);
                continue;
            }

            // Skip the output directory or file
            if (fullPath === outputDir || entry.name === outputFileName) {
                if (cli.flags.debug) console.log(`Skipping output item: ${fullPath}`);
                continue;
            }

            if (entry.isDirectory()) {
                await processDirectory(fullPath); // Process subdirectories
                continue;
            }

            if (!entry.isFile()) continue;

            try {
                const stats = await fs.stat(fullPath);
                if (!options.includeAll && stats.size > thresholdBytes) {
                    skippedFiles++;
                    continue;
                }
                if (!options.includeAll && await isBinaryFile(fullPath)) {
                    skippedFiles++;
                    continue;
                }

                const content = await fs.readFile(fullPath, 'utf8');
                const relativePath = path.relative(directory, fullPath);
                output += `\n${'='.repeat(80)}\n`;
                output += `File: ${relativePath}\n`;
                output += `Size: ${formatFileSize(stats.size)}\n`;
                output += `${'='.repeat(80)}\n\n`;
                output += `${content}\n`;

                processedFiles++;
            } catch (error) {
                if (cli.flags.debug) console.error(`Error processing file ${entry.name}:`, error);
                skippedFiles++;
            }
        }
    }

    try {
        await processDirectory(directory);
        if (spinner) spinner.succeed(`Processed ${processedFiles} files (${skippedFiles} skipped)`);
        return output;
    } catch (error) {
        if (spinner) spinner.fail('Failed to process files');
        throw error;
    }
}

/**
 * Writes the processed content to an output file
 * @param {string} content - Content to write
 * @param {string} outputPath - Path to the output file
 */
export async function writeOutput(content, outputPath) {
    const spinner = ora('Writing output file...').start();
    try {
        await fs.writeFile(outputPath, content);
        spinner.succeed(`Output saved to ${chalk.green(outputPath)}`);
    } catch (error) {
        spinner.fail('Failed to write output file');
        throw error;
    }
}

/**
 * Main function
 */
export async function main() {
    try {
        const directory = process.cwd();
        const outputPath = cli.flags.output || 'output.txt';
        const content = await processFiles(directory, {
            threshold: cli.flags.threshold,
            includeAll: cli.flags.includeAll
        }, path.resolve(outputPath)); // Pass resolved output path
        if (!content) throw new Error('No content was generated');
        await writeOutput(content, outputPath);
    } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1); // Only exit in non-test environments
        } else {
            throw error; // Rethrow error for tests
        }
    }
}

if (process.env.NODE_ENV !== 'test') {
    main();
}
