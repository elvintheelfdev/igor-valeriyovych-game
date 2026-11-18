import Phaser from 'phaser'
import './style.css'

const backgroundUrl = new URL('./office-background.png', import.meta.url).href
const igorUrl = new URL('./igor-idle.png', import.meta.url).href
const officeArt = 'office-background'
const architectureArt = 'office-architecture'
const canopyArt = 'entrance-canopy'
const igorArt = 'igor-idle'
const cameraViewHeight = 325
const walkableFloor = { left: 258, right: 1582, top: 511, bottom: 523, baseline: 518 }
const entranceCanopy = [
  { x: 987, y: 540 },
  { x: 1020, y: 512 },
  { x: 1271, y: 512 },
  { x: 1271, y: 535 },
  { x: 1024, y: 535 },
  { x: 987, y: 560 },
]
const walkSpeed = 125
const dragThreshold = 8
const officeSections = [
  { name: 'leadership-floor', top: 0 },
  { name: 'mentoring-floor', top: 238 },
  { name: 'hiring-floor', top: 394 },
  { name: 'team-life-and-entrance', top: 533 },
  { name: 'street', top: 799 },
]

class Office extends Phaser.Scene {
  preload() {
    this.load.image(officeArt, backgroundUrl)
    this.load.image(igorArt, igorUrl)
  }

  create() {
    const source = this.textures.get(officeArt).getSourceImage() as HTMLImageElement
    const { width: worldWidth, height: worldHeight } = source
    const canopyX = 987
    const canopyY = 512
    if (!this.textures.exists(canopyArt)) {
      const canopy = this.textures.createCanvas(canopyArt, 284, 48)!
      const context = canopy.context
      context.beginPath()
      for (const { x, y } of entranceCanopy) context.lineTo(x - canopyX, y - canopyY)
      context.closePath()
      context.save()
      context.clip()
      context.drawImage(source, -canopyX, -canopyY)
      context.restore()
      canopy.refresh()

      const background = this.textures.createCanvas(architectureArt, worldWidth, worldHeight)!
      background.context.drawImage(source, 0, 0)
      background.context.globalCompositeOperation = 'destination-out'
      background.context.drawImage(canopy.canvas, canopyX, canopyY)
      background.context.globalCompositeOperation = 'source-over'
      background.refresh()
    }

    const texture = this.textures.get(architectureArt)
    const architecture = this.add.layer().setName('Office architecture')
    for (const [index, section] of officeSections.entries()) {
      const bottom = officeSections[index + 1]?.top ?? worldHeight
      if (!texture.has(section.name)) {
        texture.add(section.name, 0, 0, section.top, worldWidth, bottom - section.top)
      }
      architecture.add(this.add.image(0, section.top, architectureArt, section.name)
        .setOrigin(0).setName(section.name))
    }

    const igorX = 690
    const igorFloorY = walkableFloor.baseline
    const igorHeight = 94
    const shadow = this.add.ellipse(igorX, igorFloorY, 24, 3, 0x291b16, 0.34)
    const igor = this.add.image(igorX, igorFloorY, igorArt)
      .setOrigin(0.5, 0.978).setName('Igor')
    igor.setScale(igorHeight / igor.height)

    this.add.image(canopyX, canopyY, canopyArt).setOrigin(0)
      .setName('Entrance canopy').setDepth(1)

    const camera = this.cameras.main
    camera.setBounds(0, 0, worldWidth, worldHeight)
    const resizeCamera = (size: Phaser.Structs.Size) => {
      camera.setZoom(Math.max(size.width / worldWidth, size.height / cameraViewHeight))
    }
    resizeCamera(this.scale.gameSize)
    camera.centerOn(igorX, 452)
    this.scale.on('resize', resizeCamera)

    const host = document.querySelector<HTMLElement>('#office')!
    const keyCodes = Phaser.Input.Keyboard.KeyCodes
    const keyboard = this.input.keyboard!
    const left = keyboard.addKey(keyCodes.LEFT)
    const right = keyboard.addKey(keyCodes.RIGHT)
    const a = keyboard.addKey(keyCodes.A, false)
    const d = keyboard.addKey(keyCodes.D, false)
    let destination: number | undefined
    const moveIgor = (_time: number, delta: number) => {
      const direction = Number(right.isDown || d.isDown) - Number(left.isDown || a.isDown)
      if (direction !== 0) destination = undefined
      const target = direction === 0
        ? destination
        : direction > 0 ? walkableFloor.right : walkableFloor.left
      if (target === undefined) return

      const distance = target - igor.x
      const step = walkSpeed * Math.min(delta, 50) / 1000
      const travel = Math.sign(distance) * Math.min(step, Math.abs(distance))
      igor.x = Math.abs(distance) <= step ? target : igor.x + travel
      shadow.x = igor.x
      if (travel !== 0) {
        igor.setFlipX(travel < 0)
        const centerX = camera.scrollX + camera.width / 2
        const margin = camera.width / camera.zoom * 0.28
        camera.scrollX += igor.x - Phaser.Math.Clamp(igor.x, centerX - margin, centerX + margin)
      }
      if (igor.x === destination) destination = undefined
    }
    this.events.on(Phaser.Scenes.Events.UPDATE, moveIgor)

    const listeners = new AbortController()
    const { signal } = listeners
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', resizeCamera)
      this.events.off(Phaser.Scenes.Events.UPDATE, moveIgor)
      listeners.abort()
    })
    this.input.on('pointerdown', () => host.focus({ preventScroll: true }))
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || pointer.getDistance() < dragThreshold) return
      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom
    })
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0 || pointer.getDistance() >= dragThreshold) return
      const point = camera.getWorldPoint(pointer.x, pointer.y)
      if (point.y < walkableFloor.top || point.y > walkableFloor.bottom) return
      destination = Phaser.Math.Clamp(point.x, walkableFloor.left, walkableFloor.right)
    })
    host.addEventListener('wheel', (event) => {
      event.preventDefault()
      const multiplier = event.deltaMode === 1 ? 16 : 1
      camera.scrollX += (event.deltaX + (event.shiftKey ? event.deltaY : 0)) * multiplier / camera.zoom
      if (!event.shiftKey) camera.scrollY += event.deltaY * multiplier / camera.zoom
    }, { passive: false, signal })
    host.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      event.preventDefault()
      camera.scrollY += (event.key === 'ArrowUp' ? -56 : 56) / camera.zoom
    }, { signal })
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'office',
  backgroundColor: '#191c1a',
  scale: { mode: Phaser.Scale.RESIZE },
  scene: Office,
})
