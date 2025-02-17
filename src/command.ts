import log from './log.ts'

async function runCommand(
  command: Deno.Command,
): Promise<boolean> {
  try {
    const { code, stdout, stderr } = await command.output()

    log.debug(`Code is ${code} (${code === 0 ? 'success' : 'failure'})`, {
      stout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    })

    return code === 0
  } catch (error) {
    throw new Error(`Error running command: ${error}`)
  }
}

export async function runDenoCheck(
  configFilename: string,
): Promise<boolean> {
  const denoCheckCommand = new Deno.Command(Deno.execPath(), {
    args: ['check', '--config', configFilename, '**/*.ts'],
  })

  return await runCommand(
    denoCheckCommand,
  )
}

export async function restoreFiles(): Promise<void> {
  const gitRestoreCommand = new Deno.Command('git', {
    args: ['restore', '--quiet', '.'],
  })

  const success = await runCommand(
    gitRestoreCommand,
  )

  if (!success) {
    throw new Error('Failed to restore files')
  }
}

export async function checkHasUncommittedChanges(): Promise<boolean> {
  const gitDiffCommand = new Deno.Command('git', {
    args: ['diff', '--quiet'],
  })

  const success = await runCommand(
    gitDiffCommand,
  )
  // Success means no uncommitted changes
  return !success
}
