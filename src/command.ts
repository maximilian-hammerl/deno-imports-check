import type { ConfigOptions } from './config_options.ts'

async function runCommand(
  command: Deno.Command,
  { isDebug }: ConfigOptions,
): Promise<boolean> {
  try {
    const { code, stdout, stderr } = await command.output()

    if (isDebug) {
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
  options: ConfigOptions,
): Promise<boolean> {
  const denoCheckCommand = new Deno.Command(Deno.execPath(), {
    args: ['check', '--config', configFilename, '**/*.ts'],
  })

  return await runCommand(
    denoCheckCommand,
    options,
  )
}

export async function restoreFiles(
  options: ConfigOptions,
): Promise<void> {
  const gitRestoreCommand = new Deno.Command('git', {
    args: ['restore', '--quiet', '.'],
  })

  const success = await runCommand(
    gitRestoreCommand,
    options,
  )

  if (!success) {
    throw new Error('Failed to restore files')
  }
}

export async function checkHasUncommittedChanges(
  options: ConfigOptions,
): Promise<boolean> {
  const gitDiffCommand = new Deno.Command('git', {
    args: ['diff', '--quiet'],
  })

  const success = await runCommand(
    gitDiffCommand,
    options,
  )
  // Success means no uncommitted changes
  return !success
}
