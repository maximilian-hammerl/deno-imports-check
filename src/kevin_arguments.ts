import { parseArgs } from '@std/cli/parse-args'

export type KevinArguments = {
  isOverwriteDenoConfigFileEnabled: boolean
  isDebug: boolean
  isCheckImportsEnabled: boolean
  isCheckUnstableEnabled: boolean
  isGitEnabled: boolean
}

export function getKevinArguments(): KevinArguments {
  const parsedArgs = parseArgs(Deno.args, {
    boolean: [
      'overwrite',
      'debug',
      'check-imports',
      'check-unstable',
      'git',
    ],
    negatable: [
      'check-imports',
      'check-unstable',
      'git',
    ],
    default: {
      overwrite: false,
      debug: false,
      'check-imports': true,
      'check-unstable': true,
      git: true,
    },
  })

  return {
    isOverwriteDenoConfigFileEnabled: parsedArgs.overwrite,
    isDebug: parsedArgs.debug,
    isCheckImportsEnabled: parsedArgs['check-imports'],
    isCheckUnstableEnabled: parsedArgs['check-unstable'],
    isGitEnabled: parsedArgs.git,
  }
}
