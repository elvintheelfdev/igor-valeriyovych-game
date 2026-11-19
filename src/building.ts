import Phaser from 'phaser'
import { addFurniture, loadFurniture } from './furniture'

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
// Foot positions follow the center of each elevator threshold.
export const floorLevels = [781, 604, 416, 222].map(y => buildingTop + y * artScale)
export const elevatorX = buildingLeft + 274 * artScale
export const floorBounds = { left: elevatorX, right: buildingLeft + 1749 * artScale }

const artX = (x: number) => buildingLeft + x * artScale
const artY = (y: number) => buildingTop + y * artScale
const exitThresholdY = artY(786)
export const interiorDoorX = artX(1715)
const groundRoute = [
  { x: elevatorX, y: floorLevels[0] },
  { x: artX(350), y: artY(793) },
  { x: artX(1595), y: artY(793) },
  { x: interiorDoorX, y: exitThresholdY },
  { x: artX(1902), y: exitThresholdY },
]
export const streetRight = worldWidth - 24
export const sidewalkStart = groundRoute[groundRoute.length - 1].x
export const entranceX = sidewalkStart
export const interiorDoorBounds = new Phaser.Geom.Rectangle(
  artX(1664), artY(646), 101 * artScale, 152 * artScale,
)
export const sidewalkBounds = new Phaser.Geom.Rectangle(
  sidewalkStart, 698, streetRight - sidewalkStart, 107,
)

export function groundY(x: number) {
  if (x <= groundRoute[0].x) return floorLevels[0]
  for (let i = 1; i < groundRoute.length; i++) {
    const start = groundRoute[i - 1]
    const end = groundRoute[i]
    if (x <= end.x) return Phaser.Math.Linear(start.y, end.y, (x - start.x) / (end.x - start.x))
  }
  return groundRoute[groundRoute.length - 1].y
}

const rightWallStart = artX(1595)
const aisleLevels = [793, 618, 430, 235].map(artY)
// Keep feet on the floor in front of the angled wall on each upper floor.
const rightFloorEdge = [781, 620, 432, 235].map(artY)

export function walkingY(floor: number, x: number) {
  if (floor === 0) return groundY(x)
  if (x < rightWallStart) {
    const approach = Phaser.Math.Clamp((x - elevatorX) / (artX(350) - elevatorX), 0, 1)
    return Phaser.Math.Linear(floorLevels[floor], aisleLevels[floor], approach)
  }
  const progress = Phaser.Math.Clamp((x - rightWallStart) / (floorBounds.right - rightWallStart), 0, 1)
  return Phaser.Math.Linear(aisleLevels[floor], rightFloorEdge[floor], progress)
}

export function loadBuilding(scene: Phaser.Scene) {
  scene.load.image(cityArt, new URL('./office-background.png', import.meta.url).href)
  scene.load.image(officeArt, new URL('./building/office.png', import.meta.url).href)
  loadFurniture(scene)
}

export function addBuilding(scene: Phaser.Scene) {
  scene.add.image(0, 0, cityArt).setOrigin(0).setDisplaySize(worldWidth, worldHeight)
    .setName('City background')

  scene.add.image(buildingLeft, buildingTop, officeArt, '__BASE').setOrigin(0).setScale(artScale)
    .setName('Office building')
  addFurniture(scene, buildingLeft, buildingTop, artScale)

  const texture = scene.textures.get(officeArt)
  if (!texture.has('exit-left')) {
    texture.add('exit-left', 0, 1671, 671, 44, 122)
    texture.add('exit-right', 0, 1715, 671, 44, 122)
  }
  const opening = scene.add.graphics({ x: artX(1671), y: artY(671) }).setScale(artScale)
  opening.fillStyle(0x000000).fillPoints([
    { x: 0, y: 0 }, { x: 88, y: 1 }, { x: 88, y: 122 }, { x: 0, y: 106 },
  ], true)
  const leftExit = scene.add.image(artX(1671), artY(671), officeArt, 'exit-left').setOrigin(0)
  const rightExit = scene.add.image(artX(1759), artY(671), officeArt, 'exit-right').setOrigin(1, 0)
  const interior = (progress: number) => {
    const open = progress > 0
    const width = Math.cos(progress * Math.PI * 0.42) * artScale
    opening.setVisible(open)
    leftExit.setVisible(open).setScale(width, artScale)
    rightExit.setVisible(open).setScale(width, artScale)
  }

  const lifts = [
    { top: 672, rightTop: 1, bottom: 114, rightBottom: 102 },
    { top: 490, rightTop: 2, bottom: 118, rightBottom: 107 },
    { top: 297, rightTop: 3, bottom: 124, rightBottom: 112 },
    { top: 100, rightTop: 7, bottom: 126, rightBottom: 115 },
  ].map(({ top, rightTop, bottom, rightBottom }, floor) => {
    const frame = `lift-door-${floor}`
    if (!texture.has(frame)) texture.add(frame, 0, 258, top, 32, bottom)
    const opening = scene.add.graphics({ x: artX(258), y: artY(top) }).setScale(artScale)
    opening.fillStyle(0x000000).fillPoints([
      { x: 0, y: 0 }, { x: 32, y: rightTop }, { x: 32, y: rightBottom }, { x: 0, y: bottom },
    ], true)
    const left = scene.add.image(artX(258), artY(top), officeArt, frame).setOrigin(0)
    const right = scene.add.image(artX(290), artY(top), officeArt, frame).setOrigin(1, 0)
    return (progress: number) => {
      const width = Math.round(16 * (1 - progress))
      opening.setVisible(progress > 0)
      left.setScale(artScale).setCrop(0, 0, width, bottom).setVisible(progress > 0 && width > 0)
      right.setScale(artScale).setCrop(32 - width, 0, width, bottom).setVisible(progress > 0 && width > 0)
    }
  })
  lifts.forEach(draw => draw(0))
  interior(0)

  return { interior, lifts }
}
