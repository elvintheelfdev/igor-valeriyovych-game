import Phaser from 'phaser'

export const worldWidth = 1731
export const worldHeight = 909

const cityArt = 'city-background'
const artWidth = 1905
const artHeight = 826
const artScale = (worldWidth / artWidth) * 0.85
const buildingLeft = (worldWidth - artWidth * artScale) / 2
const foundationY = 766
const buildingTop = foundationY - artHeight * artScale
const leftTileWidth = 952 * artScale
const rightTileWidth = (artWidth - 952) * artScale
const tileHeight = (artHeight / 2) * artScale
export const floorLevels = [779, 597, 415, 234].map(y => buildingTop + y * artScale)
export const elevatorX = buildingLeft + 198 * artScale
export const floorBounds = { left: buildingLeft + 116 * artScale, right: buildingLeft + 1764 * artScale }

const tiles = [
  { key: 'upper-left', url: new URL('./building/upper-left.png', import.meta.url).href, x: 0, y: buildingTop, width: leftTileWidth },
  { key: 'upper-right', url: new URL('./building/upper-right.png', import.meta.url).href, x: leftTileWidth, y: buildingTop, width: rightTileWidth },
  { key: 'lower-left', url: new URL('./building/lower-left.png', import.meta.url).href, x: 0, y: buildingTop + tileHeight, width: leftTileWidth },
  { key: 'lower-right', url: new URL('./building/lower-right.png', import.meta.url).href, x: leftTileWidth, y: buildingTop + tileHeight, width: rightTileWidth },
]

export function loadBuilding(scene: Phaser.Scene) {
  scene.load.image(cityArt, new URL('./office-background.png', import.meta.url).href)
  for (const { key, url } of tiles) scene.load.image(key, url)
}

export function addBuilding(scene: Phaser.Scene) {
  scene.add.image(0, 0, cityArt).setOrigin(0).setDisplaySize(worldWidth, worldHeight)
    .setName('City background')

  for (const { key, x, y, width } of tiles) {
    scene.add.image(buildingLeft + x, y, key).setOrigin(0).setDisplaySize(width, tileHeight).setName(key)
  }
}
