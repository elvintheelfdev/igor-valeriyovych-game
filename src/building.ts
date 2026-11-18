import Phaser from 'phaser'

export const worldWidth = 1731
export const worldHeight = 909

const cityArt = 'city-background'
const officeArt = 'office-building'
const artWidth = 1905
const artHeight = 825
const artScale = (worldWidth / artWidth) * 0.85
const buildingLeft = 32
const foundationY = 766
const buildingTop = foundationY - artHeight * artScale
// Foot positions are on the visible floor just in front of the elevator doors.
export const floorLevels = [782, 603, 422, 239].map(y => buildingTop + y * artScale)
export const elevatorX = buildingLeft + 304 * artScale
export const floorBounds = { left: buildingLeft + 273 * artScale, right: buildingLeft + 1749 * artScale }

export function loadBuilding(scene: Phaser.Scene) {
  scene.load.image(cityArt, new URL('./office-background.png', import.meta.url).href)
  scene.load.image(officeArt, new URL('./building/office.png', import.meta.url).href)
}

export function addBuilding(scene: Phaser.Scene) {
  scene.add.image(0, 0, cityArt).setOrigin(0).setDisplaySize(worldWidth, worldHeight)
    .setName('City background')

  scene.add.image(buildingLeft, buildingTop, officeArt).setOrigin(0).setScale(artScale)
    .setName('Office building')
}
