#!/bin/bash

set -eEuo pipefail

cd deno-config-json-schema
deno run --allow-read --allow-write --allow-env --allow-sys="cpus" npm:json-schema-to-typescript --input config-file.v1.json --output ../src/deno_config_file_schema.ts
