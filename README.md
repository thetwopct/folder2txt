# folder2txt

Convert local folder contents into a single text file with ease. This CLI tool processes all files in a folder and concatenates their contents into a single text file, making it perfect for analysis, documentation, or AI training purposes.

## Features

- 📁 Process files in any local folder
- 📝 Convert folder contents to a single text file
- ⚡ Automatic binary file exclusion
- 🔧 Configurable file size threshold
- 💻 Cross-platform support (Windows, macOS, Linux)

## Installation

Install globally via npm:

```sh
npm install --global folder2txt
```

then navigate to the folder you want to convert to a txt file, and run:

```sh
$ folder2txt
```

## Options

```sh
--output, -o     Specify output file path (default: output.txt)
--threshold, -t  Set file size threshold in MB (default: 0.1)
--include-all    Include all files regardless of size or type
--debug         Enable debug mode with verbose logging
--help          Show help
--version       Show version
```

## Default Behavior

- Files larger than 100KB are excluded by default
- Binary files are automatically excluded
- The output file is created in the current directory and named output.txt
- Files are processed recursively through all subdirectories (excluding the output file’s directory, node_modules, vendor, .lock files and .git)
- File paths and contents are separated by clear markers
- Relative paths are preserved in the output

## Output Format

The tool generates a text file with this format:

```txt
================================================================================
File: path/to/file.txt
Size: 1.2 KB
================================================================================

[File contents here]

================================================================================
File: another/file.js
Size: 4.5 KB
================================================================================

[File contents here]
```

## Install folder2txt

1. Using terminal or another CLI, download from npm and install as a global package - `npm install -g folder2txt`
2. Using terminal or another CLI, navigate to the folder  you want to copy in to a text file.
3. Run `folder2txt`.

## Update folder2txt

To update to the latest version you can just run the install command again - `npm install -g folder2txt`

## Feedback and issues

Please open an issue in the [GitHub repo](https://github.com/thetwopct/folder2txt/issues). Thanks.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

folder2txt is based on git2txt by Addy Osmani and retains the original MIT License.

## Changelog

1.0.2
Fixed Windows compatibility - thanks to @darthwalsh

1.0.1
Adds more ignored files and folders

1.0.0
Initial release