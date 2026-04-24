export type ResourceKind = 'web-app' | 'cli' | 'desktop' | 'docs' | 'course' | 'reference';
export type ResourceMode = 'open-source' | 'free-docs' | 'free-course' | 'community';

export interface ResourceLink {
  label: string;
  url: string;
}

export interface ResourceItem {
  slug: string;
  name: string;
  url: string;
  kind: ResourceKind;
  mode: ResourceMode;
  tags: string[];
  oneLiner: string;
  useWhen: string;
  quickStart?: string;
  caution?: string;
  links?: ResourceLink[];
  featured?: boolean;
}

export interface ResourceGroup {
  id: string;
  code: string;
  name: string;
  note: string;
  resources: ResourceItem[];
}

export interface ResourceRecipe {
  title: string;
  tool: string;
  command: string;
  note: string;
}

export const RESOURCE_LAST_CHECKED = '2026-04-21';

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    id: 'convert',
    code: 'CV',
    name: 'Convert + compress',
    note: 'Small files, sane formats, no mystery upload step unless the tool earns it.',
    resources: [
      {
        slug: 'squoosh',
        name: 'Squoosh',
        url: 'https://squoosh.app/',
        kind: 'web-app',
        mode: 'open-source',
        tags: ['images', 'webp', 'avif', 'privacy'],
        oneLiner: 'Private browser image compression and format conversion.',
        useWhen: 'A PNG, JPEG, WebP, or AVIF needs to get smaller before a post, PR, or PointCast block.',
        quickStart: 'Drop an image, compare codecs side-by-side, export the smallest version that still looks right.',
        caution: 'Great for one-offs. Use ImageMagick when a whole folder needs the same treatment.',
        links: [{ label: 'Source', url: 'https://github.com/GoogleChromeLabs/squoosh' }],
        featured: true,
      },
      {
        slug: 'imagemagick',
        name: 'ImageMagick',
        url: 'https://imagemagick.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['images', 'batch', 'automation'],
        oneLiner: 'The command-line workhorse for creating, editing, and converting bitmap images.',
        useWhen: 'You need repeatable image resizing, format conversion, cropping, compositing, or batch cleanup.',
        quickStart: 'magick input.png -resize "1600x1600>" output.webp',
        caution: 'Set a local security policy before processing untrusted files.',
        links: [
          { label: 'Docs', url: 'https://imagemagick.org/script/command-line-processing.php' },
          { label: 'Source', url: 'https://github.com/ImageMagick/ImageMagick' },
        ],
      },
      {
        slug: 'ffmpeg',
        name: 'FFmpeg',
        url: 'https://ffmpeg.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['video', 'audio', 'transcode', 'stream'],
        oneLiner: 'A complete cross-platform toolchain to record, convert, and stream audio/video.',
        useWhen: 'Media needs exact control: codecs, bitrates, subtitles, frame rates, extraction, streaming, repair.',
        quickStart: 'ffmpeg -i input.mov -vf "scale=1920:-2" -c:v libx264 -crf 23 -c:a aac output.mp4',
        caution: 'Download from the official site or trusted package managers. Fake installer pages are common.',
        links: [
          { label: 'Docs', url: 'https://ffmpeg.org/documentation.html' },
          { label: 'Source', url: 'https://github.com/FFmpeg/FFmpeg' },
        ],
        featured: true,
      },
      {
        slug: 'handbrake',
        name: 'HandBrake',
        url: 'https://handbrake.fr/',
        kind: 'desktop',
        mode: 'open-source',
        tags: ['video', 'transcode', 'gui'],
        oneLiner: 'A friendly desktop video transcoder for modern MP4, MKV, and WebM outputs.',
        useWhen: 'You want a visual queue, presets, subtitles, and reliable video conversion without building an FFmpeg command.',
        quickStart: 'Open source, choose a preset, set the destination, start encode.',
        caution: 'Use handbrake.fr. Similar-looking domains have appeared in search results.',
        links: [
          { label: 'Docs', url: 'https://handbrake.fr/docs/' },
          { label: 'Source', url: 'https://github.com/HandBrake/HandBrake' },
        ],
      },
      {
        slug: 'pandoc',
        name: 'Pandoc',
        url: 'https://pandoc.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['documents', 'markdown', 'pdf', 'docx'],
        oneLiner: 'The universal document converter for Markdown, HTML, DOCX, PDF workflows, and slides.',
        useWhen: 'Notes need to become docs, docs need to become slides, or Markdown needs to travel cleanly.',
        quickStart: 'pandoc notes.md -o notes.docx',
        links: [
          { label: 'Manual', url: 'https://pandoc.org/MANUAL.html' },
          { label: 'Source', url: 'https://github.com/jgm/pandoc' },
        ],
      },
      {
        slug: 'exiftool',
        name: 'ExifTool',
        url: 'https://exiftool.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['metadata', 'images', 'privacy'],
        oneLiner: 'Read, write, and remove metadata from images, audio, video, and document files.',
        useWhen: 'You need to inspect GPS/camera fields, clean uploads, or preserve metadata across a pipeline.',
        quickStart: 'exiftool -all= image.jpg',
        caution: 'Keep an untouched original when stripping metadata.',
      },
    ],
  },
  {
    id: 'inspect',
    code: 'IN',
    name: 'Inspect + transform',
    note: 'Tools for understanding strange files, logs, feeds, tables, and blobs.',
    resources: [
      {
        slug: 'cyberchef',
        name: 'CyberChef',
        url: 'https://gchq.github.io/CyberChef/',
        kind: 'web-app',
        mode: 'open-source',
        tags: ['decode', 'hash', 'base64', 'forensics'],
        oneLiner: 'A browser workbench for encoding, decoding, hashing, compression, and data analysis.',
        useWhen: 'A string looks like base64, a timestamp looks wrong, a payload needs decoding, or a recipe needs to be shared.',
        quickStart: 'Paste input, add operations to the recipe, let Auto Bake show the result.',
        caution: 'For sensitive files, download/run a local copy rather than using a hosted tab.',
        links: [{ label: 'Source', url: 'https://github.com/gchq/CyberChef' }],
        featured: true,
      },
      {
        slug: 'jq',
        name: 'jq',
        url: 'https://jqlang.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['json', 'cli', 'api'],
        oneLiner: 'A lightweight command-line processor for slicing, filtering, and reshaping JSON.',
        useWhen: 'An API response is too large to eyeball, or a JSON feed needs quick transformation.',
        quickStart: 'curl -s https://pointcast.xyz/blocks.json | jq ".items[0] | {title, url}"',
        links: [{ label: 'Manual', url: 'https://jqlang.org/manual/' }],
      },
      {
        slug: 'duckdb',
        name: 'DuckDB',
        url: 'https://duckdb.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['sql', 'csv', 'parquet', 'analytics'],
        oneLiner: 'An in-process analytical SQL database that can query local CSV and Parquet directly.',
        useWhen: 'A spreadsheet is too big, a CSV needs joins, or you want SQL without setting up a server.',
        quickStart: 'duckdb -c "select * from read_csv_auto(\'data.csv\') limit 10"',
        links: [
          { label: 'Docs', url: 'https://duckdb.org/docs/' },
          { label: 'Source', url: 'https://github.com/duckdb/duckdb' },
        ],
      },
      {
        slug: 'sqlite',
        name: 'SQLite',
        url: 'https://sqlite.org/docs.html',
        kind: 'reference',
        mode: 'open-source',
        tags: ['database', 'local-first', 'sql'],
        oneLiner: 'The small, durable database file that quietly runs half the modern world.',
        useWhen: 'You need a local app database, a portable data artifact, or a no-server prototype.',
        quickStart: 'sqlite3 local.db ".schema"',
        links: [{ label: 'CLI docs', url: 'https://sqlite.org/cli.html' }],
      },
      {
        slug: 'datasette',
        name: 'Datasette',
        url: 'https://datasette.io/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['sqlite', 'publishing', 'json-api'],
        oneLiner: 'A multi-tool for exploring, publishing, and turning SQLite data into JSON APIs.',
        useWhen: 'A dataset should be browsable, searchable, shareable, and API-shaped in minutes.',
        quickStart: 'datasette data.db',
        links: [{ label: 'Docs', url: 'https://docs.datasette.io/' }],
      },
    ],
  },
  {
    id: 'machine-room',
    code: 'MR',
    name: 'Machine room',
    note: 'Boring utilities that make computers feel less stuck.',
    resources: [
      {
        slug: 'homebrew',
        name: 'Homebrew',
        url: 'https://brew.sh/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['macos', 'linux', 'packages'],
        oneLiner: 'The missing package manager for macOS or Linux.',
        useWhen: 'You want one reliable way to install CLI tools and desktop apps on a new machine.',
        quickStart: 'brew install imagemagick ffmpeg jq pandoc duckdb',
        links: [{ label: 'Docs', url: 'https://docs.brew.sh/' }],
      },
      {
        slug: 'syncthing',
        name: 'Syncthing',
        url: 'https://syncthing.net/',
        kind: 'desktop',
        mode: 'open-source',
        tags: ['sync', 'p2p', 'local-first'],
        oneLiner: 'Continuous peer-to-peer file synchronization across your own devices.',
        useWhen: 'A folder should stay in sync without Dropbox, Google Drive, or a central vendor account.',
        quickStart: 'Pair devices, share a folder, let Syncthing keep both sides current.',
        links: [{ label: 'Source', url: 'https://github.com/syncthing/syncthing' }],
      },
      {
        slug: 'rclone',
        name: 'rclone',
        url: 'https://rclone.org/',
        kind: 'cli',
        mode: 'open-source',
        tags: ['backup', 'cloud', 'sync'],
        oneLiner: 'Cloud storage sync, copy, mount, backup, and migration from the command line.',
        useWhen: 'Files need to move between S3, Drive, Dropbox, Backblaze, local disks, or remote servers.',
        quickStart: 'rclone config',
        links: [
          { label: 'Docs', url: 'https://rclone.org/docs/' },
          { label: 'Source', url: 'https://github.com/rclone/rclone' },
        ],
      },
      {
        slug: 'obs-studio',
        name: 'OBS Studio',
        url: 'https://obsproject.com/',
        kind: 'desktop',
        mode: 'open-source',
        tags: ['recording', 'streaming', 'screen-capture'],
        oneLiner: 'Free and open-source screen recording and live streaming software.',
        useWhen: 'You need to record a walkthrough, capture a bug, make a tutorial, or run a small broadcast.',
        quickStart: 'Create a scene, add a display/window source, hit Start Recording.',
        links: [{ label: 'Source', url: 'https://github.com/obsproject/obs-studio' }],
      },
    ],
  },
  {
    id: 'make-explain',
    code: 'MX',
    name: 'Make + explain',
    note: 'Open tools for diagrams, visuals, and creative work that survive being shared.',
    resources: [
      {
        slug: 'excalidraw',
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        kind: 'web-app',
        mode: 'open-source',
        tags: ['diagrams', 'whiteboard', 'local-first'],
        oneLiner: 'A hand-drawn style whiteboard with an open JSON file format.',
        useWhen: 'A system, flow, wireframe, or weird idea needs to become legible fast.',
        quickStart: 'Sketch, export PNG/SVG, save the .excalidraw file next to the project.',
        links: [{ label: 'Source', url: 'https://github.com/excalidraw/excalidraw' }],
      },
      {
        slug: 'mermaid',
        name: 'Mermaid',
        url: 'https://mermaid.js.org/',
        kind: 'reference',
        mode: 'open-source',
        tags: ['diagrams', 'markdown', 'docs'],
        oneLiner: 'Text-based diagrams that render in Markdown-friendly places, including GitHub.',
        useWhen: 'A diagram should live next to the code or docs and change in a pull request.',
        quickStart: 'Start with graph TD, sequenceDiagram, or timeline in a fenced mermaid block.',
        links: [
          { label: 'Live editor', url: 'https://mermaid.live/' },
          { label: 'Source', url: 'https://github.com/mermaid-js/mermaid' },
        ],
      },
      {
        slug: 'blender',
        name: 'Blender',
        url: 'https://www.blender.org/',
        kind: 'desktop',
        mode: 'open-source',
        tags: ['3d', 'animation', 'rendering'],
        oneLiner: 'Free and open-source 3D creation for modeling, animation, rendering, and visual effects.',
        useWhen: 'A project needs custom 3D assets, product renders, motion tests, or visual experiments.',
        quickStart: 'Start with the official tutorials, then automate repeat work through Python.',
      },
      {
        slug: 'krita',
        name: 'Krita',
        url: 'https://krita.org/en/',
        kind: 'desktop',
        mode: 'open-source',
        tags: ['painting', 'illustration', 'comics'],
        oneLiner: 'A professional free and open-source painting program.',
        useWhen: 'You need digital painting, 2D art, comic layouts, textures, or hand-made visual assets.',
        quickStart: 'Create a canvas, pick a brush preset, keep source .kra files with exported PNGs.',
        links: [{ label: 'Source', url: 'https://github.com/KDE/krita' }],
      },
    ],
  },
  {
    id: 'learn',
    code: 'LR',
    name: 'Learn the machine',
    note: 'Instructionals worth bookmarking because they teach durable habits, not just button locations.',
    resources: [
      {
        slug: 'missing-semester',
        name: 'The Missing Semester',
        url: 'https://missing.csail.mit.edu/',
        kind: 'course',
        mode: 'free-course',
        tags: ['shell', 'git', 'tools', 'agentic-coding'],
        oneLiner: "MIT's practical course on shell fluency, editors, Git, debugging, packaging, and agentic coding.",
        useWhen: 'Someone can code but still feels slow around terminals, files, Git, and everyday developer tools.',
        quickStart: 'Take Course Overview, Shell, Git, Debugging, then Agentic Coding.',
        featured: true,
      },
      {
        slug: 'mdn-learn',
        name: 'MDN Learn',
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        kind: 'course',
        mode: 'free-docs',
        tags: ['web', 'html', 'css', 'javascript'],
        oneLiner: 'Structured web development tutorials from the MDN community.',
        useWhen: 'You want the web platform explained from first principles with exercises and references.',
        quickStart: 'Start with environment setup, then HTML, CSS, JavaScript.',
      },
      {
        slug: 'web-dev-learn',
        name: 'web.dev Learn',
        url: 'https://web.dev/learn',
        kind: 'course',
        mode: 'free-docs',
        tags: ['performance', 'accessibility', 'privacy', 'images'],
        oneLiner: 'Google/Chrome team courses on HTML, CSS, JavaScript, performance, accessibility, privacy, and images.',
        useWhen: 'The question is not just "does it work?" but "is it fast, accessible, responsive, and privacy-aware?"',
        quickStart: 'Pair Learn Images with Squoosh and ImageMagick, then Learn Performance.',
      },
      {
        slug: 'tldr-pages',
        name: 'tldr pages',
        url: 'https://tldr.sh/',
        kind: 'reference',
        mode: 'open-source',
        tags: ['cli', 'reference', 'examples'],
        oneLiner: 'Community-driven command examples that make man pages usable in the moment.',
        useWhen: 'You remember a command name but not the incantation.',
        quickStart: 'pipx install tldr',
        links: [{ label: 'Source', url: 'https://github.com/tldr-pages/tldr' }],
      },
      {
        slug: 'github-learn',
        name: 'GitHub Learn',
        url: 'https://learn.github.com/',
        kind: 'course',
        mode: 'free-course',
        tags: ['git', 'github', 'pull-requests'],
        oneLiner: 'Hands-on GitHub learning paths for repositories, Markdown, pull requests, and collaboration.',
        useWhen: 'A collaborator needs to get comfortable contributing without a long onboarding doc.',
        quickStart: 'Start with introduction to GitHub, then pull requests and Markdown.',
      },
      {
        slug: 'ossu-computer-science',
        name: 'OSSU Computer Science',
        url: 'https://github.com/ossu/computer-science',
        kind: 'course',
        mode: 'community',
        tags: ['computer-science', 'self-study', 'curriculum'],
        oneLiner: 'A community-maintained path to a free self-taught computer science education.',
        useWhen: 'You want a full curriculum instead of scattered tutorials.',
        quickStart: 'Read the prerequisites and follow the core sequence slowly.',
      },
      {
        slug: 'roadmap-sh',
        name: 'roadmap.sh',
        url: 'https://roadmap.sh/',
        kind: 'reference',
        mode: 'community',
        tags: ['roadmaps', 'careers', 'skills'],
        oneLiner: 'Community-created roadmaps, guides, and skill paths for modern developer roles.',
        useWhen: 'You know the direction but need a map of the concepts and order.',
        quickStart: 'Pick one path, ignore the rest for a week, and build one tiny project from it.',
      },
    ],
  },
  {
    id: 'pointcast',
    code: 'PC',
    name: 'PointCast surfaces',
    note: 'Local resources on this site that help agents and humans understand the operating system here.',
    resources: [
      {
        slug: 'pointcast-ai-stack',
        name: '/ai-stack',
        url: '/ai-stack',
        kind: 'reference',
        mode: 'free-docs',
        tags: ['pointcast', 'ai', 'tools'],
        oneLiner: "PointCast's opinionated AI tools guide: what we reach for and why.",
        useWhen: 'You want the model/tool layer behind the site, not generic AI hype.',
        quickStart: 'Read the principles first, then the daily tier.',
      },
      {
        slug: 'pointcast-stack',
        name: '/stack',
        url: '/stack',
        kind: 'reference',
        mode: 'free-docs',
        tags: ['pointcast', 'infrastructure', 'agents'],
        oneLiner: 'Technical disclosure for the runtime, content, Tezos, and agent layers.',
        useWhen: 'You need to know how PointCast is built or how to copy the agent-native pattern.',
        quickStart: 'Pair /stack with /stack.json.',
      },
      {
        slug: 'pointcast-for-agents',
        name: '/for-agents',
        url: '/for-agents',
        kind: 'reference',
        mode: 'free-docs',
        tags: ['agents', 'manifest', 'json'],
        oneLiner: 'The human-readable map of every endpoint and machine surface on PointCast.',
        useWhen: 'An agent, crawler, or builder needs the current list of ways to read this site.',
        quickStart: 'Start at /agents.json when code is doing the reading.',
      },
    ],
  },
];

