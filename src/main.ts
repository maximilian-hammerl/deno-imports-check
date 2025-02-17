import { readDenoConfigFile, writeDenoConfigFile } from './deno_config_file.ts'
import { DENO_CONFIG_IMPORTS_TO_CHECK } from './config_fields/imports.ts'
import { DENO_CONFIG_UNSTABLE_TO_CHECK } from './config_fields/unstable.ts'
import { checkHasUncommittedChanges } from './command.ts'
import { checkDenoConfigField } from './config_field.ts'
import log from './log.ts'
import { KEVIN_ARGUMENTS } from './kevin_arguments.ts'

async function main() {
  log.debug('CLI arguments', KEVIN_ARGUMENTS)

  if (KEVIN_ARGUMENTS.isGitEnabled) {
    if ((await checkHasUncommittedChanges())) {
      console.warn(
        'Uncommitted changes found, exiting (check can be disabled with --no-git)',
      )
      return
    }
  }

  const { filename, config } = await readDenoConfigFile()

  const testFilename = `test.${filename}`

  const foundRemovableImportEntries = await checkDenoConfigField(
    DENO_CONFIG_IMPORTS_TO_CHECK,
    testFilename,
    config,
  )

  const foundRemovableUnstableEntries = await checkDenoConfigField(
    DENO_CONFIG_UNSTABLE_TO_CHECK,
    testFilename,
    config,
  )

  const foundConfigToRemove = foundRemovableImportEntries ||
    foundRemovableUnstableEntries

  try {
    await Deno.remove(testFilename)
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error
    }
  }

  if (KEVIN_ARGUMENTS.isOverwriteDenoConfigFileEnabled) {
    if (foundConfigToRemove) {
      console.info(`Found entries to remove, overwriting ${filename}`)
      await writeDenoConfigFile(filename, config)
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
