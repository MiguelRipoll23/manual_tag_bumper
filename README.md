# manual_tag_bumper

Easily bump tags in your Git repository using the bump command.

**Compatibility:** npm, maven

## Installation

```bash
deno install --unstable --allow-run --allow-read -n bump https://deno.land/x/manual_tag_bumper/main.ts
```

## Demo

[![asciicast](https://asciinema.org/a/5PFzcyGY5RXMXLj7yG3ogiwvn.svg)](https://asciinema.org/a/5PFzcyGY5RXMXLj7yG3ogiwvn)

## Usage

Execute the `bump` command or add the following task to the `tasks.json` file
inside your `.vscode` directory:

```json
{
  "type": "shell",
  "command": "bump",
  "label": "bump"
}
```
