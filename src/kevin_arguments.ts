import { parseArgs } from '@std/cli/parse-args'

export type KevinArguments = {
  isOverwriteDenoConfigFileEnabled: boolean
  isDebug: boolean
  isQuiet: boolean
  isCheckImportsEnabled: boolean
  isCheckUnstableEnabled: boolean
  isGitEnabled: boolean
}

const parsedArgs = parseArgs(Deno.args, {
  boolean: [
    'overwrite',
    'debug',
    'quiet',
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
    quiet: false,
    'check-imports': true,
    'check-unstable': true,
    git: true,
  },
})

export const KEVIN_ARGUMENTS: KevinArguments = {
  isOverwriteDenoConfigFileEnabled: parsedArgs.overwrite,
  isDebug: parsedArgs.debug,
  isQuiet: parsedArgs.quiet,
  isCheckImportsEnabled: parsedArgs['check-imports'],
  isCheckUnstableEnabled: parsedArgs['check-unstable'],
  isGitEnabled: parsedArgs.git,
}
