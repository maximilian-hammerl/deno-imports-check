const TEST_DENO_CONFIG_FILE = 'deno.test.json'

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

type DenoConfig = {
  imports: Record<string, string>
} & Record<string, unknown>

async function readDenoConfig(): Promise<DenoConfig> {
  let content: string
  try {
    content = await Deno.readTextFile('deno.json')
  } catch (error) {
    throw new Error(`Failed to read deno.json: ${error}`)
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse deno.json: ${error}`)
  }
}

async function writeDenoConfig(
  filename: string,
  config: DenoConfig,
): Promise<void> {
  let content: string
  try {
    content = JSON.stringify(config, null, 2)
  } catch (error) {
    throw new Error(`Failed to stringify deno.json: ${error}`)
  }
  try {
    await Deno.writeTextFile(filename, content)
  } catch (error) {
    throw new Error(`Failed to write deno.json: ${error}`)
  }
}

async function main() {
  const config = await readDenoConfig()
  if (!config.imports) {
    throw new Error('No imports found in deno.json')
  }

  if (!Object.keys(config.imports).length) {
    throw new Error('Empty imports in deno.json')
  }

  const importsToRemove: Array<string> = []

  for (const key of Object.keys(config.imports)) {
    console.info(`Testing removal of import ${key}`)

    const currentConfig = structuredClone(config)
    delete currentConfig.imports[key]

    await writeDenoConfig(TEST_DENO_CONFIG_FILE, currentConfig)

    console.log('Running deno check')
    const checkSuccess = await runCommand(
      new Deno.Command(Deno.execPath(), {
        args: ['check', '--config', TEST_DENO_CONFIG_FILE, '**/*.ts'],
      }),
    )
    if (!checkSuccess) {
      console.info(`Import ${key} is required`)
      continue
    }

    console.info(`Import ${key} is not required, can be removed`)
    importsToRemove.push(key)
  }

  await Deno.remove(TEST_DENO_CONFIG_FILE)

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
