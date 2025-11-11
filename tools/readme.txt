node localStaticServer.mjs ..
http://localhost:4173/index.html

__

node tools/memorizationConverter.mjs to-csv --input src/data/json/memorization.json --output Memorization.csv
node tools/plantDataConverter.mjs --dry-run