export const RESOURCE_RECIPES: ResourceRecipe[] = [
  {
    title: 'Resize one image for the web',
    tool: 'ImageMagick',
    command: 'magick input.png -resize "1600x1600>" output.webp',
    note: 'Keeps aspect ratio and only shrinks images larger than the target box.',
  },
  {
    title: 'Strip visible metadata from a copy',
    tool: 'ExifTool',
    command: 'cp image.jpg clean.jpg && exiftool -all= clean.jpg',
    note: 'Work on a copy so original capture metadata stays recoverable.',
  },
  {
    title: 'Compress a screen recording',
    tool: 'FFmpeg',
    command: 'ffmpeg -i input.mov -vf "scale=1920:-2" -c:v libx264 -crf 23 -c:a aac output.mp4',
    note: 'Good default for turning a huge MOV into a shareable MP4.',
  },
  {
    title: 'Read a JSON feed without opening a browser',
    tool: 'jq',
    command: 'curl -s https://pointcast.xyz/feed.json | jq ".items[0] | {title, url}"',
    note: 'Useful for checking what an agent or feed reader sees first.',
  },
  {
    title: 'Query a CSV like a database',
    tool: 'DuckDB',
    command: 'duckdb -c "select * from read_csv_auto(\'data.csv\') limit 10"',
    note: 'Skip spreadsheet import friction when all you need is a fast look.',
  },
];

export const RESOURCE_PRINCIPLES = [
  'Prefer official links over search results for installers.',
  'Prefer local-first tools when a file contains private work.',
  'Use web apps for one-offs and CLIs for repeatable workflows.',
  'Keep source files next to exported files when the tool has its own editable format.',
  'Treat instructionals as practice fields: run the examples, do not just collect bookmarks.',
];

export function getAllResources() {
  return RESOURCE_GROUPS.flatMap((group) => group.resources.map((resource) => ({ ...resource, group: group.id })));
}
