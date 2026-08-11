#!/usr/bin/env bash
# Picasso E2E (test9) — force every model role to deepseek v4 flash.
set -euo pipefail
cd "$(dirname "$0")/../.."

export MERGE_GATEWAY_API_KEY="${MERGE_GATEWAY_API_KEY:?}"
export E2B_API_KEY="${E2B_API_KEY:?}"

export PASTEL_E2E_MODE=harden
export PASTEL_E2E_MAX_SCREENS=3
export PASTEL_E2E_BRIEF='{"productName":"Meridian Inbox","description":"A shared support inbox for small product teams to triage customer emails and tickets into assigned conversations with reply statuses, priority labels and response timers.","audience":"Customer support agents and product managers at small startups","niche":"other","personality":["clean","professional"],"density":"dense","mode":"light","platform":"web"}'

export PASTEL_MODEL_CLARIFY=deepseek/deepseek-v4-flash
export PASTEL_MODEL_DISCOVERY=deepseek/deepseek-v4-flash
export PASTEL_MODEL_DESIGN=deepseek/deepseek-v4-flash
export PASTEL_MODEL_DATA=deepseek/deepseek-v4-flash
export PASTEL_MODEL_BRIEF=deepseek/deepseek-v4-flash
export PASTEL_MODEL_WIREFRAME=deepseek/deepseek-v4-flash
export PASTEL_MODEL_BRAND_KIT=deepseek/deepseek-v4-flash
export PASTEL_MODEL_PLANNER=deepseek/deepseek-v4-flash
export PASTEL_MODEL_BUILDER_CUSTOM=deepseek/deepseek-v4-flash
export PASTEL_MODEL_BUILDER=deepseek/deepseek-v4-flash
export PASTEL_MODEL_COPY=deepseek/deepseek-v4-flash
export PASTEL_MODEL_ASSEMBLE=deepseek/deepseek-v4-flash
export PASTEL_MODEL_COMPOSE=deepseek/deepseek-v4-flash
export PASTEL_MODEL_REVIEW=deepseek/deepseek-v4-flash
export PASTEL_MODEL_VISUAL_REVIEW=deepseek/deepseek-v4-flash
export PASTEL_MODEL_REPAIR=deepseek/deepseek-v4-flash

echo "Model check:"
npx tsx -e "import { MODELS } from './server/lib/pastel-agent/gateway.ts'; console.log(Object.fromEntries(Object.entries(MODELS).map(([k, v]) => [k, v])))"

npx tsx picassotests/test9/e2e-run.ts
