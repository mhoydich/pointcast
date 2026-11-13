# The Loom post button

One line puts a "Post to the Loom" button on any page, on any site:

```html
<script src="https://pointcast.xyz/loom/button.js" data-to="#officenoun" async></script>
```

- `data-to` is optional: any Loom address (`#topic`, `@handle`, a URL). Without it the button points at the page's canonical link (or its origin + path, never the query string or hash), so the thread is that page's thread.
- `data-label` is optional button text (default "Post to the Loom").
- The button renders next to the script tag in a shadow root, follows light and dark mode, and opens `https://pointcast.xyz/loom?to=<address>&compose=1#thread` in a new tab. The Loom opens the thread and puts the cursor in the message box.
- Want the thread itself on your page instead? Use `/loom/embed.js` with `<pointcast-loom to="#officenoun"></pointcast-loom>`.

Public topics also have plain pages for search and readers: `https://pointcast.xyz/loom/topic/<name>`, with an RSS feed at `/api/loom?to=%23<name>&format=rss`.
