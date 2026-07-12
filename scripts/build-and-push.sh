#!/usr/bin/env bash
set -euo pipefail

REGISTRY="ghcr.io/david-glitc"
TAG="${1:-latest}"

echo "Building & pushing Driftlands images to GHCR ($TAG)"

echo "→ Building server image…"
docker build -f server/Dockerfile -t "$REGISTRY/driftlands-server:$TAG" .

echo "→ Building client image…"
docker build -f client/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://driftlands-api.kierkegaard.space \
  --build-arg NEXT_PUBLIC_WS_URL=wss://driftlands-api.kierkegaard.space/ws \
  --build-arg NEXT_PUBLIC_DEMO_MODE=true \
  --build-arg NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6 \
  -t "$REGISTRY/driftlands-client:$TAG" .

echo "→ Pushing images…"
docker push "$REGISTRY/driftlands-server:$TAG"
docker push "$REGISTRY/driftlands-client:$TAG"

echo "Done. Deploy with: node scripts/deploy-coolify.mjs"