import Phaser from 'phaser'

const props = {
  'paired-workstations': {
    url: new URL('./furniture/paired-workstations.png', import.meta.url).href,
    height: 78,
  },
  'meeting-table': {
    url: new URL('./furniture/meeting-table.png', import.meta.url).href,
    height: 86,
  },
  'executive-desk': {
    url: new URL('./furniture/executive-desk.png', import.meta.url).href,
    height: 88,
  },
  sideboard: {
    url: new URL('./furniture/sideboard.png', import.meta.url).href,
    height: 68,
  },
  kitchenette: {
    url: new URL('./furniture/kitchenette.png', import.meta.url).href,
    height: 123,
  },
}

export function loadFurniture(scene: Phaser.Scene) {
  for (const [key, prop] of Object.entries(props)) scene.load.image(key, prop.url)
}

export function addFurniture(scene: Phaser.Scene, left: number, top: number, scale: number) {
  const place = (key: keyof typeof props, x: number, y: number, flip = false) => {
    const worldX = left + x * scale
    const worldY = top + y * scale
    const texture = scene.textures.getFrame(key)
    const height = props[key].height * scale
    const width = height * texture.width / texture.height
    if (key === 'paired-workstations') {
      scene.add.ellipse(worldX, worldY - height * 0.025, width * 0.48, 5 * scale, 0x392c23, 0.16)
      for (const side of [-1, 1]) {
        scene.add.ellipse(worldX + side * width * 0.35, worldY - height * 0.05,
          width * 0.065, 4 * scale, 0x392c23, 0.19)
        for (const wheel of [0.25, 0.48]) {
          scene.add.ellipse(worldX + side * width * wheel, worldY - height * 0.095,
            width * 0.043, 3 * scale, 0x392c23, 0.14)
        }
      }
    } else if (key === 'meeting-table') {
      const contacts = [
        { x: -0.46, y: 0.11, width: 0.045 },
        { x: -0.34, y: 0.015, width: 0.05 },
        { x: 0, y: 0.09, width: 0.3 },
        { x: 0.34, y: 0.015, width: 0.05 },
        { x: 0.46, y: 0.11, width: 0.045 },
      ]
      for (const contact of contacts) {
        scene.add.ellipse(worldX + contact.x * width, worldY - contact.y * height,
          contact.width * width, 3 * scale, 0x392c23, 0.15)
      }
    } else {
      scene.add.ellipse(worldX, worldY - scale, width * 0.94, 7 * scale, 0x392c23, 0.16)
    }
    scene.add.image(worldX, worldY, key).setOrigin(0.5, 1).setDisplaySize(width, height).setFlipX(flip)
  }

  for (const [floor, y] of [779, 605, 417].entries()) {
    const centers = floor === 0 ? [446, 668, 890, 1112] : [432, 648, 864, 1080, 1296, 1512]
    for (const [index, x] of centers.entries()) {
      place('paired-workstations', x, y, (index + floor) % 2 === 1)
    }
  }
  place('kitchenette', 1432, 779)

  const topFloor = 217
  place('sideboard', 390, topFloor)
  place('paired-workstations', 555, topFloor)
  place('paired-workstations', 730, topFloor, true)
  place('meeting-table', 1007, topFloor + 10)
  place('executive-desk', 1415, topFloor)
  place('sideboard', 1539, topFloor, true)
}
