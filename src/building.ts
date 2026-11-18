import Phaser from 'phaser'

export const worldWidth = 1731
export const worldHeight = 909

const cityArt = 'city-background'
const canopyArt = 'entrance-canopy'
const canopy = { x: 986, y: 512, width: 286, height: 39 }
const canopyOutline = [
  [986, 536], [1022, 512], [1272, 512],
  [1272, 526], [1022, 526], [986, 551],
]
// Keep a narrow overlap so filtered edges cannot expose the city behind the roof.
const canopyCutout = [
  [987, 537], [1022, 513], [1271, 513],
  [1271, 525], [1022, 525], [987, 549],
]

const buildingOutline = [
  [14, 37], [1672, 37], [1672, 45], [1665, 51], [1669, 54],
  [1669, 68], [1654, 74], [1654, 94], [1650, 101], [1636, 111],
  [1636, 221], [1644, 221], [1644, 234], [1636, 237],
  [1636, 378], [1644, 379], [1644, 392], [1636, 395], [1635, 520],
  [1725, 520], [1725, 549], [1708, 549], [1708, 716], [1731, 721],
  [1731, 771], [1631, 771], [1631, 744], [1347, 744], [1347, 771],
  [968, 771], [968, 745], [128, 745], [128, 755], [41, 755],
  [41, 719], [0, 719], [0, 679], [22, 675], [22, 666], [27, 665],
  [27, 534], [23, 534], [23, 520], [27, 519], [27, 391],
  [24, 389], [24, 376], [28, 376], [28, 232], [24, 229],
  [24, 218], [28, 217], [28, 76], [20, 65], [20, 55], [14, 50],
]

const tiles = [
  { key: 'upper-left', url: new URL('./building/upper-left.png', import.meta.url).href, x: 0, y: 30, width: 890, height: 397 },
  { key: 'upper-right', url: new URL('./building/upper-right.png', import.meta.url).href, x: 850, y: 30, width: 881, height: 397 },
  { key: 'lower-left', url: new URL('./building/lower-left.png', import.meta.url).href, x: 0, y: 398, width: 890, height: 395 },
  { key: 'lower-right', url: new URL('./building/lower-right.png', import.meta.url).href, x: 850, y: 398, width: 881, height: 395 },
]

// Glass apertures are measured in each source texture's native pixels.
// Window frames and the lit lobby stay in the architecture layer.
const windowRows: Record<string, [number, number, number[]][]> = {
  'upper-left': [
    [194, 393, [74, 128]],
    [515, 727, [74, 126]],
    [777, 838, [74, 126]],
    [168, 374, [1151, 1239, 1251, 1333, 1344, 1420, 1430, 1546, 1555, 1647, 1657, 1755, 1763, 1877]],
    [486, 706, [1103, 1193, 1203, 1304, 1314, 1407, 1417, 1509, 1520, 1630, 1644, 1756, 1766, 1862, 1869, 1877]],
    [486, 703, [678, 723, 747, 797]],
  ],
  'upper-right': [
    [176, 377, [0, 89, 100, 193, 205, 276, 285, 362, 376, 453]],
    [177, 378, [1081, 1136, 1152, 1211, 1226, 1283, 1298, 1367, 1381, 1450, 1465, 1526]],
    [489, 709, [0, 65, 74, 173, 186, 275, 288, 391, 404, 531, 542, 649, 663, 764, 778, 855]],
    [490, 708, [1157, 1230, 1245, 1316, 1333, 1402, 1416, 1480]],
  ],
  'lower-left': [
    [0, 65, [78, 128]],
    [85, 255, [78, 129]],
    [308, 404, [77, 129]],
    [420, 555, [77, 128]],
    [50, 216, [647, 660, 680, 716]],
    [39, 216, [1084, 1173, 1183, 1230, 1237, 1282, 1292, 1394, 1405, 1473, 1483, 1541, 1553, 1655, 1664, 1708, 1712, 1766, 1776, 1869]],
    [351, 383, [1749, 1773, 1780, 1802]],
    [394, 424, [1749, 1773, 1780, 1802]],
    [435, 468, [1749, 1773, 1780, 1802]],
  ],
  'lower-right': [
    [39, 216, [0, 77, 625, 702, 716, 812, 826, 875, 886, 985, 1000, 1104, 1116, 1201, 1212, 1278, 1290, 1339]],
    [52, 83, [176, 195, 204, 230]],
    [90, 117, [176, 195, 204, 230]],
    [123, 147, [176, 195, 204, 230]],
  ],
}

