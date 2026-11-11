# What a plain web page can do for the home (checked 2026-11-11)

Written by Claude Code for House Channel v0 (`/house/`). Mike asked in chat on
November 11, 2026 to scope and start web-app-first home devices around TVs and
audio-visual.

Every row was checked on the day against the linked source. Browser support
comes from the caniuse data files (fetched from the caniuse repository on
2026-11-11) and the web-features explorer, which is built from MDN's
browser-compat-data. "Not verified" means I did not find or could not open a
primary source, not that the answer is no. Nothing here was tested on a real
device; that is the Manus brief (`docs/briefs/2026-11-11-manus-house-channel.md`).

## The TV as a screen

| Capability | What the source says | Source | What this means for us |
|---|---|---|---|
| Opening a page in a smart-TV browser (Samsung) | Samsung lists the web engine per TV model year: 2026 is Chromium M130, 2025 M120, 2024 M108, 2023 M94, 2022 M85, 2021 M76, 2020 M69, 2019 M63, 2018 M56, 2017 M47. The table is in the web-app documentation; the page does not say the built-in browser app uses the same version. | [Samsung web engine specifications](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html) | TVs are years behind phones. The TV page avoids newer syntax and CSS (no optional chaining, `??`, `inset`, `clamp()`), uses 2D canvas only, and should run on a 2019 engine. Unverified on a real set. |
| Opening a page in a smart-TV browser (LG) | webOS TV 26 (2026) is Chromium 132, 25 is 120, 24 is 108, 23 is 94, 22 is 87, 6.x (2021) is 79, 5.x (2020) is 68, 4.x (2018–19) is 53. LG warns that Chrome compatibility data may not match the TV for platform-specific functions. | [webOS TV web API and web engine](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine) | Same conclusion. The WebSocket, Web Audio and wake-lock behaviour of these browsers is not documented there: unknown until tested. |
| Other TV platforms' browsers | Not verified. I did not find primary pages for the browsers on other streaming boxes and sticks. | — | Treat "the TV has a browser" as unknown per household; the cast-a-tab and laptop-on-a-cable paths are the fallbacks. |
| Sending a Chrome tab to a TV | Chrome has had casting built in since 2016: the "Cast…" menu item shows "websites that are not integrated with Cast" on a TV, with nothing to install. Google's current help page for speakers says the computer must be on the same Wi-Fi network as the device. | [Google: Cast is built in to Chrome (2016)](https://blog.google/products-and-platforms/products/chrome/google-cast-is-now-built-in-to-chrome/), [Cast audio from Chrome](https://support.google.com/chromecast/answer/6279402) | A person can put `/house/` on a TV from a laptop with no work from us. It is a mirror of the tab: the page still runs on the laptop, so the laptop must stay awake. Frame rate and audio delay over the mirror are not verified. |
| Cast from our own page (Web Sender SDK) | A sender page loads the Cast framework, sets a `receiverApplicationId`, and shows a `<google-cast-launcher>`; the sender runs in Chrome. The default media receiver needs no registration and is for media. A custom receiver is a registered HTML/JS app. | [Cast web sender integration](https://developers.google.com/cast/docs/web_sender/integrate) | We could later register `/house/` as a custom receiver so a phone could launch it on a cast device with one tap. Registration terms and fees: not verified (the registration page could not be fetched). Not in v0. |
| Presentation API (open a page on a second screen) | Chrome 47+, Chrome Android 47+, Edge 79+. Not in Firefox. Not in Safari on any platform. | [web-features: presentation-api](https://web-platform-dx.github.io/web-features-explorer/features/presentation-api) | Chromium only, so it cannot be the way in. Worth a progressive "send to a screen" button for Chrome later. |
| Remote Playback API (send a media element to a TV) | Chrome 121+, Chrome Android 56+, Edge 121+, Safari 13.1+, iOS Safari 13.4+. Not in Firefox. It extends `HTMLMediaElement` only; it covers cast devices and AirPlay. | [web-features: remote-playback](https://web-platform-dx.github.io/web-features-explorer/features/remote-playback), [MDN Remote Playback API](https://developer.mozilla.org/en-US/docs/Web/API/Remote_Playback_API) | It moves a `<video>` or `<audio>`, not a page. Our views are a canvas, so it does not apply unless we render to a video stream. Not in v0. |
| AirPlay from Safari | MDN notes Safari on iOS has its own AirPlay APIs alongside Remote Playback; both act on media elements. Mirroring a whole page is an operating-system screen-mirroring feature, not something a page can start. Apple's own current developer page for the web AirPlay API: not verified. | [MDN Remote Playback API](https://developer.mozilla.org/en-US/docs/Web/API/Remote_Playback_API) | From an iPhone or Mac the route is system screen mirroring of the `/house/` tab, started by the person. We cannot trigger it. Unverified on a device. |
| Screen Wake Lock | Chrome and Edge 84+, Firefox 126+, Safari 16.4+, iOS Safari 16.4+, Samsung Internet 14+. | [caniuse: wake-lock](https://caniuse.com/wake-lock) | The TV page asks for a wake lock while something is on screen and releases it for Off and End. On TV engines older than Chromium 84 there is none; the TV's own screensaver may take over. Unverified on TVs. |
| Fullscreen API | Chrome 71+, Firefox 64+, desktop Safari 16.4+ (unprefixed). iOS Safari: partial, "supporting only iPad, not iPhone". | [caniuse: fullscreen](https://caniuse.com/fullscreen) | The TV page goes full screen on a press of OK or a click, with the prefixed call as a fallback. A phone cannot ask the TV to go full screen: it needs a press on the TV page. |

## Sound

| Capability | What the source says | Source | What this means for us |
|---|---|---|---|
| Web Audio support | Supported in every current browser, including Samsung Internet. | [caniuse: audio-api](https://caniuse.com/audio-api) | All sound is synthesized on the TV page; no audio files. |
| Autoplay in Chrome | An `AudioContext` made before a user gesture starts "suspended" and needs `resume()` after one. Sound is allowed after the user has interacted with the domain, or on desktop when the site's media engagement is high, or when the site is installed. Same-origin iframes inherit it. In Chrome since version 71. | [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay), [Web Audio and autoplay](https://developer.chrome.com/blog/web-audio-autoplay?hl=en) | A command from a phone is not a gesture on the TV page. So "sound on" from the remote may leave the TV's audio suspended. The TV then shows "press OK or click", and the phone is told. A cast tab is driven from a laptop, where one click does it. |
| Autoplay in Safari on iOS | WebKit has "required a user gesture to play media" with sound; only silent or muted video may start alone. | [WebKit: new video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) | Same handling. That post is about media elements; the Web Audio rule on current iOS is not verified from a primary source, so we treat it as needing a press. |
| Autoplay on TV browsers | Not verified. Neither TV vendor's page says. | — | Handled the honest way round: try, check the context state, and ask for a press if it did not start. |
| Haptics (Vibration API) | Chrome 30+ and Chrome for Android, Samsung Internet. Not in Safari or iOS Safari. Not in current Firefox. | [caniuse: vibration](https://caniuse.com/vibration) | The remote buzzes on Android when you stack, light and breathe. On an iPhone there is no buzz. |

## Reaching other devices from a page

| Capability | Chrome desktop | Chrome Android | Safari (macOS and iOS) | Firefox | Source | What this means for us |
|---|---|---|---|---|---|---|
| Web Bluetooth | Yes (56+; varies by operating system) | Yes | No | No | [caniuse: web-bluetooth](https://caniuse.com/web-bluetooth) | A Bluetooth object (a lamp, a candle, a button) can only be reached from Chrome. An iPhone cannot, short of a third-party extension. Any hardware idea that needs the phone to talk Bluetooth from a web page leaves iPhones out. |
| Web NFC | No | Yes, NDEF only | No | No | [caniuse: webnfc](https://caniuse.com/webnfc) | Tap-a-tag from a page is Android-only. But an NFC tag that simply holds a URL opens that URL on both platforms through the phone itself; that part needs no web API (not verified here). |
| WebHID | Yes (89+) | No | No | No | [caniuse: webhid](https://caniuse.com/webhid) | Desktop Chromium only. Useful for a laptop driving the TV, not for phones. |
| Web MIDI | Yes (43+) | Yes | No (a third-party extension exists on macOS) | Yes (108+) desktop | [caniuse: midi](https://caniuse.com/midi) | A MIDI pad could play the Drum view from a laptop. Not from an iPhone. |
| Web Serial | Yes (89+) | Yes, over Bluetooth RFCOMM | No | Yes (151+) desktop | [caniuse: web-serial](https://caniuse.com/web-serial) | Microcontroller boards over USB from a laptop. Not from an iPhone. |

## Installing, and the rest of the house

| Capability | What the source says | Source | What this means for us |
|---|---|---|---|
| Install on Android | Chrome for Android supports installing a site with a web app manifest. | [caniuse: web-app-manifest](https://caniuse.com/web-app-manifest) | The remote ships a manifest so it can sit on a home screen. |
| Install on iOS | Safari 26: "By default, every website added to the Home Screen opens as a web app", with no installability requirements. Other iOS browsers' in-app web views do not offer Add to Home Screen. | [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [caniuse: web-app-manifest](https://caniuse.com/web-app-manifest) | An iPhone owner can keep the remote on the home screen from Safari's share sheet. We cannot prompt for it. |
| Smart lights and Matter | Matter runs over IPv6 on Ethernet, Wi-Fi and Thread; setup uses Bluetooth LE (required for Thread devices) and discovery uses DNS-SD on the local network. A web page has none of those: no DNS-SD, no raw IPv6 sockets, no Thread radio. | [Matter handbook: connectivity transports](https://handbook.buildwithmatter.com/how-it-works/connectivity-transports/) | A page cannot be a Matter controller. Lights need a hub or bridge on the home network that speaks Matter, with our page talking to the hub's own cloud or local HTTP interface. Which hubs offer that: not verified. |
| A public page calling a device on the home network | Chrome gates requests from public sites to local addresses behind a permission prompt ("Look for and connect to any device on your local network"), launched in Chrome 142, secure contexts only. | [Chrome: Local Network Access](https://developer.chrome.com/blog/local-network-access) | Even where a bridge has a local HTTP interface, pointcast.xyz calling it means a permission prompt in Chrome, and other browsers' rules are not verified. Do not plan on it for v0; a hub with a cloud interface or a small local companion is the realistic path. |

## The three findings that shaped v0

1. **The TV is the easy part; the phone is the hard part.** Any TV that can show a web page, a cast tab or a laptop on a cable can be the hearth, because the TV page needs only canvas, WebSocket and Web Audio. The device APIs that would let a phone reach hardware (Bluetooth, NFC, HID, MIDI, Serial) are missing from Safari on iOS, so nothing in v0 depends on them.
2. **A phone cannot unmute a TV by itself.** Browsers start sound only after a press on the page that makes it. So "sound on" is a request from the remote and, where the browser insists, a prompt on the TV. Both screens say what is happening.
3. **A page cannot reach the lights.** Matter and local bridges live on the home network, out of a public page's reach without a hub. House Channel therefore stays on the screen and speaker it is already on.

## Not checked

- Any real TV browser, cast tab, iPhone or Android phone.
- Whether TV browsers keep a WebSocket open for hours, honour a wake lock, or throttle a canvas.
- Audio delay over a mirrored tab.
- Cast receiver registration terms.
- Apple's current developer documentation for AirPlay on the web.
