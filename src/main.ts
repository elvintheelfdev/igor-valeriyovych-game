import Phaser from 'phaser'
import './style.css'
import { addBuilding, elevatorX, floorBounds, floorLevels, loadBuilding, worldHeight, worldWidth } from './building'

const igorUrl = new URL('./igor-idle.png', import.meta.url).href
const igorArt = 'igor-idle'
const cameraViewHeight = 325
const walkSpeed = 125
const elevatorSpeed = 220
const dragThreshold = 8

class Office extends Phaser.Scene {
  preload() {
    loadBuilding(this)
    this.load.image(igorArt, igorUrl)
  }

  create() {
    addBuilding(this)

    const igorX = 690
    const igorFloorY = floorLevels[0]
    const igorHeight = 72
    const shadow = this.add.ellipse(igorX, igorFloorY, 16, 2, 0x291b16, 0.34)
    const igor = this.add.image(igorX, igorFloorY, igorArt)
      .setOrigin(0.5, 0.978).setName('Igor')
    igor.setScale(igorHeight / igor.height)

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
    let destination: { x: number; floor: number } | undefined
    const moveIgor = (_time: number, delta: number) => {
      const direction = Number(right.isDown || d.isDown) - Number(left.isDown || a.isDown)
      const seconds = Math.min(delta, 50) / 1000
      if (elevatorFloor === undefined) {
        if (direction !== 0) destination = undefined
        if (destination && destination.floor !== floor && igor.x === elevatorX) {
          elevatorFloor = destination.floor
          igor.setVisible(false)
          shadow.setVisible(false)
        }
      }

      if (elevatorFloor !== undefined) {
        const targetY = floorLevels[elevatorFloor]
        const distance = targetY - igor.y
        const step = elevatorSpeed * seconds
        igor.y = Math.abs(distance) <= step ? targetY : igor.y + Math.sign(distance) * step
        shadow.y = igor.y
        if (igor.y === targetY) {
          floor = elevatorFloor
          elevatorFloor = undefined
          igor.setVisible(true)
          shadow.setVisible(true)
        }
      } else {
        const targetX = direction !== 0 ? (direction > 0 ? floorBounds.right : floorBounds.left)
          : destination && (destination.floor === floor ? destination.x : elevatorX)
        if (targetX === undefined) return
        const distance = targetX - igor.x
        const step = walkSpeed * seconds
        igor.x = Math.abs(distance) <= step ? targetX : igor.x + Math.sign(distance) * step
        shadow.x = igor.x
        if (distance !== 0) igor.setFlipX(distance < 0)
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
      if (point.x < floorBounds.left || point.x > floorBounds.right) return
      const targetFloor = floorLevels.findIndex(y => point.y >= y - 116 && point.y <= y + 12)
      if (targetFloor >= 0) destination = { x: point.x, floor: targetFloor }
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
