import { writeDenoConfigFile } from '../deno_config_file.ts'
import { runDenoCheck } from '../command.ts'
import type { ConfigOptions } from '../config_options.ts'
import type { DenoConfigurationFileSchema } from '../deno_config_file_schema.ts'
import type { DenoConfigFieldToCheck } from '../main.ts'

export type DenoConfigurationFileSchemaWithImports =
  & Omit<DenoConfigurationFileSchema, 'imports'>
  & Required<Pick<DenoConfigurationFileSchema, 'imports'>>

export const DENO_CONFIG_IMPORTS_TO_CHECK: DenoConfigFieldToCheck<
  DenoConfigurationFileSchemaWithImports
> = {
  field: 'imports',
  isCheckFieldEnabled: (options) => options.isCheckImportsEnabled,
  denoConfigFileHasField: denoConfigFileHasImports,
  findEntriesToRemove: findImportsToRemove,
  removeRemovableEntries: removeRemovableImports,
}

function denoConfigFileHasImports(
  config: DenoConfigurationFileSchema,
): config is DenoConfigurationFileSchemaWithImports {
  return config.imports !== undefined && Object.keys(config.imports).length > 0
}

async function findImportsToRemove(
  testFilename: string,
  config: DenoConfigurationFileSchemaWithImports,
  options: ConfigOptions,
): Promise<Array<string>> {
  const importsToRemove: Array<string> = []

  for (const key of Object.keys(config.imports)) {
    console.info(`Testing removal of import ${key}`)

    const currentConfig = structuredClone(config)
    delete currentConfig.imports[key]

    await writeDenoConfigFile(testFilename, currentConfig, options)

    console.log('Running deno check')
    const checkSuccess = await runDenoCheck(testFilename, options)
    if (!checkSuccess) {
      console.info(`Import ${key} is required`)
      continue
    }

    console.info(`Import ${key} is not required, can be removed`)
    importsToRemove.push(key)
  }

  return importsToRemove
}

function removeRemovableImports(
  config: DenoConfigurationFileSchemaWithImports,
  importsToRemove: Array<string>,
): void {
  config.imports = Object.fromEntries(
    Object.entries((config as DenoConfigurationFileSchemaWithImports).imports)
      .filter(([key]) => !importsToRemove.includes(key)),
  )
}
