ROOT=$(git rev-parse --show-toplevel)
PLACE=$1

if [ ! -d "$ROOT/src/places/$PLACE" ]; then
  echo "$PLACE does not exist"
  exit 1
fi

pnpm run exec "$ROOT/src/places/$PLACE/push.ts"