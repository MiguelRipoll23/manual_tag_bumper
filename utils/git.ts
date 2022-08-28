import * as constants from "../constants.ts";
import { colors } from "../deps.ts";
import { runCommand } from "./shell.ts";

async function getStatus(log = false) {
  const { code, output, errorOutput } = await runCommand(
    constants.GIT_COMMAND,
    [
      constants.GIT_COMMAND_ARGUMENT_STATUS,
      constants.GIT_COMMAND_ARGUMENT_UNO,
    ],
    log,
  );

  if (code !== 0) {
    throw new Error(errorOutput);
  }

  // Staged
  let staged = false;

  if (output.includes(constants.GIT_CHANGES_NOT_STAGED) == false) {
    staged = true;
  }

  // Remote
  let remote = false;

  if (output.includes(constants.GIT_ORIGIN)) {
    remote = true;
  }

  // Updated
  let updated = false;

  if (remote === false || output.includes(constants.GIT_BRANCH_UP_TO_DATE)) {
    updated = true;
  }

  return {
    staged,
    remote,
    updated,
  };
}

async function getLatestTagFromRemote() {
  const { code, output, errorOutput } = await runCommand(
    constants.GIT_COMMAND,
    [
      constants.GIT_COMMAND_ARGUMENT_LS_REMOTE,
      constants.GIT_COMMAND_ARGUMENT_TAGS,
      constants.GIT_COMMAND_ARGUMENT_SORT_DESC_V_REFNAME,
      constants.GIT_COMMAND_ARGUMENT_ORIGIN,
    ],
    true,
  );

  if (code !== 0) {
    throw new Error(errorOutput);
  }

  const lines = output.split("\n");

  for (const line of lines) {
    const [sha, ref] = line.split("\t");

    if (sha === undefined || ref === undefined) {
      continue;
    }

    if (ref.startsWith(constants.GIT_TAGS_PREFIX) === false) {
      continue;
    }

    let tag = ref.replace(constants.GIT_TAGS_PREFIX, constants.TEXT_EMPTY);
    tag = tag.replace(
      constants.GIT_TAGS_SUFFIX,
      constants.TEXT_EMPTY,
    );

    return tag;
  }

  throw new Error(constants.TEXT_ERROR_NO_TAGS_FOUND);
}

async function getLatestTagFromLocal() {
  const { code, output, errorOutput } = await runCommand(
    constants.GIT_COMMAND,
    [
      constants.GIT_COMMAND_ARGUMENT_DESCRIBE,
      constants.GIT_COMMAND_ARGUMENT_TAGS,
      constants.GIT_COMMAND_ARGUMENT_ABBREV_0,
    ],
    true,
  );

  if (code === 0) {
    return output.trim();
  }

  if (
    errorOutput.includes(
      constants.GIT_ERROR_NO_NAMES_FOUND_CANNOT_DESCRIBE_ANYTHING,
    )
  ) {
    return constants.GIT_INITIAL_TAG_NAME;
  }

  console.error(errorOutput);
  Deno.exit(1);
}

async function switchToNewBranch(tagName: string) {
  console.info(
    `${constants.TEXT_BRANCH} ${
      colors.bold.yellow(constants.TEXT_ACTION_CREATING)
    }`,
  );

  await runCommand(constants.GIT_COMMAND, [
    constants.GIT_COMMAND_ARGUMENT_SWITCH,
    constants.GIT_COMMAND_ARGUMENT_C,
    tagName,
  ]);

  console.info(
    `${constants.TEXT_BRANCH} ${
      colors.bold.green(constants.TEXT_ACTION_CREATED)
    }`,
  );
}

async function createBumpCommit(targetVersion: string) {
  console.info(
    `${constants.TEXT_COMMIT} ${
      colors.bold.yellow(constants.TEXT_ACTION_CREATING)
    }`,
  );

  await runCommand(constants.GIT_COMMAND, [
    constants.GIT_COMMAND_ARGUMENT_ADD,
    constants.GIT_COMMAND_ARGUMENT_ADD_FILENAMES,
  ]);

  await runCommand(constants.GIT_COMMAND, [
    constants.GIT_COMMAND_ARGUMENT_COMMIT,
    constants.GIT_COMMAND_ARGUMENT_MESSAGE,
    `${targetVersion}`,
  ]);

  console.info(
    `${constants.TEXT_COMMIT} ${
      colors.bold.green(constants.TEXT_ACTION_CREATED)
    }`,
  );
}

async function pushCommit() {
  console.info(
    `${constants.TEXT_COMMIT} ${
      colors.bold.yellow(constants.TEXT_ACTION_PUSHING)
    }`,
  );

  const { code } = await runCommand(constants.GIT_COMMAND, [
    constants.GIT_COMMAND_ARGUMENT_PUSH,
    constants.GIT_COMMAND_ARGUMENT_ORIGIN,
  ]);

  if (code === 0) {
    console.info(
      `${constants.TEXT_COMMIT} ${
        colors.bold.green(constants.TEXT_ACTION_PUSHED)
      }`,
    );

    return;
  }

  console.info(
    `${constants.TEXT_COMMIT} ${colors.bold.red(constants.TEXT_ACTION_ERROR)}`,
  );
}

async function createTag(tagName: string) {
  console.info(constants.TEXT_EMPTY);

  console.info(
    `${constants.TEXT_TAG} ${
      colors.bold.yellow(constants.TEXT_ACTION_CREATING)
    }`,
  );

  const { code, errorOutput } = await runCommand(
    constants.GIT_COMMAND,
    [
      constants.GIT_COMMAND_ARGUMENT_TAG,
      tagName,
    ],
  );

  if (code === 0) {
    console.info(
      `${constants.TEXT_TAG} ${
        colors.bold.green(constants.TEXT_ACTION_CREATED)
      }`,
    );

    return true;
  }

  if (
    errorOutput.includes(
      constants.GIT_ERROR_FAILED_TO_RESOLVE_HEAD_AS_VALID_REF,
    )
  ) {
    console.error(
      `${constants.TEXT_TAG} ${colors.bold.red(constants.TEXT_ACTION_ERROR)} ${
        colors.bold.blue(constants.TEXT_ERROR_NO_COMMITS)
      }`,
    );
  } else if (errorOutput.includes(constants.GIT_ERROR_ALREADY_EXISTS)) {
    console.error(
      `${constants.TEXT_TAG} ${colors.bold.red(constants.TEXT_ACTION_ERROR)} ${
        colors.bold.blue(constants.TEXT_ERROR_TAG_ALREADY_EXISTS)
      }`,
    );
  }

  return false;
}

async function pushTag() {
  console.info(
    `${constants.TEXT_TAG} ${
      colors.bold.yellow(constants.TEXT_ACTION_PUSHING)
    }`,
  );

  const { code } = await runCommand(constants.GIT_COMMAND, [
    constants.GIT_COMMAND_ARGUMENT_PUSH,
    constants.GIT_COMMAND_ARGUMENT_TAGS,
    constants.GIT_COMMAND_ARGUMENT_ORIGIN,
  ]);

  if (code === 0) {
    console.info(
      `${constants.TEXT_TAG} ${
        colors.bold.green(constants.TEXT_ACTION_PUSHED)
      }`,
    );

    return;
  }

  console.info(
    `${constants.TEXT_TAG} ${colors.bold.red(constants.TEXT_ACTION_ERROR)}`,
  );
}

export {
  createBumpCommit,
  createTag,
  getLatestTagFromLocal,
  getLatestTagFromRemote,
  getStatus,
  switchToNewBranch,
};
