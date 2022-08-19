async function runCommand(
  command: string,
  args: string[] = [],
) {
  const { code, stdout, stderr } = await Deno.spawn(command, {
    args,
  });

  const output = new TextDecoder().decode(stdout);
  const errorOutput = new TextDecoder().decode(stderr);

  return { code, output, errorOutput };
}

export { runCommand };
