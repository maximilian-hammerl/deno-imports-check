import { writeDenoConfigFile } from '../deno_config_file.ts'
import { runDenoCheck } from '../command.ts'
import type { KevinArguments } from '../kevin_arguments.ts'
import type { DenoConfigurationFileSchema } from '../deno_config_file_schema.ts'
import type { DenoConfigFieldToCheck } from '../config_field.ts'

export type DenoConfigurationFileSchemaWithImports =
  & Omit<DenoConfigurationFileSchema, 'imports'>
  & Required<Pick<DenoConfigurationFileSchema, 'imports'>>

export const DENO_CONFIG_IMPORTS_TO_CHECK: DenoConfigFieldToCheck<
  DenoConfigurationFileSchemaWithImports
> = {
  field: 'imports',
  isCheckFieldEnabled: (options) => options.isCheckImportsEnabled,
  denoConfigFileHasField: denoConfigFileHasImportEntries,
  findRemovableEntries: findRemovableImportEntries,
  removeRemovableEntries: removeRemovableImportEntries,
}

function denoConfigFileHasImportEntries(
  config: DenoConfigurationFileSchema,
): config is DenoConfigurationFileSchemaWithImports {
  return config.imports !== undefined && Object.keys(config.imports).length > 0
}

async function findRemovableImportEntries(
  testFilename: string,
  config: DenoConfigurationFileSchemaWithImports,
  kevinArguments: KevinArguments,
): Promise<Array<string>> {
  const removableImportEntries: Array<string> = []

  for (const key of Object.keys(config.imports)) {
    console.info(`Testing removal of imports entry ${key}`)

    const currentConfig = structuredClone(config)
    delete currentConfig.imports[key]

    await writeDenoConfigFile(testFilename, currentConfig, kevinArguments)

    console.log('Running deno check')
    const checkSuccess = await runDenoCheck(testFilename, kevinArguments)
    if (!checkSuccess) {
      console.info(`Imports entry ${key} is required`)
      continue
    }

    console.info(`Imports entry ${key} is not required, can be removed`)
    removableImportEntries.push(key)
  }

  return removableImportEntries
}

function removeRemovableImportEntries(
  config: DenoConfigurationFileSchemaWithImports,
  removableImportEntries: Array<string>,
): void {
  config.imports = Object.fromEntries(
    Object.entries((config as DenoConfigurationFileSchemaWithImports).imports)
      .filter(([key]) => !removableImportEntries.includes(key)),
  )
}
