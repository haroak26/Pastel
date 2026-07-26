#!/bin/bash
set -e

KV_SOURCE="/home/runner/.local/state/opencode/kv.json"
KV_BACKUP=".opencode/kv-backup.json"

case "${1:-}" in
  save)
    mkdir -p "$(dirname "$KV_BACKUP")"
    if [ -f "$KV_SOURCE" ]; then
      cp "$KV_SOURCE" "$KV_BACKUP"
      echo "Saved opencode KV state to $KV_BACKUP"
    else
      echo "No KV file found at $KV_SOURCE"
    fi
    ;;
  restore)
    if [ -f "$KV_BACKUP" ]; then
      mkdir -p "$(dirname "$KV_SOURCE")"
      cp "$KV_BACKUP" "$KV_SOURCE"
      echo "Restored opencode KV state from $KV_BACKUP"
    else
      echo "No backup found at $KV_BACKUP, skipping restore"
    fi
    ;;
  *)
    echo "Usage: $0 {save|restore}"
    exit 1
    ;;
esac
