#!/usr/bin/env bash
set -euo pipefail

PATTERNS=("useQuery(" "useMutation(" "useSubscription(" "from \"@convex/react\"" "useConvexAuth(")

bad=0
for p in "${PATTERNS[@]}"; do
  files=$(rg --hidden --no-ignore -n --glob '!node_modules' --no-line-number --no-heading --fixed-strings "$p" || true)
  if [ -z "$files" ]; then
    continue
  fi
  while IFS= read -r f; do
    if ! rg -nq '^["'\'']use client["'\''];' "$f"; then
      echo "Client-hook usage detected in non-client file: $f (pattern: $p)"
      bad=1
    fi
  done <<< "$files"
done

if [ "$bad" -ne 0 ]; then
  echo "ERROR: Detected client hooks used in files without 'use client' directive."
  exit 2
fi