const angledWindows: Record<string, number[][][]> = {
  'upper-left': [
    [[75, 107], [127, 149], [127, 177], [75, 177]],
    [[74, 448], [126, 482], [126, 505], [74, 505]],
  ],
  'upper-right': [
    [[1541, 184], [1577, 164], [1577, 393], [1541, 383]],
    [[1496, 486], [1521, 474], [1521, 716], [1496, 711]],
    [[1535, 469], [1558, 458], [1558, 722], [1535, 718]],
    [[1571, 453], [1597, 444], [1597, 726], [1571, 723]],
  ],
  'lower-right': [
    [[1403, 60], [1427, 43], [1427, 229], [1403, 220]],
    [[1441, 39], [1469, 25], [1469, 233], [1441, 228]],
    [[1483, 24], [1524, 6], [1524, 240], [1483, 234]],
    [[1538, 4], [1563, 0], [1563, 247], [1538, 241]],
    [[1577, 0], [1605, 0], [1605, 252], [1577, 247]],
  ],
}

function trace(context: CanvasRenderingContext2D, points: number[][]) {
  context.beginPath()
  for (const [x, y] of points) context.lineTo(x, y)
  context.closePath()
}

function feather(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, vertical: boolean) {
  const fade = context.createLinearGradient(x, y, x + (vertical ? 0 : width), y + (vertical ? height : 0))
  fade.addColorStop(0, '#000')
  fade.addColorStop(1, 'transparent')
  context.globalCompositeOperation = 'destination-out'
  context.fillStyle = fade
  context.fillRect(x, y, width, height)
  context.globalCompositeOperation = 'source-over'
}

export function loadBuilding(scene: Phaser.Scene) {
  scene.load.image(cityArt, new URL('./office-background.png', import.meta.url).href)
  for (const { key, url } of tiles) scene.load.image(key, url)
}

export function addBuilding(scene: Phaser.Scene) {
  scene.add.image(0, 0, cityArt).setOrigin(0).setDisplaySize(worldWidth, worldHeight)
    .setName('City background')

  for (const { key, x, y, width, height } of tiles) {
    const textureKey = `building-${key}`
    if (!scene.textures.exists(textureKey)) {
      const source = scene.textures.get(key).getSourceImage() as HTMLImageElement
      const scaleX = source.width / width
      const scaleY = source.height / height
      const tile = scene.textures.createCanvas(textureKey, source.width, source.height)!
      const context = tile.context
      context.setTransform(scaleX, 0, 0, scaleY, -x * scaleX, -y * scaleY)
      context.save()
      trace(context, buildingOutline)
      context.clip()
      context.drawImage(source, x, y, width, height)
      context.restore()

      context.save()
      context.resetTransform()
      context.globalCompositeOperation = 'destination-out'
      context.fillStyle = '#000'
      for (const [top, bottom, edges] of windowRows[key]) {
        for (let index = 0; index < edges.length; index += 2) {
          context.fillRect(edges[index], top, edges[index + 1] - edges[index], bottom - top)
        }
      }
      for (const pane of angledWindows[key] ?? []) {
        trace(context, pane)
        context.fill()
      }
      context.restore()

      if (x > 0) feather(context, x, y, 40, height, false)
      if (y === 30) {
        context.clearRect(x, 412, width, y + height - 412)
      } else {
        feather(context, x, y, width, 14, true)
      }
      if (key === 'lower-right') {
        const foreground = scene.textures.createCanvas(
          canopyArt, Math.ceil(canopy.width * scaleX), Math.ceil(canopy.height * scaleY),
        )!
        const roof = foreground.context
        roof.setTransform(scaleX, 0, 0, scaleY, -canopy.x * scaleX, -canopy.y * scaleY)
        roof.save()
        trace(roof, canopyOutline)
        roof.clip()
        roof.drawImage(source, x, y, width, height)
        roof.restore()
        foreground.refresh()

        trace(context, canopyCutout)
        context.globalCompositeOperation = 'destination-out'
        context.fillStyle = '#000'
        context.fill()
        context.globalCompositeOperation = 'source-over'
      }
      tile.refresh()
    }
    scene.add.image(x, y, textureKey).setOrigin(0).setDisplaySize(width, height).setName(key)
  }
}

export function addCanopy(scene: Phaser.Scene) {
  scene.add.image(canopy.x, canopy.y, canopyArt).setOrigin(0)
    .setDisplaySize(canopy.width, canopy.height).setName('Entrance canopy').setDepth(1)
}
