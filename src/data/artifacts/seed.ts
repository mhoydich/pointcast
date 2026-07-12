/**
 * Seed artifacts pinned to canonical rooms.
 *
 * Sprint 7 of the live-artifacts arc. Hand-curated examples covering
 * all four artifact kinds so the /r/wall demo shows the full surface
 * area of the contract.
 *
 * In production these come from an addable-drop endpoint
 * (POST /artifacts/<roomId>) that writes to a KV store. For now we
 * ship the seeds inline so the page renders something useful at SSG.
 */
import type { Artifact } from '../../lib/artifact-contract';

export function seedArtifacts(): Artifact[] {
  return [
    {
      id: 'art_2026-05-14_calm-wave',
      createdAt: '2026-05-14T08:14:00-07:00',
      kind: 'svg',
      roomId: 'meditate',
      nodeId: 'pointcast',
      creator: 'cc',
      title: 'wave at calm bay',
      caption: 'inhale up the slope, hold at the crest, exhale down',
      content: {
        kind: 'svg',
        svg:
          '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg">' +
          '<rect width="240" height="60" fill="#e1ebed"/>' +
          '<path d="M0 38 Q 30 22 60 38 T 120 38 T 180 38 T 240 38" stroke="#1b3a5b" stroke-width="3" fill="none"/>' +
          '<path d="M0 48 Q 30 36 60 48 T 120 48 T 180 48 T 240 48" stroke="#1b3a5b" stroke-width="2" fill="none" opacity="0.6"/>' +
          '</svg>',
      },
    },
    {
      id: 'art_2026-05-14_quiet',
      createdAt: '2026-05-14T09:02:00-07:00',
      kind: 'one-liner',
      roomId: 'meditate',
      nodeId: 'pointcast',
      creator: 'mh',
      title: 'the silver quiet',
      content: { kind: 'one-liner', text: '"Pause in the silver quiet" is the line that always lands.' },
    },
    {
      id: 'art_2026-05-14_dawn-shore',
      createdAt: '2026-05-14T05:50:00-07:00',
      kind: 'polaroid',
      roomId: 'meditate',
      nodeId: 'pointcast',
      creator: 'manus',
      title: 'dawn shore, manhattan beach',
      caption: 'before the marine layer burned off',
      content: {
        kind: 'polaroid',
        image: 'https://pointcast.xyz/images/tokens/breathe-el-segundo.webp',
        alt: 'Cream-toned token artifact: breathe el segundo, ocean horizon at dawn',
      },
    },
    {
      id: 'art_2026-05-14_block-0337',
      createdAt: '2026-05-13T19:30:00-07:00',
      kind: 'link',
      roomId: 'meditate',
      nodeId: 'pointcast',
      creator: 'cc',
      title: 'origin block · /b/0337',
      caption: 'the block this room was born from',
      content: { kind: 'link', url: 'https://pointcast.xyz/b/0337', preview: 'PointCast b/0337' },
    },
    {
      id: 'art_2026-05-13_horizon-stripe',
      createdAt: '2026-05-13T19:42:00-07:00',
      kind: 'svg',
      roomId: 'sunset',
      nodeId: 'pointcast',
      creator: 'mh',
      title: 'last-light stripe',
      caption: 'the horizon at 7:42 PM yesterday',
      content: {
        kind: 'svg',
        svg:
          '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg">' +
          '<rect x="0" y="0" width="240" height="14" fill="#3d2b56"/>' +
          '<rect x="0" y="14" width="240" height="14" fill="#9a4f6a"/>' +
          '<rect x="0" y="28" width="240" height="14" fill="#d96752"/>' +
          '<rect x="0" y="42" width="240" height="10" fill="#fcd17a"/>' +
          '<rect x="0" y="52" width="240" height="8" fill="#1a0e26"/>' +
          '<circle cx="170" cy="44" r="6" fill="#ffe2a0"/>' +
          '</svg>',
      },
    },
    {
      id: 'art_2026-05-13_pelicans',
      createdAt: '2026-05-13T19:55:00-07:00',
      kind: 'one-liner',
      roomId: 'sunset',
      nodeId: 'pointcast',
      creator: 'mh',
      title: 'four pelicans, low',
      content: { kind: 'one-liner', text: 'Four pelicans crossing the boardwalk in tight V, lit coral from below.' },
    },
    {
      id: 'art_2026-05-14_first-pour',
      createdAt: '2026-05-14T06:22:00-07:00',
      kind: 'one-liner',
      roomId: 'coffee',
      nodeId: 'pointcast',
      creator: 'mh',
      title: 'first pour of the day',
      content: { kind: 'one-liner', text: 'Beans were two weeks past roast. Still good. Pot on.' },
    },
  ];
}
