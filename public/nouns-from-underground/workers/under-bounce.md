# Public sports court record

`public_access` describes walk-in access, scheduled access, or an unknown access arrangement. Use the operator’s published name and location and keep the source URL with each verified listing. A fictional fixture uses a separate record type and leaves the location and source empty.

## JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["record_type", "name", "sports", "public_access", "location", "source_url"],
  "properties": {
    "record_type": { "enum": ["verified", "fictional"] },
    "name": { "type": "string", "minLength": 1 },
    "sports": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "minItems": 1,
      "uniqueItems": true
    },
    "public_access": { "enum": ["walk_in", "scheduled", "unknown"] },
    "location": { "type": ["string", "null"], "minLength": 1 },
    "source_url": { "type": ["string", "null"], "pattern": "^https?://[^/\\s]+", "format": "uri" }
  },
  "if": { "properties": { "record_type": { "const": "verified" } } },
  "then": {
    "properties": {
      "location": { "type": "string" },
      "source_url": { "type": "string" }
    }
  },
  "else": {
    "properties": {
      "location": { "type": "null" },
      "source_url": { "type": "null" }
    }
  }
}
```

## Fictional example

```json
{
  "record_type": "fictional",
  "name": "Example Court",
  "sports": ["basketball"],
  "public_access": "walk_in",
  "location": null,
  "source_url": null
}
```
