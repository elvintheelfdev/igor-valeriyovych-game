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
// Foot positions follow the center of each elevator threshold.
export const floorLevels = [765, 588, 408, 227].map(y => buildingTop + y * artScale)
export const elevatorX = buildingLeft + 304 * artScale
export const floorBounds = { left: elevatorX, right: buildingLeft + 1749 * artScale }

const artX = (x: number) => buildingLeft + x * artScale
const artY = (y: number) => buildingTop + y * artScale
const groundRoute = [
  { x: artX(1648), y: floorLevels[0] },
  { x: artX(1812), y: artY(778) },
  { x: artX(1902), y: artY(807) },
  { x: artX(1932), y: 780 },
]
export const streetRight = worldWidth - 24
export const entranceX = groundRoute[1].x
export const interiorDoorX = artX(1708)
export const sidewalkStart = groundRoute[groundRoute.length - 1].x
export const entranceBounds = new Phaser.Geom.Rectangle(
  artX(1766), artY(614), 110 * artScale, 172 * artScale,
)
export const interiorDoorBounds = new Phaser.Geom.Rectangle(
  interiorDoorX - 40 * artScale, groundY(interiorDoorX) - 122 * artScale, 80 * artScale, 128 * artScale,
)
export const sidewalkBounds = new Phaser.Geom.Rectangle(
  groundRoute[1].x, artY(786), streetRight - groundRoute[1].x, 805 - artY(786),
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

export function loadBuilding(scene: Phaser.Scene) {
  scene.load.image(cityArt, new URL('./office-background.png', import.meta.url).href)
  scene.load.image(officeArt, new URL('./building/office.png', import.meta.url).href)
}

export function addBuilding(scene: Phaser.Scene) {
  scene.add.image(0, 0, cityArt).setOrigin(0).setDisplaySize(worldWidth, worldHeight)
    .setName('City background')

  scene.add.image(buildingLeft, buildingTop, officeArt, '__BASE').setOrigin(0).setScale(artScale)
    .setName('Office building')

  const texture = scene.textures.get(officeArt)
  const source = texture.getSourceImage('__BASE') as HTMLImageElement
  if (!texture.has('door-left')) {
    texture.add('door-left', 0, 1777, 666, 34, 121)
    texture.add('door-right', 0, 1811, 666, 35, 121)
  }

  const interiorArt = 'interior-office-door'
  if (!scene.textures.exists(interiorArt)) {
    const resolution = 3
    const warped = scene.textures.createCanvas(interiorArt, 80 * resolution, 132 * resolution)!
    for (let x = 0; x < warped.width; x++) {
      const fraction = x / (warped.width - 1)
      const top = Phaser.Math.Linear(24, 1, fraction)
      const bottom = Phaser.Math.Linear(102, 131, fraction)
      const sourceTop = Phaser.Math.Linear(666, 672, fraction)
      const sourceBottom = Phaser.Math.Linear(775, 786, fraction)
      warped.context.drawImage(source, 1849 - fraction * 77, sourceTop, 1, sourceBottom - sourceTop,
        x, top * resolution, 1, (bottom - top) * resolution)
    }
    warped.refresh()
    warped.add('door-left', 0, 15, 0, 105, 396)
    warped.add('door-right', 0, 120, 0, 102, 396)
  }

  const addDoor = (centerX: number, top: number, hasFrame: boolean) => {
    if (hasFrame) {
      scene.add.image(centerX - 40 * artScale, top, interiorArt, '__BASE')
        .setOrigin(0).setScale(artScale / 3).setName('Interior door frame')
    }

    const opening = scene.add.graphics({ x: centerX, y: top }).setScale(artScale).setVisible(false)
    opening.fillStyle(0x393a32).fillPoints(hasFrame ? [
      { x: -35, y: 24 }, { x: 34, y: 6 }, { x: 34, y: 127 }, { x: -35, y: 103 },
    ] : [
      { x: -34, y: 0 }, { x: 35, y: -2 }, { x: 35, y: 108 }, { x: -34, y: 121 },
    ], true)
    opening.fillStyle(0x645a4b).fillGradientStyle(0x615a4b, 0x7d7260, 0x302f29, 0x453f34).fillPoints(hasFrame ? [
      { x: -29, y: 28 }, { x: 28, y: 13 }, { x: 28, y: 114 }, { x: -29, y: 95 },
    ] : [
      { x: -28, y: 6 }, { x: 29, y: 4 }, { x: 29, y: 100 }, { x: -28, y: 111 },
    ], true)
    opening.fillStyle(0xa99b85).fillGradientStyle(0x655949, 0x786a55, 0xb9aa94, 0xa99b85).fillPoints(hasFrame ? [
      { x: -35, y: 93 }, { x: 24, y: 105 }, { x: 34, y: 127 }, { x: -35, y: 103 },
    ] : [
      { x: -34, y: 99 }, { x: 21, y: 89 }, { x: 35, y: 108 }, { x: -34, y: 121 },
    ], true)

    const panelArt = hasFrame ? interiorArt : officeArt
    const panelScale = hasFrame ? artScale / 3 : artScale
    const left = scene.add.image(centerX - (hasFrame ? 35 : 34) * artScale, top, panelArt, 'door-left')
      .setOrigin(0).setName('Left door panel')
    const right = scene.add.image(centerX + (hasFrame ? 34 : 35) * artScale, top, panelArt, 'door-right')
      .setOrigin(1, 0).setName('Right door panel')

    return (progress: number) => {
      const open = progress > 0
      const width = Math.cos(progress * Math.PI * 0.42) * panelScale
      opening.setVisible(open)
      left.setVisible(open).setScale(width, panelScale)
      right.setVisible(open).setScale(width, panelScale)
    }
  }

  const interior = addDoor(interiorDoorX, groundY(interiorDoorX) - 117 * artScale, true)
  const street = addDoor(artX(1811), artY(666), false)
  interior(0)
  street(0)
  return { interior, street }
}
