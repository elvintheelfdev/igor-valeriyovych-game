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

const coworkers = {
  'seated-man': new URL('./people/seated-man.png', import.meta.url).href,
  'seated-woman': new URL('./people/seated-woman.png', import.meta.url).href,
  'standing-man': new URL('./people/standing-man.png', import.meta.url).href,
  'standing-woman': new URL('./people/standing-woman.png', import.meta.url).href,
}

export function loadFurniture(scene: Phaser.Scene) {
  for (const [key, prop] of Object.entries(props)) scene.load.image(key, prop.url)
  for (const [key, url] of Object.entries(coworkers)) scene.load.image(key, url)
}

export function addFurniture(scene: Phaser.Scene, left: number, top: number, scale: number) {
  const placeCoworker = (key: keyof typeof coworkers, x: number, y: number, height: number, flip = false) => {
    const worldX = left + x * scale
    const worldY = top + y * scale
    scene.add.ellipse(worldX, worldY, 18 * scale, 4 * scale, 0x392c23, 0.16)
    const person = scene.add.image(worldX, worldY, key).setOrigin(0.5, 1)
    person.setScale(height * scale / person.height).setFlipX(flip)
  }

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
      const mirrored = (index + floor) % 2 === 1
      place('paired-workstations', x, y, mirrored)
      if ((index + floor) % 4 !== 3) {
        placeCoworker(mirrored ? 'seated-woman' : 'seated-man', x - 47, y - 2, 70, mirrored)
      }
      if ((index + floor) % 3 !== 1) {
        placeCoworker(mirrored ? 'seated-man' : 'seated-woman', x + 47, y - 2, 70, mirrored)
      }
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
  placeCoworker('standing-man', 1290, 786, 80)
  placeCoworker('standing-woman', 1350, 786, 77)
  placeCoworker('standing-man', 1103, 226, 80, true)
}
