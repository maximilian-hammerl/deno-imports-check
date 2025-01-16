import { parse } from 'jsr:@std/jsonc'

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

type DenoConfig = {
  imports: Record<string, string>
} & Record<string, unknown>

async function readDenoConfig(): Promise<{
  filename: string
  config: DenoConfig
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
        config: parse(content) as DenoConfig,
      }
    } catch (error) {
      throw new Error(`Failed to parse config of ${filename}: ${error}`)
    }
  }

  throw new Error(
    `Failed to find Deno config file (looked for ${DENO_CONFIG_FILENAMES})`,
  )
}

async function writeDenoConfig(
  filename: string,
  config: DenoConfig,
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

async function main() {
  const { filename, config } = await readDenoConfig()
  if (!config.imports) {
    throw new Error(`No imports found in ${filename}`)
  }

  if (!Object.keys(config.imports).length) {
    throw new Error(`Empty imports in ${filename}`)
  }

  const testFilename = `test.${filename}`

  const importsToRemove: Array<string> = []

  for (const key of Object.keys(config.imports)) {
    console.info(`Testing removal of import ${key}`)

    const currentConfig = structuredClone(config)
    delete currentConfig.imports[key]

    await writeDenoConfig(testFilename, currentConfig)

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
  } else {
    console.info('Found no imports to remove')
  }
}

if (import.meta.main) {
  await main()
}
