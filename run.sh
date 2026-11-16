#!/bin/sh
set -eu
cd "$(dirname "$0")"
exec node src/index.js "$@"
