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
  'standing-man': new URL('./people/standing-man.png', import.meta.url).href,
  'standing-woman': new URL('./people/standing-woman.png', import.meta.url).href,
}

const typing = 'coworker-typing'
const walking = 'coworker-walk'
const typingFrameHeight = 724
const typingBaseline = 712
const walkFrameSize = 443
const walkBaseline = 424
const walkFrameCount = 8

export function loadFurniture(scene: Phaser.Scene) {
  for (const [key, prop] of Object.entries(props)) scene.load.image(key, prop.url)
  for (const [key, url] of Object.entries(coworkers)) scene.load.image(key, url)
  scene.load.spritesheet(typing, new URL('./people/coworker-typing.png', import.meta.url).href, {
    frameWidth: 543, frameHeight: typingFrameHeight,
  })
  scene.load.spritesheet(walking, new URL('./people/coworker-walk.png', import.meta.url).href, {
    frameWidth: walkFrameSize, frameHeight: walkFrameSize, endFrame: walkFrameCount - 1,
  })
}

export function addFurniture(scene: Phaser.Scene, left: number, top: number, scale: number) {
  if (!scene.anims.exists(typing)) {
    scene.anims.create({
      key: typing,
      frames: scene.anims.generateFrameNumbers(typing, { frames: [0, 1, 2, 1, 2, 0, 3, 3, 0] }),
      frameRate: 5,
      repeat: -1,
    })
  }

  const placeCoworker = (key: keyof typeof coworkers | typeof typing | typeof walking,
    x: number, y: number, height: number, flip = false) => {
    const worldX = left + x * scale
    const worldY = top + y * scale
    const shadow = scene.add.ellipse(worldX, worldY, 18 * scale, 4 * scale, 0x392c23, 0.16)
    const person = scene.add.sprite(worldX, worldY, key)
    const baseline = key === walking ? walkBaseline : key === typing ? typingBaseline : person.height
    person.setOrigin(0.5, baseline / person.height).setScale(height * scale / baseline).setFlipX(flip)
    return { person, shadow }
  }

  const seatCoworker = (woman: boolean, x: number, y: number, mirrored: boolean) => {
    const { person } = placeCoworker(woman ? typing : 'seated-man', x, y, 70, woman ? !mirrored : mirrored)
    if (woman) {
      person.play({ key: typing, delay: Phaser.Math.Between(0, 900), repeatDelay: Phaser.Math.Between(400, 2400) })
    }
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
        seatCoworker(mirrored, x - 47, y - 2, mirrored)
      }
      if ((index + floor) % 3 !== 1) {
        seatCoworker(!mirrored, x + 47, y - 2, mirrored)
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

  const { person: walker, shadow } = placeCoworker(walking, 1103, 226, 80)
  const startX = walker.x
  const walkDistance = 176 * scale
  const strideLength = 58 * scale
  const passingFrame = 2
  walker.setFrame(passingFrame)
  scene.tweens.add({
    targets: walker,
    x: startX + walkDistance,
    duration: 3700,
    hold: 900,
    repeatDelay: 900,
    yoyo: true,
    repeat: -1,
    onYoyo: () => { walker.setFlipX(true) },
    onRepeat: () => { walker.setFlipX(false) },
    onUpdate: () => {
      const offset = walker.x - startX
      const travel = walker.flipX ? walkDistance - offset : offset
      const frame = travel === 0 || travel === walkDistance
        ? passingFrame
        : Math.floor((travel % strideLength) / strideLength * walkFrameCount)
      if (Number(walker.frame.name) !== frame) walker.setFrame(frame)
      shadow.x = walker.x
    },
  })
}
