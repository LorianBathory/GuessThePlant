# JSON Schema for exported plant data

Этот документ содержит спецификацию формата JSON, который создаёт скрипт экспорта данных.
Схема основана на стандарте draft 2020-12 и проверяется во время генерации.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://guesstheplant.dev/schemas/data-export.json",
  "title": "Guess The Plant data export",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "generatedAt",
    "species",
    "images",
    "questions",
    "difficulties",
    "parameters"
  ],
  "properties": {
    "generatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "species": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": {
        "$ref": "#/$defs/speciesEntry"
      }
    },
    "images": {
      "type": "object",
      "additionalProperties": false,
      "required": ["list", "byId"],
      "properties": {
        "list": {
          "type": "array",
          "items": { "$ref": "#/$defs/imageEntry" }
        },
        "byId": {
          "type": "object",
          "additionalProperties": { "$ref": "#/$defs/imageEntry" }
        }
      }
    },
    "questions": {
      "type": "object",
      "additionalProperties": false,
      "required": ["plants", "bouquets", "all"],
      "properties": {
        "plants": {
          "type": "array",
          "items": { "$ref": "#/$defs/questionEntry" }
        },
        "bouquets": {
          "type": "array",
          "items": { "$ref": "#/$defs/questionEntry" }
        },
        "all": {
          "type": "array",
          "items": { "$ref": "#/$defs/questionEntry" }
        }
      }
    },
    "difficulties": {
      "type": "object",
      "additionalProperties": false,
      "required": ["levels", "questionIds", "imageIds", "overrides"],
      "properties": {
        "levels": {
          "type": "object",
          "additionalProperties": false,
          "required": ["EASY", "MEDIUM", "HARD"],
          "properties": {
            "EASY": { "type": "string" },
            "MEDIUM": { "type": "string" },
            "HARD": { "type": "string" }
          }
        },
        "questionIds": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "additionalProperties": {
              "type": "array",
              "items": { "$ref": "#/$defs/identifier" }
            }
          }
        },
        "imageIds": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "additionalProperties": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "overrides": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": ["byId", "families", "tagLabels"],
      "properties": {
        "byId": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "additionalProperties": false,
            "required": ["scientificName"],
            "properties": {
              "scientificName": { "type": "string" },
              "lifeCycle": { "type": "string" },
              "additionalInfo": { "type": "string" },
              "hardinessZone": { "type": "string" },
              "light": { "type": "string" },
              "family": { "type": ["string", "null"] },
              "toxicity": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["level", "tag"],
                  "properties": {
                    "level": { "type": "integer" },
                    "tag": { "type": "string" }
                  }
                }
              }
            }
          }
        },
        "families": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": { "$ref": "#/$defs/identifier" }
          }
        },
        "tagLabels": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "additionalProperties": { "type": "string" }
            }
          }
        }
      }
    }
  },
  "$defs": {
    "identifier": {
      "type": ["integer", "string" ]
    },
    "names": {
      "type": "object",
      "required": ["ru", "en", "sci"],
      "properties": {
        "ru": { "type": "string" },
        "en": { "type": "string" },
        "nl": { "type": "string" },
        "sci": { "type": "string" }
      },
      "additionalProperties": { "type": "string" }
    },
    "speciesEntry": {
      "type": "object",
      "required": ["id", "names"],
      "properties": {
        "id": { "$ref": "#/$defs/identifier" },
        "names": { "$ref": "#/$defs/names" },
        "images": {
          "type": "array",
          "items": { "type": "string" }
        },
        "wrongAnswers": {
          "type": "array",
          "items": { "$ref": "#/$defs/identifier" }
        },
        "genusId": { "$ref": "#/$defs/identifier" }
      },
      "additionalProperties": true
    },
    "imageEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "src"],
      "properties": {
        "id": { "type": "string" },
        "src": { "type": "string" }
      }
    },
    "questionEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "correctAnswerId",
        "imageId",
        "image",
        "names",
        "questionVariantId",
        "questionType",
        "selectionGroupId",
        "questionPromptKey"
      ],
      "properties": {
        "id": { "$ref": "#/$defs/identifier" },
        "correctAnswerId": { "$ref": "#/$defs/identifier" },
        "imageId": { "type": "string" },
        "image": { "type": "string" },
        "names": { "$ref": "#/$defs/names" },
        "wrongAnswers": {
          "type": "array",
          "items": { "$ref": "#/$defs/identifier" }
        },
        "difficulty": { "type": ["string", "null"] },
        "questionVariantId": { "type": "string" },
        "questionType": { "type": "string" },
        "selectionGroupId": { "type": "string" },
        "questionPromptKey": { "type": "string" }
      }
    }
  }
}
```
