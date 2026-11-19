import Phaser from 'phaser'
import './style.css'
import {
  addBuilding, elevatorX, entranceBounds, entranceX, floorBounds, floorLevels,
  groundY, interiorDoorBounds, interiorDoorX, loadBuilding, sidewalkBounds, sidewalkStart,
  streetRight, worldHeight, worldWidth,
} from './building'

const igorArt = 'igor'
const frameWidth = 192
const frameHeight = 256
const idleFrame = 0
const walkFrameCount = 16
const strideLength = 58
const cameraViewHeight = 325
const walkSpeed = 68
const elevatorSpeed = 220
const doorSpeed = 4
const dragThreshold = 8

class Office extends Phaser.Scene {
  preload() {
    loadBuilding(this)
    this.load.spritesheet(igorArt, new URL('./igor.png', import.meta.url).href, {
      frameWidth,
      frameHeight,
    })
  }

  create() {
    const doors = addBuilding(this)

    const igorX = 690
    const igorFloorY = floorLevels[0]
    const igorHeight = 72
    const shadow = this.add.ellipse(igorX, igorFloorY, 16, 2, 0x291b16, 0.34)
    const igor = this.add.image(igorX, igorFloorY, igorArt, idleFrame)
      .setOrigin(0.5, 250 / frameHeight).setScale(igorHeight / frameHeight).setName('Igor')

    const camera = this.cameras.main
    camera.setBounds(0, 0, worldWidth, worldHeight)
    const resizeCamera = (size: Phaser.Structs.Size) => {
      camera.setZoom(Math.max(size.width / worldWidth, size.height / cameraViewHeight))
    }
    resizeCamera(this.scale.gameSize)
    camera.centerOn(igorX, igorFloorY - igorHeight / 2)
    this.scale.on('resize', resizeCamera)

    const host = document.querySelector<HTMLElement>('#office')!
    const keyCodes = Phaser.Input.Keyboard.KeyCodes
    const keyboard = this.input.keyboard!
    const left = keyboard.addKey(keyCodes.LEFT)
    const right = keyboard.addKey(keyCodes.RIGHT)
    const a = keyboard.addKey(keyCodes.A, false)
    const d = keyboard.addKey(keyCodes.D, false)
    let floor = 0
    let elevatorFloor: number | undefined
    let elevatorPhase: 'boarding' | 'travel' | 'leaving' = 'boarding'
    const liftProgress = floorLevels.map(() => 0)
    let destination: { x: number; floor: number } | undefined
    let strideDistance = 0
    let interiorDoorProgress = 0
    let streetDoorProgress = 0
    let passageTarget: number | undefined
    const insideLanding = interiorDoorX - 42
    const showIdle = () => {
      strideDistance = 0
      if (Number(igor.frame.name) !== idleFrame) igor.setFrame(idleFrame)
    }

    const moveIgor = (_time: number, delta: number) => {
      const direction = Number(right.isDown || d.isDown) - Number(left.isDown || a.isDown)
      const seconds = Math.min(delta, 50) / 1000
      const updateDoor = (progress: number, x: number, draw: (progress: number) => void) => {
        const nearby = floor === 0 && elevatorFloor === undefined && Math.abs(igor.x - x) < 39
        const next = Phaser.Math.Clamp(progress + (nearby ? 1 : -1) * doorSpeed * seconds, 0, 1)
        if (next !== progress) draw(Phaser.Math.Easing.Sine.InOut(next))
        return next
      }
      interiorDoorProgress = updateDoor(interiorDoorProgress, interiorDoorX, doors.interior)
      streetDoorProgress = updateDoor(streetDoorProgress, entranceX, doors.street)
      for (let index = 0; index < liftProgress.length; index++) {
        const open = elevatorFloor !== undefined && (
          (elevatorPhase === 'boarding' && index === floor)
          || (elevatorPhase === 'leaving' && index === elevatorFloor)
        )
        const next = Phaser.Math.Clamp(liftProgress[index] + (open ? 1 : -1) * doorSpeed * seconds, 0, 1)
        if (next !== liftProgress[index]) doors.lifts[index](Phaser.Math.Easing.Sine.InOut(next))
        liftProgress[index] = next
      }
      if (elevatorFloor === undefined) {
        if (direction !== 0) destination = undefined
        if (destination && destination.floor !== floor && igor.x === elevatorX) {
          elevatorFloor = destination.floor
          elevatorPhase = 'boarding'
          showIdle()
        }
      }

      if (elevatorFloor !== undefined) {
        if (elevatorPhase === 'boarding') {
          if (liftProgress[floor] < 1) return
          igor.setVisible(false)
          shadow.setVisible(false)
          elevatorPhase = 'travel'
          return
        }
        if (elevatorPhase === 'leaving') {
          if (liftProgress[elevatorFloor] < 1) return
          floor = elevatorFloor
          elevatorFloor = undefined
          igor.setVisible(true)
          shadow.setVisible(true)
          return
        }
        const targetY = floorLevels[elevatorFloor]
        const distance = targetY - igor.y
        const step = elevatorSpeed * seconds
        igor.y = Math.abs(distance) <= step ? targetY : igor.y + Math.sign(distance) * step
        shadow.y = igor.y
        if (igor.y === targetY) elevatorPhase = 'leaving'
      } else {
        const rightBound = floor === 0 ? streetRight : floorBounds.right
        const targetX = passageTarget ?? (direction !== 0 ? (direction > 0 ? rightBound : floorBounds.left)
          : destination && (destination.floor === floor ? destination.x : elevatorX))
        if (targetX === undefined || targetX === igor.x) {
          if (destination?.floor === floor) destination = undefined
          showIdle()
          return
        }
        const distance = targetX - igor.x
        const step = walkSpeed * seconds
        const travel = Math.min(Math.abs(distance), step)
        if (travel === 0) return
        const previousX = igor.x
        igor.x = travel === Math.abs(distance) ? targetX : previousX + Math.sign(distance) * travel
        if (floor === 0) {
          if (passageTarget === undefined) {
            if (previousX <= interiorDoorX && igor.x > interiorDoorX) passageTarget = entranceX
            if (previousX >= entranceX && igor.x < entranceX) passageTarget = interiorDoorX
          } else if (igor.x === passageTarget) {
            passageTarget = undefined
            if (!destination && direction === 0) {
              destination = { x: igor.x === entranceX ? sidewalkStart : insideLanding, floor: 0 }
            }
          }
          igor.setVisible(passageTarget === undefined)
          shadow.setVisible(igor.visible)
        }
        if (floor === 0) igor.y = groundY(igor.x)
        shadow.setPosition(igor.x, igor.y)
        igor.setFlipX(distance < 0)
        strideDistance = (strideDistance + travel) % strideLength
        const frame = 1 + Math.floor(strideDistance / strideLength * walkFrameCount)
        if (Number(igor.frame.name) !== frame) igor.setFrame(frame)
      }
      if (destination?.floor === floor && destination.x === igor.x) destination = undefined

      const centerX = camera.scrollX + camera.width / 2
      const centerY = camera.scrollY + camera.height / 2
      const marginX = camera.width / camera.zoom * 0.28
      const marginY = camera.height / camera.zoom * 0.18
      const characterY = igor.y - igorHeight / 2
      camera.scrollX += igor.x - Phaser.Math.Clamp(igor.x, centerX - marginX, centerX + marginX)
      camera.scrollY += characterY - Phaser.Math.Clamp(characterY, centerY - marginY, centerY + marginY)
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
      if (pointer.button !== 0 || pointer.getDistance() >= dragThreshold || elevatorFloor !== undefined) return
      const point = camera.getWorldPoint(pointer.x, pointer.y)
      if (interiorDoorBounds.contains(point.x, point.y) || entranceBounds.contains(point.x, point.y)) {
        destination = { x: floor === 0 && igor.x >= entranceX ? insideLanding : sidewalkStart, floor: 0 }
        return
      }
      if (sidewalkBounds.contains(point.x, point.y)) {
        destination = { x: Math.max(sidewalkStart, point.x), floor: 0 }
        return
      }
      if (point.x < floorBounds.left || point.x > floorBounds.right) return
      const targetFloor = floorLevels.findIndex(y => point.y >= y - 116 && point.y <= y + 12)
      if (targetFloor >= 0) {
        destination = { x: targetFloor === 0 ? Math.min(point.x, interiorDoorX - 1) : point.x, floor: targetFloor }
      }
    })
    host.addEventListener('wheel', (event) => {
      event.preventDefault()
      const multiplier = event.deltaMode === 1 ? 16 : 1
      camera.scrollX += (event.deltaX + (event.shiftKey ? event.deltaY : 0)) * multiplier / camera.zoom
      if (!event.shiftKey) camera.scrollY += event.deltaY * multiplier / camera.zoom
    }, { passive: false, signal })
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      event.preventDefault()
      if (event.repeat || elevatorFloor !== undefined) return
      const targetFloor = floor + (event.key === 'ArrowUp' ? 1 : -1)
      if (targetFloor >= 0 && targetFloor < floorLevels.length) {
        destination = { x: elevatorX, floor: targetFloor }
      }
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
