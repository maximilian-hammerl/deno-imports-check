import { writeDenoConfigFile } from '../deno_config_file.ts'
import { runDenoCheck } from '../command.ts'
import type { ConfigOptions } from '../config_options.ts'
import type { DenoConfigurationFileSchema } from '../deno_config_file_schema.ts'
import type { DenoConfigFieldToCheck } from '../main.ts'

export type DenoConfigurationFileSchemaWithUnstable =
  & Omit<DenoConfigurationFileSchema, 'unstable'>
  & Required<Pick<DenoConfigurationFileSchema, 'unstable'>>

export const DENO_CONFIG_UNSTABLE_TO_CHECK: DenoConfigFieldToCheck<
  DenoConfigurationFileSchemaWithUnstable
> = {
  field: 'unstable',
  isCheckFieldEnabled: (options) => options.isCheckUnstableEnabled,
  denoConfigFileHasField: denoConfigFileHasUnstable,
  findEntriesToRemove: findUnstableToRemove,
  removeRemovableEntries: removeRemovableUnstable,
}

function denoConfigFileHasUnstable(
  config: DenoConfigurationFileSchema,
): config is DenoConfigurationFileSchemaWithUnstable {
  return config.unstable !== undefined &&
    Object.keys(config.unstable).length > 0
}

async function findUnstableToRemove(
  testFilename: string,
  config: DenoConfigurationFileSchemaWithUnstable,
  options: ConfigOptions,
): Promise<Array<string>> {
  const importsToRemove: Array<string> = []

  for (const key of Object.keys(config.unstable)) {
    console.info(`Testing removal of unstable ${key}`)

    const currentConfig = structuredClone(config)
    currentConfig.unstable = currentConfig.unstable.filter((x) => x !== key)

    await writeDenoConfigFile(testFilename, currentConfig, options)

    console.log('Running deno check')
    const checkSuccess = await runDenoCheck(testFilename, options)
    if (!checkSuccess) {
      console.info(`Unstable ${key} is required`)
      continue
    }

    console.info(`Unstable ${key} is not required, can be removed`)
    importsToRemove.push(key)
  }

  return importsToRemove
}

function removeRemovableUnstable(
  config: DenoConfigurationFileSchemaWithUnstable,
  unstableToRemove: Array<string>,
): void {
  config.unstable = config.unstable.filter((x) => !unstableToRemove.includes(x))
}
