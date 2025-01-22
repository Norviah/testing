ROOT=$(git rev-parse --show-toplevel)
cd $ROOT
BASE_URL="https://www.realtor.com/realestateagents/new-bedford_ma"

# loop from 1 to 10
for i in {1..10}
do
  if [ $i -eq 1 ]; then
    URL=$BASE_URL
  else
    URL=$BASE_URL/pg-$i
  fi

  pnpm run exec ./src/scripts/realtors.ts $URL
  sleep 5
done