import { parse } from '@std/jsonc'
import { parseArgs } from '@std/cli/parse-args'
import type { DenoConfigurationFileSchema } from './deno_config_file_schema.ts'

type DenoConfigurationFileSchemaWithImports =
  & Omit<DenoConfigurationFileSchema, 'imports'>
  & Required<Pick<DenoConfigurationFileSchema, 'imports'>>

async function runCommand(command: Deno.Command): Promise<boolean> {
  try {
    const { code, stdout, stderr } = await command.output()
    console.log(`Code is ${code} (${code === 0 ? 'success' : 'failure'})`, {
      stout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    })
    return code === 0
  } catch (error) {
    throw new Error(`Error running command: ${error}`)
  }
}

const DENO_CONFIG_FILENAMES = ['deno.jsonc', 'deno.json', 'import_map.json']

async function readDenoConfigFile(): Promise<{
  filename: string
  config: DenoConfigurationFileSchema
}> {
  for (const filename of DENO_CONFIG_FILENAMES) {
    let content: string
    try {
      content = await Deno.readTextFile(filename)
    } catch (_error) {
      continue
    }

    try {
      return {
        filename,
        config: parse(content) as DenoConfigurationFileSchema,
      }
    } catch (error) {
      throw new Error(`Failed to parse config of ${filename}: ${error}`)
    }
  }

  throw new Error(
    `Failed to find Deno config file (looked for ${DENO_CONFIG_FILENAMES})`,
  )
}

async function writeDenoConfigFile(
  filename: string,
  config: DenoConfigurationFileSchema,
): Promise<void> {
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

function denoConfigFileHasImports(
  config: DenoConfigurationFileSchema,
): config is DenoConfigurationFileSchemaWithImports {
  return config.imports !== undefined && Object.keys(config.imports).length > 0
}

async function main() {
  const {
    write: writeDenoConfigFileFile,
  } = parseArgs(Deno.args, {
    boolean: ['write'],
  })

  const { filename, config } = await readDenoConfigFile()

  if (!denoConfigFileHasImports(config)) {
    throw new Error(`No or empty imports in ${filename}`)
  }

  const testFilename = `test.${filename}`

  const importsToRemove: Array<string> = []

  for (const key of Object.keys(config.imports)) {
    console.info(`Testing removal of import ${key}`)

    const currentConfig = structuredClone(config)
    delete currentConfig.imports[key]

    await writeDenoConfigFile(testFilename, currentConfig)

    console.log('Running deno check')
    const checkSuccess = await runCommand(
      new Deno.Command(Deno.execPath(), {
        args: ['check', '--config', testFilename, '**/*.ts'],
      }),
    )
    if (!checkSuccess) {
      console.info(`Import ${key} is required`)
      continue
    }

    console.info(`Import ${key} is not required, can be removed`)
    importsToRemove.push(key)
  }

  await Deno.remove(testFilename)

  if (importsToRemove.length > 0) {
    console.info(`Found ${importsToRemove.length} imports to remove`)
    for (const key of importsToRemove) {
      console.info(`  ${key}`)
    }

    if (writeDenoConfigFileFile) {
      config.imports = Object.fromEntries(
        Object.entries(config.imports).filter(([key]) =>
          !importsToRemove.includes(key)
        ),
      )
      await writeDenoConfigFile(filename, config)
      console.info(`Wrote ${filename}`)
    }
  } else {
    console.info('Found no imports to remove')
  }
}

if (import.meta.main) {
  await main()
}
