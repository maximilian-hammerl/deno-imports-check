import type { DenoConfigurationFileSchema } from './deno_config_file_schema.ts'
import type { KevinArguments } from './kevin_arguments.ts'

export type DenoConfigFieldToCheck<
  FileSchemaWithField extends DenoConfigurationFileSchema,
> = {
  field: string
  isCheckFieldEnabled: (options: KevinArguments) => boolean
  denoConfigFileHasField: (
    config: DenoConfigurationFileSchema,
  ) => config is FileSchemaWithField
  findRemovableEntries: (
    testFilename: string,
    config: FileSchemaWithField,
    kevinArguments: KevinArguments,
  ) => Promise<Array<string>>
  removeRemovableEntries: (
    config: FileSchemaWithField,
    removableEntries: Array<string>,
  ) => void
}

export async function checkDenoConfigField<
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
  kevinArguments: KevinArguments,
): Promise<boolean> {
  if (!isCheckFieldEnabled(kevinArguments)) {
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
    kevinArguments,
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
