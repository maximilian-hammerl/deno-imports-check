// import { parseArgs } from "@std/cli/parse-args";

async function runCommand(command: Deno.Command): Promise<boolean> {
  try {
    const { code } = await command.output()
    console.log(`Code is ${code} (${code === 0 ? 'success' : 'failure'})`)
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

  await writeDenoConfig('deno.json.backup', config)

  for (const key of Object.keys(config.imports)) {
    console.log(`\nTesting removal of import: ${key}`)

    const currentConfig = structuredClone(config)
    delete currentConfig.imports[key]

    console.info('Overwriting deno.json')
    await writeDenoConfig('deno.json', currentConfig)

    console.info('Running deno lint')
    const lintSuccess = await runCommand(
      new Deno.Command(Deno.execPath(), {
        args: ['lint'],
      }),
    )
    if (!lintSuccess) {
      console.info(`✅ Import ${key} is required`)
      continue
    }

    const checkSuccess = await runCommand(
      new Deno.Command(Deno.execPath(), {
        args: ['check'],
      }),
    )
    if (!checkSuccess) {
      console.info(`✅ Import ${key} is required`)
      continue
    }

    console.info(`❌ Import ${key} is unnecessary, can be safely removed`)
  }

  await writeDenoConfig('deno.json', config)
  await Deno.remove('deno.json.backup')

  console.log('Done checking imports.')
}

if (import.meta.main) {
  await main()
}
