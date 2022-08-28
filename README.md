# manual_tag_bumper

Easily bump tags in your Git repository using the bump command.

**Compatibility:** npm, maven

## Installation

```bash
deno install --unstable --allow-run --allow-read -n bump https://deno.land/x/manual_tag_bumper/main.ts
```

## Features

- Create your tags easily and fast with the help of an extra option appearing at
  the top to easily bump to a new prerelease or migrate from prerelease to
  stable

- Use custom prerelease identifiers provided by you or regular ones like alpha
  and beta

- Create a branch, update and commit version files (package.json, pom.xml)
  automatically

## Demo

[![asciicast](https://asciinema.org/a/ySPtT2lfEa08yrMP59nH9dYpl.svg)](https://asciinema.org/a/ySPtT2lfEa08yrMP59nH9dYpl)

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
