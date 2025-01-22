#!/bin/bash

set -eEuo pipefail

cd deno-config-json-schema
curl --location --remote-name-all https://deno.land/x/deno/cli/schemas/{config-file.v1.json,lint-tags.v1.json,lint-rules.v1.json}
