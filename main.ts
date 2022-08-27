import { colors, Confirm, Input, Select, SelectValueOptions } from "./deps.ts";
import { addExtraOptionsIfNecessary } from "./utils/options.ts";

import * as constants from "./constants.ts";
import * as git from "./utils/git.ts";
import * as version from "./utils/version.ts";
import * as files from "./utils/files.ts";

// Entry point
main();

async function main() {
  // Get status
  const { staged, remote, updated } = await git.getStatus(true);

  exitIfChangesUnstaged(staged);
  exitIfBranchOutdated(updated);

  // Get tag
  const { tagName, remoteError } = await getLatestTagAndSource(remote);
  const currentVersionKind = version.getKind(tagName);

  printTag(tagName, currentVersionKind, remoteError);

  // Ask kind
  const targetVersionKind = await askVersionKind(currentVersionKind);

  // Ask bump
  const newTagName = await askVersionBump(
    tagName,
    currentVersionKind,
    targetVersionKind,
  );

  // Confirm new tag
  const confirmed: boolean = await confirmTag(newTagName);

  if (confirmed === false) {
    main();
    return;
  }

  // Update version files
  await updateVersionFilesIfExists(newTagName, remote);

  // Create tag
  await git.createTag(newTagName);
}

function exitIfChangesUnstaged(staged: boolean) {
  if (staged) {
    return;
  }

  console.error(
    colors.bold.red(constants.TEXT_ERROR_CHANGES_UNSTAGED),
  );

  Deno.exit(-1);
}

function exitIfBranchOutdated(updated: boolean) {
  if (updated) {
    return;
  }

  console.error(
    colors.bold.red(constants.TEXT_ERROR_BRANCH_OUTDATED),
  );

  Deno.exit(-1);
}

async function getLatestTagAndSource(remote: boolean) {
  const result = {
    tagName: constants.TEXT_UNKNOWN,
    remoteError: false,
  };

  if (remote) {
    try {
      const remoteTag = await git.getLatestTagFromRemote();

      result.tagName = remoteTag;

      return result;
    } catch (_error) {
      result.remoteError = true;
    }
  }

  const localTag = await git.getLatestTagFromLocal();

  result.tagName = localTag;

  return result;
}

function printTag(
  tagName: string,
  currentVersionKind: string,
  remoteError: boolean,
) {
  let local = "";

  if (remoteError) {
    local = colors.bold.yellow(constants.TEXT_LOCAL);
  }

  console.info(constants.TEXT_EMPTY);

  console.info(
    colors.bold(constants.TEXT_LATEST_TAG),
  );

  console.info(
    colors.bold.blue(version.formatWithEmoji(tagName, currentVersionKind)),
    local,
  );

  console.info(constants.TEXT_EMPTY);
}

async function askVersionKind(currentVersionKind: string) {
  let kind = await Select.prompt({
    message: constants.TEXT_PICK_VERSION_KIND,
    options: [
      {
        name: `${constants.EMOJI_STABLE} ${constants.TEXT_STABLE}`,
        value: constants.TEXT_STABLE,
      },
      {
        name: `${constants.EMOJI_BETA} ${constants.TEXT_BETA}`,
        value: constants.TEXT_BETA,
      },
      {
        name: `${constants.EMOJI_ALPHA} ${constants.TEXT_ALPHA}`,
        value: constants.TEXT_ALPHA,
      },
      {
        name: `${constants.EMOJI_CUSTOM} ${constants.TEXT_CUSTOM}`,
        value: constants.TEXT_CUSTOM,
      },
    ],
  });

  if (kind === constants.TEXT_CUSTOM) {
    kind = await Input.prompt({
      message: constants.TEXT_PICK_VERSION_KIND,
      suggestions: [currentVersionKind],
    });
  }

  return kind;
}

async function askVersionBump(
  tagName: string,
  currentVersionKind: string,
  targetVersionKind: string,
) {
  const majorVersion = version.getMajor(tagName, targetVersionKind);
  const minorVersion = version.getMinor(tagName, targetVersionKind);
  const patchVersion = version.getPatch(tagName, targetVersionKind);

  const bumpOptions: SelectValueOptions = [
    {
      name: `${constants.EMOJI_MAJOR} ${constants.TEXT_MAJOR} (${
        colors.bold.yellow(majorVersion)
      })`,
      value: majorVersion,
    },
    {
      name: `${constants.EMOJI_MINOR} ${constants.TEXT_MINOR} (${
        colors.bold.yellow(minorVersion)
      })`,
      value: minorVersion,
    },
    {
      name: `${constants.EMOJI_PATCH} ${constants.TEXT_PATCH} (${
        colors.bold.yellow(patchVersion)
      })`,
      value: patchVersion,
    },
  ];

  addExtraOptionsIfNecessary(
    bumpOptions,
    tagName,
    currentVersionKind,
    targetVersionKind,
  );

  return await Select.prompt({
    message: constants.TEXT_PICK_VERSION_BUMP,
    options: bumpOptions,
  });
}

async function confirmTag(newTagName: string) {
  const promptResponse = await Confirm.prompt(
    `${constants.TEXT_CONFIRM_VERSION} ${colors.yellow(newTagName)}`,
  );

  console.info(constants.TEXT_EMPTY);

  return promptResponse;
}

async function updateVersionFilesIfExists(newTagName: string, remote: boolean) {
  // Check if changes pending
  const { staged, updated } = await git.getStatus();

  exitIfChangesUnstaged(staged);
  exitIfBranchOutdated(updated);

  newTagName = newTagName.replace(/^v/, constants.TEXT_EMPTY);

  const filesChanged = await files.updateVersionFiles(newTagName);

  if (filesChanged > 0) {
    await git.createBumpCommit(newTagName);
  }
}
