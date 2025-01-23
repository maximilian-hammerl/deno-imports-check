import { parse } from '@std/jsonc'
import type { DenoConfigurationFileSchema } from './deno_config_file_schema.ts'
import type { KevinArguments } from './kevin_arguments.ts'

const DENO_CONFIG_FILENAMES = ['deno.jsonc', 'deno.json', 'import_map.json']

export async function readDenoConfigFile(options: KevinArguments): Promise<{
  filename: string
  config: DenoConfigurationFileSchema
}> {
  for (const filename of DENO_CONFIG_FILENAMES) {
    if (options.isDebug) {
      console.debug(`Trying to read deno config file ${filename}`)
    }

    let content: string
    try {
      content = await Deno.readTextFile(filename)
      if (options.isDebug) {
        console.debug(`Read ${filename} successfully`)
      }
    } catch (_error) {
      if (options.isDebug) {
        console.debug(`Failed to read ${filename}, continuing`)
      }
      continue
    }

    if (options.isDebug) {
      console.debug(`Trying to parse ${filename}`)
    }

    try {
      const config = parse(content) as DenoConfigurationFileSchema
      if (options.isDebug) {
        console.debug(`Parsed ${filename} successfully`)
      }
      return {
        filename,
        config,
      }
    } catch (error) {
      throw new Error(`Failed to parse config of ${filename}: ${error}`)
    }
  }

  throw new Error(
    `Failed to find Deno config file (looked for ${DENO_CONFIG_FILENAMES})`,
  )
}

export async function writeDenoConfigFile(
  filename: string,
  config: DenoConfigurationFileSchema,
  kevinArguments: KevinArguments,
): Promise<void> {
  if (kevinArguments.isDebug) {
    console.debug(`Trying to write deno config file ${filename}`)
  }

  let content: string
  try {
    content = JSON.stringify(config, null, 2)
  } catch (error) {
    throw new Error(`Failed to stringify config for ${filename}: ${error}`)
  }

  try {
    await Deno.writeTextFile(filename, content)
  } catch (error) {
    throw new Error(`Failed to write ${filename}: ${error}`)
  }
}
