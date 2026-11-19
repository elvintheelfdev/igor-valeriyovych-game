import Phaser from 'phaser'
import type { OfficeNPC } from './incidents'

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

const coworkerArt = {
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

const seatedCrew = 'seated-crew'
const coffeeCrew = 'coffee-crew'

function registerCrewFrames(scene: Phaser.Scene, key: string, columns: number, rows: number, count: number) {
  const texture = scene.textures.get(key)
  if (texture.has('0')) return texture
  const image = texture.getSourceImage() as HTMLImageElement
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, image.width, image.height).data

  for (let index = 0; index < count; index++) {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = Math.round(column * image.width / columns)
    const y = Math.round(row * image.height / rows)
    const right = Math.round((column + 1) * image.width / columns)
    const bottom = Math.round((row + 1) * image.height / rows)
    let minX = right
    let minY = bottom
    let maxX = x
    let maxY = y
    for (let py = y; py < bottom; py++) {
      for (let px = x; px < right; px++) {
        if (pixels[(py * image.width + px) * 4 + 3] < 100) continue
        minX = Math.min(minX, px)
        minY = Math.min(minY, py)
        maxX = Math.max(maxX, px)
        maxY = Math.max(maxY, py)
      }
    }
    if (minX > maxX || minY > maxY) {
      throw new Error('Missing character in ' + key + ' at index ' + index)
    }
    texture.add(String(index), 0, minX, minY, maxX - minX + 1, maxY - minY + 1)
  }

  return texture
}

export function loadFurniture(scene: Phaser.Scene) {
  scene.load.image(seatedCrew, new URL('./people/seated-crew.png', import.meta.url).href)
  scene.load.image(coffeeCrew, new URL('./people/coffee-crew.png', import.meta.url).href)
  for (const [key, prop] of Object.entries(props)) scene.load.image(key, prop.url)
  for (const [key, url] of Object.entries(coworkerArt)) scene.load.image(key, url)
  scene.load.spritesheet(typing, new URL('./people/coworker-typing.png', import.meta.url).href, {
    frameWidth: 543, frameHeight: typingFrameHeight,
  })
  scene.load.spritesheet(walking, new URL('./people/coworker-walk.png', import.meta.url).href, {
    frameWidth: walkFrameSize, frameHeight: walkFrameSize, endFrame: walkFrameCount - 1,
  })
}

