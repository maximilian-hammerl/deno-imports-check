# deno-project-config-check

`deno-project-config-check` is a command-line tool designed to help you identify and remove unused imports of your Deno projects.

## Usage

To run the CLI tool:

```
deno run --allow-read --allow-write --allow-run jsr:@maximilian-hammerl/deno-project-config-check
```

### Permissions

| Permission      | Reason                                                                         |
|-----------------|--------------------------------------------------------------------------------|
| `--allow-read`  | Read your `deno.jsonc`, `deno.json` or `import_map.json` config file           |
| `--allow-write` | Write the temporary config file and, if configured, overwrite your config file |
| `--allow-run`   | Run `deno check` to test whether import can be removed                         |

## Contributing

Contributions are welcome!
If you have ideas for new features or improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE.md).
