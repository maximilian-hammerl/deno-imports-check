import { readDenoConfigFile, writeDenoConfigFile } from './deno_config_file.ts'
import { type ConfigOptions, getConfigOptions } from './config_options.ts'
import type { DenoConfigurationFileSchema } from './deno_config_file_schema.ts'
import { DENO_CONFIG_IMPORTS_TO_CHECK } from './config_fields/imports.ts'
import { DENO_CONFIG_UNSTABLE_TO_CHECK } from './config_fields/unstable.ts'

export type DenoConfigFieldToCheck<
  FileSchemaWithField extends DenoConfigurationFileSchema,
> = {
  field: string
  isCheckFieldEnabled: (options: ConfigOptions) => boolean
  denoConfigFileHasField: (
    config: DenoConfigurationFileSchema,
  ) => config is FileSchemaWithField
  findEntriesToRemove: (
    testFilename: string,
    config: FileSchemaWithField,
    options: ConfigOptions,
  ) => Promise<Array<string>>
  removeRemovableEntries: (
    config: FileSchemaWithField,
    entriesToRemove: Array<string>,
  ) => void
}

async function checkDenoConfigField<
  FileSchemaWithField extends DenoConfigurationFileSchema,
>(
  {
    field,
    isCheckFieldEnabled,
    denoConfigFileHasField,
    findEntriesToRemove,
    removeRemovableEntries,
  }: DenoConfigFieldToCheck<FileSchemaWithField>,
  testFilename: string,
  config: DenoConfigurationFileSchema,
  options: ConfigOptions,
): Promise<boolean> {
  if (!isCheckFieldEnabled(options)) {
    console.info(`Checking ${field} disabled`)
    return false
  }

  if (!denoConfigFileHasField(config)) {
    console.info(`No ${field} found`)
    return false
  }

  console.info(`Testing removal of ${field}`)
  const entriesToRemove = await findEntriesToRemove(
    testFilename,
    config,
    options,
  )

  if (entriesToRemove.length === 0) {
    console.info(`Found no ${field} to remove`)
    return false
  }

  console.info(`Found ${entriesToRemove.length} ${field} to remove`)
  for (const key of entriesToRemove) {
    console.info(`  ${key}`)
  }

  removeRemovableEntries(config, entriesToRemove)
  return true
}

async function main() {
  const options = getConfigOptions()

  if (options.isDebug) {
    console.debug('Config options', options)
  }

  const { filename, config } = await readDenoConfigFile(options)

  const testFilename = `test.${filename}`

  const foundImportsToRemove = await checkDenoConfigField(
    DENO_CONFIG_IMPORTS_TO_CHECK,
    testFilename,
    config,
    options,
  )

  const foundUnstableToRemove = await checkDenoConfigField(
    DENO_CONFIG_UNSTABLE_TO_CHECK,
    testFilename,
    config,
    options,
  )

  const foundConfigToRemove = foundImportsToRemove || foundUnstableToRemove

  await Deno.remove(testFilename)

  if (options.isOverwriteDenoConfigFileEnabled) {
    if (foundConfigToRemove) {
      console.info(`Found config to remove, overwriting ${filename}`)
      await writeDenoConfigFile(filename, config, options)
    } else {
      console.info(`Found no config to remove, not overwriting ${filename}`)
    }
  } else {
    if (foundConfigToRemove) {
      console.info('Found config to remove')
    } else {
      console.info('Found no config to remove')
    }
  }
}

if (import.meta.main) {
  await main()
}
