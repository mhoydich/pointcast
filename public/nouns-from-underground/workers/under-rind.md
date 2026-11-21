# Midnight Pantry cheesemaker directory

One record describes one cheesemaker and the region where they make cheese. All fields are required.

| Field | Type | Meaning |
|---|---|---|
| `id` | String | Stable directory identifier. |
| `name` | String | Cheesemaker’s public display name. |
| `region` | String | Production region as identified by the source. Use the same spelling for records in the same region. |
| `source` | Object | `title` identifies the supporting source and `reference` gives its URL or a retrievable citation. |
| `checked_on` | Date string | Calendar date the editor consulted the source, in YYYY-MM-DD format. |
| `fictional` | Boolean | Set to true for invented examples and exclude those records from the public directory. |

### Fictional example

The producer, region, and source below are invented.

```json
{
  "id": "fiction-brass-lantern",
  "name": "Brass Lantern Creamery",
  "region": "Hollowbell Vale",
  "source": {
    "title": "Midnight Pantry Fair program (fictional)",
    "reference": "Imaginary program, page 4"
  },
  "checked_on": "2030-10-04",
  "fictional": true
}
```
