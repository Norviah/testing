ROOT=$(git rev-parse --show-toplevel)
PLACE=$1

# Check if place exists
if [ ! -d "$ROOT/src/places/$PLACE" ]; then
  echo "$PLACE does not exist"
  exit 1
fi

# Run the script
pnpm run exec "$ROOT/src/places/$PLACE/scrape.ts"
pnpm run exec "$ROOT/src/places/$PLACE/push.ts"