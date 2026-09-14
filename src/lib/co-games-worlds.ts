/** Places in a small story. Combat rules stay in co-games-engine. */
export const coGameWorlds = {
  garden: {
    chapter: 1, name: 'Lantern grove', src: '/images/co-games/worlds/lantern-grove.webp',
    story: 'A little star is lost. Follow its glow through the trees.',
    arrival: 'The lanterns are waking. Win a friendly duel to find the trail.',
    victory: 'The grove lights a path to a diner floating in the night.',
    position: 'center 62%', theme: 'forest',
  },
  rush: {
    chapter: 2, name: 'Midnight diner', src: '/images/co-games/worlds/midnight-diner.webp',
    story: 'The night crew saw your star racing toward the sea.',
    arrival: 'One quick stop. The night crew has a challenge for you.',
    victory: 'The night crew points you toward a gate beneath the tide.',
    position: 'center 62%', theme: 'diner',
  },
  shell: {
    chapter: 3, name: 'Tideglass ruins', src: '/images/co-games/worlds/tideglass-ruins.webp',
    story: 'The tide keeps an old gate. Give its shell time to soften.',
    arrival: 'The gate is wearing a shell. Time your strongest spell.',
    victory: 'The old gate opens. Your star catches the moonlight express.',
    position: 'center 62%', theme: 'tide',
  },
  storm: {
    chapter: 4, name: 'Moon station', src: '/images/co-games/worlds/moon-station.webp',
    story: 'A train is waiting. Help the little star make it home.',
    arrival: 'One last friendly duel before the moonlight train leaves.',
    victory: 'The little star is home. There is always another way to wander.',
    position: 'center 62%', theme: 'moon',
  },
} as const;
export type CoGameWorldId = keyof typeof coGameWorlds;
