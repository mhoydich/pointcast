# Tag Signal

An embeddable browser tag game for other websites.

## Try It Locally

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 4177
```

Then visit `http://localhost:4177`.

`embed-demo.html` simulates another website and mounts the game using only `embed.js`.

## Add It To Another Site

Copy `embed.js`, `tag-game.js`, and `styles.css` to a public folder on the target site. Add this where the game should appear:

```html
<script
  src="/tag-game/embed.js"
  data-tag-game
  data-campaign="spring-drop"
  data-site="homepage"
  data-duration="30"
  data-endpoint="https://example.com/api/tag-game-event"
></script>
```

`data-endpoint` is optional. When present, every impression, start, tag, and finish event is posted as JSON with `navigator.sendBeacon` when available.

## Event Shape

```json
{
  "type": "finish",
  "campaign": "spring-drop",
  "site": "homepage",
  "path": "/",
  "at": "2026-04-28T12:00:00.000Z",
  "score": 7,
  "best": 9
}
```

The game also stores the last 100 events in `localStorage` under `tag-game-events-v1` and emits:

```js
window.addEventListener('tag-game:event', (event) => {
  console.log(event.detail);
});
```

For embeds inside another page, the game sends `window.parent.postMessage({ source: 'tag-game', event }, '*')` after every event.