export function addFurniture(scene: Phaser.Scene, left: number, top: number, scale: number) {
  const coworkers: OfficeNPC[] = []
  if (!scene.anims.exists(typing)) {
    scene.anims.create({
      key: typing,
      frames: scene.anims.generateFrameNumbers(typing, { frames: [0, 1, 2, 1, 2, 0, 3, 3, 0] }),
      frameRate: 5,
      repeat: -1,
    })
  }

  const placeCoworker = (key: keyof typeof coworkerArt | typeof typing | typeof walking,
    x: number, y: number, height: number, flip = false) => {
    const worldX = left + x * scale
    const worldY = top + y * scale
    const shadow = scene.add.ellipse(worldX, worldY, 18 * scale, 4 * scale, 0x392c23, 0.16)
    const person = scene.add.sprite(worldX, worldY, key)
    const baseline = key === walking ? walkBaseline : key === typing ? typingBaseline : person.height
    person.setOrigin(0.5, baseline / person.height).setScale(height * scale / baseline).setFlipX(flip)
    return { person, shadow }
  }

  registerCrewFrames(scene, seatedCrew, 5, 5, 21)
  const coffeeTexture = scene.textures.get(coffeeCrew)
  if (!coffeeTexture.has('0')) {
    const { width, height } = coffeeTexture.get()
    for (let index = 0; index < 12; index++) {
      const column = index % 3
      const row = Math.floor(index / 3)
      const x = Math.round(column * width / 3)
      const y = Math.round(row * height / 4)
      const right = Math.round((column + 1) * width / 3)
      const bottom = Math.round((row + 1) * height / 4)
      coffeeTexture.add(String(index), 0, x, y, right - x, bottom - y)
    }
  }
  let seatedIndex = 0

  const animateIdle = (person: Phaser.GameObjects.Sprite, index: number) => {
    return scene.tweens.add({
      targets: person,
      angle: { from: person.angle, to: person.flipX ? -1.7 : 1.7 },
      duration: 240 + index % 4 * 75,
      yoyo: true,
      repeat: -1,
      delay: index * 113 % 1600,
      repeatDelay: 630 + index % 6 * 330,
      ease: 'Sine.InOut',
    })
  }

  const seatCoworker = (woman: boolean, x: number, y: number, mirrored: boolean,
    floor: number, role: OfficeNPC['role'] = 'junior') => {
    const index = seatedIndex++
    if (index >= 2) {
      const flip = woman ? !mirrored : mirrored
      const direction = flip ? -1 : 1
      const person = scene.add.sprite(left + (x + direction * 9) * scale, top + (y - 29) * scale,
        seatedCrew, String(index - 2))
      person.setOrigin(0.5, 0.80).setFlipX(flip)
        .setScale((53 + index % 5) * scale / person.height)
      coworkers.push({ person, floor, role, routine: animateIdle(person, index) })
      return
    }
    // Align the animated hips with the seat cushion and the hands with the keyboard.
    const { person } = woman
      ? placeCoworker(typing, x + (mirrored ? 8 : -8), y - 12, 64, !mirrored)
      : placeCoworker('seated-man', x + (mirrored ? -4 : 4), y - 12, 66, mirrored)
    const routine = woman ? undefined : animateIdle(person, index)
    coworkers.push({ person, floor, role, routine })
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
        seatCoworker(mirrored, x - 47, y - 2, mirrored, floor, floor > 0 && index === 0 ? 'staffing' : 'junior')
      }
      if ((index + floor) % 3 !== 1) {
        const role = index === 1 && floor > 0 ? (floor === 1 ? 'training' : 'event') : 'junior'
        seatCoworker(!mirrored, x + 47, y - 2, mirrored, floor, role)
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
  const candidate = placeCoworker('standing-woman', 873, 213, 73).person
  const manager = placeCoworker('standing-man', 1075, 213, 78, true).person
  coworkers.push(
    { person: candidate, floor: 3, role: 'interview', routine: animateIdle(candidate, 24) },
    { person: manager, floor: 3, role: 'management', routine: animateIdle(manager, 25) },
  )
  const placeCoffeeDrinker = (index: number, x: number, y: number, height: number, flip = false) => {
    const first = index * 3
    const rest = String(first)
    const lift = String(first + 1)
    const sip = String(first + 2)
    const worldX = left + x * scale
    const worldY = top + y * scale
    scene.add.ellipse(worldX, worldY, 24 * scale, 5 * scale, 0x392c23, 0.18)
    const person = scene.add.sprite(worldX, worldY, coffeeCrew, rest)
    person.setOrigin(0.53, 0.98).setFlipX(flip).setScale(height * scale / person.height)
    const key = 'coffee-sip-' + index
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: [
          { key: coffeeCrew, frame: rest, duration: 2400 + 620 * index },
          { key: coffeeCrew, frame: lift, duration: 260 },
          { key: coffeeCrew, frame: sip, duration: 1450 },
          { key: coffeeCrew, frame: lift, duration: 310 },
        ],
        frameRate: 8,
        repeat: -1,
      })
    }
    person.play({ key, delay: index * 390 })
    return person
  }

  placeCoffeeDrinker(0, 1308, 788, 73)
  placeCoffeeDrinker(1, 1390, 791, 81, true)
  // Keep the coffee group at the back of the pavement, clear of Igor's silhouette.
  const coffeeCompanion = placeCoffeeDrinker(2, 2005, 754, 77)
  placeCoffeeDrinker(3, 2115, 759, 80, true)

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

  return { coworkers, coffeeCompanion }
}
