# Nouns TV

Serve this directory as static files from the node's origin. Open the page on a television or cast the browser tab. Use any arrow to move through the four modes. Click or tap a mode on a touch display.

Set the room in the launch URL, for example `/?to=geo%3A33.9192%2C-118.4165`. This El Segundo address is the default on both platforms. The board reads the latest five lines every thirty seconds. The north-up map places one marker per active geo address, showing its newest line. On the local node it reads up to four additional rooms from /have. Public fallback reads the selected room.

For a standalone preview, run `python3 -m http.server 8000 --directory noun-network/tv` from the repository root. The local endpoints will return 404 and the app will try the public Loom.

The four WebP files are unmodified CC0 Nouns Money works copied from public/images/nouns-money so a node can serve this directory offline. Titles and serials follow collection-manifest.json. The daily selection rolls over at midnight UTC. The bundled QR encodes https://nounsmoney.xyz. Screenshots use local sample lines.
