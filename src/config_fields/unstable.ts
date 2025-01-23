import { writeDenoConfigFile } from '../deno_config_file.ts'
import { runDenoCheck } from '../command.ts'
import type { KevinArguments } from '../kevin_arguments.ts'
import type { DenoConfigurationFileSchema } from '../deno_config_file_schema.ts'
import type { DenoConfigFieldToCheck } from '../config_field.ts'

export type DenoConfigurationFileSchemaWithUnstable =
  & Omit<DenoConfigurationFileSchema, 'unstable'>
  & Required<Pick<DenoConfigurationFileSchema, 'unstable'>>

export const DENO_CONFIG_UNSTABLE_TO_CHECK: DenoConfigFieldToCheck<
  DenoConfigurationFileSchemaWithUnstable
> = {
  field: 'unstable',
  isCheckFieldEnabled: (options) => options.isCheckUnstableEnabled,
  denoConfigFileHasField: denoConfigFileHasUnstableEntries,
  findRemovableEntries: findRemovableUnstableEntries,
  removeRemovableEntries: removeRemovableUnstableEntries,
}

function denoConfigFileHasUnstableEntries(
  config: DenoConfigurationFileSchema,
): config is DenoConfigurationFileSchemaWithUnstable {
  return config.unstable !== undefined &&
    Object.keys(config.unstable).length > 0
}

async function findRemovableUnstableEntries(
  testFilename: string,
  config: DenoConfigurationFileSchemaWithUnstable,
  kevinArguments: KevinArguments,
): Promise<Array<string>> {
  const removableUnstableEntries: Array<string> = []

  for (const unstable of config.unstable) {
    console.info(`Testing removal of unstable entry ${unstable}`)

    const currentConfig = structuredClone(config)
    currentConfig.unstable = currentConfig.unstable.filter((x) =>
      x !== unstable
    )

    await writeDenoConfigFile(testFilename, currentConfig, kevinArguments)

    console.log('Running deno check')
    const checkSuccess = await runDenoCheck(testFilename, kevinArguments)
    if (!checkSuccess) {
      console.info(`Unstable entry ${unstable} is required`)
      continue
    }

    console.info(`Unstable entry ${unstable} is not required, can be removed`)
    removableUnstableEntries.push(unstable)
  }

  return removableUnstableEntries
}

function removeRemovableUnstableEntries(
  config: DenoConfigurationFileSchemaWithUnstable,
  removableUnstableEntries: Array<string>,
): void {
  config.unstable = config.unstable.filter((x) =>
    !removableUnstableEntries.includes(x)
  )
}
