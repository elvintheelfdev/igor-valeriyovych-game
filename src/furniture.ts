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
    // Align the animated hips with the seat cushion and the hands with the keyboard.
    const { person } = woman
      ? placeCoworker(typing, x + (mirrored ? 8 : -8), y - 12, 64, !mirrored)
      : placeCoworker('seated-man', x + (mirrored ? -4 : 4), y - 12, 66, mirrored)
    if (woman) {
      person.play({ key: typing, delay: Phaser.Math.Between(0, 900), repeatDelay: Phaser.Math.Between(400, 2400) })
    }
  }

  const addMonitorContent = (workstation: Phaser.GameObjects.Image) => {
    const graphics = scene.add.graphics()
    const screens = [
      { left: 130, top: 6, tilt: 14, lean: -8, accent: 0x79b7dc },
      { left: 209, top: 20, tilt: -14, lean: 8, accent: 0x8cc8a8 },
    ]

    for (const screen of screens) {
      const point = (u: number, v: number) => {
        const x = screen.left + 29 * u + screen.lean * v - workstation.width / 2
        const y = screen.top + screen.tilt * u + 44 * v - workstation.height
        return new Phaser.Math.Vector2(
          workstation.x + x * workstation.scaleX * (workstation.flipX ? -1 : 1),
          workstation.y + y * workstation.scaleY,
        )
      }
      const panel = (x: number, y: number, width: number, height: number, color: number) => {
        graphics.fillStyle(color)
        graphics.fillPoints([
          point(x, y), point(x + width, y),
          point(x + width, y + height), point(x, y + height),
        ], true)
      }

      panel(0.06, 0.06, 0.88, 0.88, 0x263849)
      panel(0.10, 0.10, 0.80, 0.12, screen.accent)
      for (const [row, width] of [0.61, 0.43, 0.68, 0.50, 0.57].entries()) {
        const y = 0.33 + row * 0.105
        panel(0.13, y, 0.08, 0.035, screen.accent)
        panel(0.26, y, width * 0.88, 0.035, 0xc4d6e1)
      }
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
    const furniture = scene.add.image(worldX, worldY, key)
      .setOrigin(0.5, 1).setDisplaySize(width, height).setFlipX(flip)
    if (key === 'paired-workstations') addMonitorContent(furniture)
    return furniture
  }

  const armrests = 'workstation-armrests'
  if (!scene.textures.exists(armrests)) {
    const artwork = scene.textures.get('paired-workstations').getSourceImage() as HTMLImageElement
    const texture = scene.textures.createCanvas(armrests, artwork.width, artwork.height)
    if (!texture) throw new Error('Could not create workstation armrest texture')
    const context = texture.context
    const nearArmrest = [[30, 95], [44, 90], [68, 92], [68, 100], [51, 103],
      [47, 116], [43, 139], [30, 142], [36, 116], [39, 102]]

    // Trace the front armrests from the workstation artwork so they can cover the seated sprites.
    context.beginPath()
    for (const mirrored of [false, true]) {
      for (const [index, [x, y]] of nearArmrest.entries()) {
        const sourceX = mirrored ? artwork.width - x : x
        if (index === 0) context.moveTo(sourceX, y)
        else context.lineTo(sourceX, y)
      }
      context.closePath()
    }
    context.clip()
    context.drawImage(artwork, 0, 0)
    texture.refresh()
  }

  for (const [floor, y] of [779, 605, 417].entries()) {
    const centers = floor === 0 ? [446, 668, 890, 1112] : [432, 648, 864, 1080, 1296, 1512]
    for (const [index, x] of centers.entries()) {
      const mirrored = (index + floor) % 2 === 1
      const workstation = place('paired-workstations', x, y, mirrored)
      if ((index + floor) % 4 !== 3) {
        seatCoworker(mirrored, x - 47, y - 2, mirrored)
      }
      if ((index + floor) % 3 !== 1) {
        seatCoworker(!mirrored, x + 47, y - 2, mirrored)
      }
      scene.add.image(workstation.x, workstation.y, armrests)
        .setOrigin(0.5, 1)
        .setScale(workstation.scaleX, workstation.scaleY)
        .setFlipX(mirrored)
      // Draw the front of the desk over the legs while leaving the typing hands visible.
      scene.add.image(workstation.x, workstation.y, workstation.texture.key)
        .setOrigin(0.5, 1)
        .setScale(workstation.scaleX, workstation.scaleY)
        .setFlipX(mirrored)
        .setCrop(96, 94, 175, workstation.height - 94)
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
