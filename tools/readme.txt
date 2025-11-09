node localStaticServer.mjs ..
http://localhost:4173/index.html

__

node tools/plantDataValidator.mjs --write
# (Запуск через `py -3` невозможен: скрипт написан на Node.js.)
node tools/plantDataValidator.mjs --input PlantData-rows.json --output src/data/json/plantData.json
node tools/memorizationConverter.mjs to-csv --input src/data/json/memorization.json --output Memorization.csv
