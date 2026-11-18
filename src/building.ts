import Phaser from 'phaser'

export const worldWidth = 1731
export const worldHeight = 909

const cityArt = 'city-background'
const tiles = [
  { key: 'upper-left', url: new URL('./building/upper-left.png', import.meta.url).href, x: 0, y: 30, width: 890, height: 397 },
  { key: 'upper-right', url: new URL('./building/upper-right.png', import.meta.url).href, x: 850, y: 30, width: 881, height: 397 },
  { key: 'lower-left', url: new URL('./building/lower-left.png', import.meta.url).href, x: 0, y: 398, width: 890, height: 395 },
  { key: 'lower-right', url: new URL('./building/lower-right.png', import.meta.url).href, x: 850, y: 398, width: 881, height: 395 },
]

export function loadBuilding(scene: Phaser.Scene) {
  scene.load.image(cityArt, new URL('./office-background.png', import.meta.url).href)
  for (const { key, url } of tiles) scene.load.image(key, url)
}

export function addBuilding(scene: Phaser.Scene) {
  scene.add.image(0, 0, cityArt).setOrigin(0).setDisplaySize(worldWidth, worldHeight)
    .setName('City background')

  for (const { key, x, y, width, height } of tiles) {
    scene.add.image(x, y, key).setOrigin(0).setDisplaySize(width, height).setName(key)
  }
}
