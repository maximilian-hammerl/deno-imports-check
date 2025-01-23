import type { KevinArguments } from './kevin_arguments.ts'

async function runCommand(
  command: Deno.Command,
  kevinArguments: KevinArguments,
): Promise<boolean> {
  try {
    const { code, stdout, stderr } = await command.output()

    if (kevinArguments.isDebug) {
      console.debug(`Code is ${code} (${code === 0 ? 'success' : 'failure'})`, {
        stout: new TextDecoder().decode(stdout),
        stderr: new TextDecoder().decode(stderr),
      })
    }

    return code === 0
  } catch (error) {
    throw new Error(`Error running command: ${error}`)
  }
}

export async function runDenoCheck(
  configFilename: string,
  kevinArguments: KevinArguments,
): Promise<boolean> {
  const denoCheckCommand = new Deno.Command(Deno.execPath(), {
    args: ['check', '--config', configFilename, '**/*.ts'],
  })

  return await runCommand(
    denoCheckCommand,
    kevinArguments,
  )
}

export async function restoreFiles(
  kevinArguments: KevinArguments,
): Promise<void> {
  const gitRestoreCommand = new Deno.Command('git', {
    args: ['restore', '--quiet', '.'],
  })

  const success = await runCommand(
    gitRestoreCommand,
    kevinArguments,
  )

  if (!success) {
    throw new Error('Failed to restore files')
  }
}

export async function checkHasUncommittedChanges(
  kevinArguments: KevinArguments,
): Promise<boolean> {
  const gitDiffCommand = new Deno.Command('git', {
    args: ['diff', '--quiet'],
  })

  const success = await runCommand(
    gitDiffCommand,
    kevinArguments,
  )
  // Success means no uncommitted changes
  return !success
}
