#!/usr/bin/env bash

# Initialize all OneChain Move modules after publishing the package.
# Usage:
#   ./scripts/init_modules.sh <PACKAGE_ID> [GAS_BUDGET]
# Example:
#   ./scripts/init_modules.sh 0x123456789abcdef 80000000

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <PACKAGE_ID> [GAS_BUDGET]" >&2
    exit 1
fi

PACKAGE_ID="$1"
GAS_BUDGET="${2:-100000000}"

echo "Initializing modules in package ${PACKAGE_ID} with gas budget ${GAS_BUDGET}..."

one client call \
    --package "${PACKAGE_ID}" \
    --module spaceship \
    --function initialize \
    --gas-budget "${GAS_BUDGET}"

one client call \
    --package "${PACKAGE_ID}" \
    --module bossdrop \
    --function initialize \
    --gas-budget "${GAS_BUDGET}"

one client call \
    --package "${PACKAGE_ID}" \
    --module marketplace \
    --function initialize \
    --gas-budget "${GAS_BUDGET}"

one client call \
    --package "${PACKAGE_ID}" \
    --module player \
    --function initialize_player \
    --gas-budget "${GAS_BUDGET}"

echo "All initialization calls submitted."

