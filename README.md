# deno-project-config-check

`deno-project-config-check` is a command-line tool designed to help you identify
and remove unused imports of your Deno projects.

## Usage

To run the CLI tool:

```
deno run --allow-read --allow-write --allow-run="deno,git" jsr:@maximilian-hammerl/deno-project-config-check
```

### Permissions

| Permission               | Reason                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- |
| `--allow-read`           | To read your `deno.jsonc`, `deno.json` or `import_map.json` config file           |
| `--allow-write`          | To write the temporary config file and, if configured, overwrite your config file |
| `--allow-run="deno,git"` | to run `deno check` to test config changes and, if enabled, `git`                 |

### Arguments

| Argument           | Default | Explanation                                                                 |
| ------------------ | ------- | --------------------------------------------------------------------------- |
| `--overwrite`      | `false` | Whether to overwrite your deno config file when removable entries are found |
| `--check-imports`  | `true`  | Whether to check field `imports` for any removable entries                  |
| `--check-unstable` | `true`  | Whether to check field `unstable` for any removable entries                 |
| `--git`            | `true`  | Whether to use Git to check for uncommitted changes                         |
| `--debug`          | `false` | Whether to print debug information                                          |

## Contributing

Contributions are welcome! If you have ideas for new features or improvements,
feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE.md).
