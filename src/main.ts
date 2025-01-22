import { readDenoConfigFile, writeDenoConfigFile } from './deno_config_file.ts'
import { type ConfigOptions, getConfigOptions } from './config_options.ts'
import type { DenoConfigurationFileSchema } from './deno_config_file_schema.ts'
import { DENO_CONFIG_IMPORTS_TO_CHECK } from './config_fields/imports.ts'
import { DENO_CONFIG_UNSTABLE_TO_CHECK } from './config_fields/unstable.ts'
import { checkHasUncommittedChanges } from './command.ts'

export type DenoConfigFieldToCheck<
  FileSchemaWithField extends DenoConfigurationFileSchema,
> = {
  field: string
  isCheckFieldEnabled: (options: ConfigOptions) => boolean
  denoConfigFileHasField: (
    config: DenoConfigurationFileSchema,
  ) => config is FileSchemaWithField
  findRemovableEntries: (
    testFilename: string,
    config: FileSchemaWithField,
    options: ConfigOptions,
  ) => Promise<Array<string>>
  removeRemovableEntries: (
    config: FileSchemaWithField,
    removableEntries: Array<string>,
  ) => void
}

async function checkDenoConfigField<
  FileSchemaWithField extends DenoConfigurationFileSchema,
>(
  {
    field,
    isCheckFieldEnabled,
    denoConfigFileHasField,
    findRemovableEntries,
    removeRemovableEntries,
  }: DenoConfigFieldToCheck<FileSchemaWithField>,
  testFilename: string,
  config: DenoConfigurationFileSchema,
  options: ConfigOptions,
): Promise<boolean> {
  if (!isCheckFieldEnabled(options)) {
    console.info(`Checking ${field} field disabled`)
    return false
  }

  if (!denoConfigFileHasField(config)) {
    console.info(`No ${field} field or entries found`)
    return false
  }

  console.info(`Testing removal of ${field} entries`)
  const removableEntries = await findRemovableEntries(
    testFilename,
    config,
    options,
  )

  if (removableEntries.length === 0) {
    console.info(`Found no removable ${field} entries`)
    return false
  }

  console.info(`Found ${removableEntries.length} removable ${field} entries`)
  for (const key of removableEntries) {
    console.info(`  ${key}`)
  }

  removeRemovableEntries(config, removableEntries)
  return true
}

async function main() {
  const options = getConfigOptions()

  if (options.isDebug) {
    console.debug('Config options', options)
  }

  if (options.isGitEnabled) {
    if ((await checkHasUncommittedChanges(options))) {
      console.warn('Uncommitted changes found, exiting')
      return
    }
  }

  const { filename, config } = await readDenoConfigFile(options)

  const testFilename = `test.${filename}`

  const foundRemovableImportEntries = await checkDenoConfigField(
    DENO_CONFIG_IMPORTS_TO_CHECK,
    testFilename,
    config,
    options,
  )

  const foundRemovableUnstableEntries = await checkDenoConfigField(
    DENO_CONFIG_UNSTABLE_TO_CHECK,
    testFilename,
    config,
    options,
  )

  const foundConfigToRemove = foundRemovableImportEntries ||
    foundRemovableUnstableEntries

  await Deno.remove(testFilename)

  if (options.isOverwriteDenoConfigFileEnabled) {
    if (foundConfigToRemove) {
      console.info(`Found entries to remove, overwriting ${filename}`)
      await writeDenoConfigFile(filename, config, options)
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
