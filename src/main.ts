import { readDenoConfigFile, writeDenoConfigFile } from './deno_config_file.ts'
import { getKevinArguments } from './kevin_arguments.ts'
import { DENO_CONFIG_IMPORTS_TO_CHECK } from './config_fields/imports.ts'
import { DENO_CONFIG_UNSTABLE_TO_CHECK } from './config_fields/unstable.ts'
import { checkHasUncommittedChanges } from './command.ts'
import { checkDenoConfigField } from './config_field.ts'

async function main() {
  const kevinArguments = getKevinArguments()

  if (kevinArguments.isDebug) {
    console.debug('CLI arguments', kevinArguments)
  }

  if (kevinArguments.isGitEnabled) {
    if ((await checkHasUncommittedChanges(kevinArguments))) {
      console.warn(
        'Uncommitted changes found, exiting (check can be disabled with --no-git)',
      )
      return
    }
  }

  const { filename, config } = await readDenoConfigFile(kevinArguments)

  const testFilename = `test.${filename}`

  const foundRemovableImportEntries = await checkDenoConfigField(
    DENO_CONFIG_IMPORTS_TO_CHECK,
    testFilename,
    config,
    kevinArguments,
  )

  const foundRemovableUnstableEntries = await checkDenoConfigField(
    DENO_CONFIG_UNSTABLE_TO_CHECK,
    testFilename,
    config,
    kevinArguments,
  )

  const foundConfigToRemove = foundRemovableImportEntries ||
    foundRemovableUnstableEntries

  await Deno.remove(testFilename)

  if (kevinArguments.isOverwriteDenoConfigFileEnabled) {
    if (foundConfigToRemove) {
      console.info(`Found entries to remove, overwriting ${filename}`)
      await writeDenoConfigFile(filename, config, kevinArguments)
    } else {
      console.info(`Found no entries to remove, not overwriting ${filename}`)
    }
  } else {
    if (foundConfigToRemove) {
      console.info('Found entries to remove')
    } else {
      console.info('Found no entries to remove')
    }
  }
}

if (import.meta.main) {
  await main()
}
