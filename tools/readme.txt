node localStaticServer.mjs ..
http://localhost:4173/index.html

__

node tools/plantDataValidator.mjs --write
node tools/memorizationConverter.mjs to-csv --input src/data/json/memorization.json --output Memorization.csv
