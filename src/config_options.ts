import { parseArgs } from '@std/cli/parse-args'

export type ConfigOptions = {
  isOverwriteDenoConfigFileEnabled: boolean
  isDebug: boolean
  isCheckImportsEnabled: boolean
  isCheckUnstableEnabled: boolean
}

export function getConfigOptions(): ConfigOptions {
  const parsedArgs = parseArgs(Deno.args, {
    boolean: ['overwrite', 'debug', 'check-imports', 'check-unstable'],
    negatable: ['check-imports', 'check-unstable'],
    default: {
      overwrite: false,
      debug: false,
      'check-imports': true,
      'check-unstable': true,
    },
  })

  return {
    isOverwriteDenoConfigFileEnabled: parsedArgs.overwrite,
    isDebug: parsedArgs.debug,
    isCheckImportsEnabled: parsedArgs['check-imports'],
    isCheckUnstableEnabled: parsedArgs['check-unstable'],
  }
}
