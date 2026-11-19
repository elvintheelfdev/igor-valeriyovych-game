import type Phaser from 'phaser'

export type DialogueLine = {
  speaker: 'ihor' | 'npc'
  text: string
  translation?: string
  autoAdvanceMs?: number
}

type PortraitSource = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite

function drawPortrait(portrait: HTMLCanvasElement, person: PortraitSource, flip = false) {
  const { cutX, cutY, cutWidth, cutHeight, source } = person.frame
  const headHeight = Math.ceil(cutHeight * 0.28)
  const sample = document.createElement('canvas')
  sample.width = cutWidth
  sample.height = headHeight
  const context = sample.getContext('2d', { willReadFrequently: true })!
  context.drawImage(source.image as CanvasImageSource,
    cutX, cutY, cutWidth, headHeight, 0, 0, cutWidth, headHeight)
  const pixels = context.getImageData(0, 0, cutWidth, headHeight).data
  let left = cutWidth
  let right = 0
  let top = headHeight
  for (let y = 0; y < headHeight; y++) {
    for (let x = 0; x < cutWidth; x++) {
      if (pixels[(y * cutWidth + x) * 4 + 3] < 160) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
    }
  }

  const target = portrait.getContext('2d')!
  const size = portrait.width
  target.clearRect(0, 0, size, size)
  if (left > right || top >= headHeight) return

  const padding = Math.ceil((headHeight - top) * 0.1)
  const cropX = Math.max(0, left - padding)
  const cropY = Math.max(0, top - padding)
  const width = Math.min(cutWidth - cropX, right - cropX + padding + 1)
  const height = headHeight - cropY
  const scale = Math.min(size * 0.95 / width, size * 0.95 / height)
  const x = (size - width * scale) / 2

  target.save()
  if (flip) {
    target.translate(size, 0)
    target.scale(-1, 1)
  }
  target.drawImage(sample, cropX, cropY, width, height, x, size - height * scale, width * scale, height * scale)
  target.restore()
}

export class OfficeDialogue {
  private readonly panel = document.createElement('section')
  private readonly ihorPortrait: HTMLCanvasElement
  private readonly npcPortrait: HTMLCanvasElement
  private readonly speaker: HTMLElement
  private readonly line: HTMLElement
  private readonly translation: HTMLElement
  private readonly advanceButton: HTMLButtonElement
  private exchange?: {
    name: string
    lines: readonly DialogueLine[]
    index: number
    complete: () => void
  }
  private timer?: number

  constructor(private readonly host: HTMLElement, private readonly ihor: PortraitSource) {
    this.panel.className = 'office-dialogue'
    this.panel.hidden = true
    this.panel.setAttribute('aria-label', 'Character dialogue')
    this.panel.innerHTML = `
      <div class="dialogue-card dialogue-ihor" aria-hidden="true"><canvas class="dialogue-portrait" width="192" height="192"></canvas></div>
      <div class="dialogue-center">
        <div class="dialogue-copy" aria-live="polite" aria-atomic="true">
          <div class="dialogue-speaker"></div>
          <p class="dialogue-line"></p>
          <p class="dialogue-translation" hidden></p>
        </div>
        <button class="dialogue-advance" type="button" aria-label="Continue"></button>
      </div>
      <div class="dialogue-card dialogue-npc" aria-hidden="true"><canvas class="dialogue-portrait" width="192" height="192"></canvas></div>
    `
    this.ihorPortrait = this.panel.querySelector('.dialogue-ihor canvas')!
    this.npcPortrait = this.panel.querySelector('.dialogue-npc canvas')!
    this.speaker = this.panel.querySelector('.dialogue-speaker')!
    this.line = this.panel.querySelector('.dialogue-line')!
    this.translation = this.panel.querySelector('.dialogue-translation')!
    this.advanceButton = this.panel.querySelector('.dialogue-advance')!
    this.panel.addEventListener('click', () => this.advance())
    host.append(this.panel)
  }

  get active() { return this.exchange !== undefined }

  open(name: string, npc: PortraitSource, lines: readonly DialogueLine[], complete: () => void) {
    this.exchange = { name, lines, index: 0, complete }
    drawPortrait(this.ihorPortrait, this.ihor)
    drawPortrait(this.npcPortrait, npc, npc.texture.key !== 'standing-woman')
    this.panel.hidden = false
    this.render()
    this.advanceButton.focus({ preventScroll: true })
  }

  destroy() {
    window.clearTimeout(this.timer)
    this.exchange = undefined
    this.panel.remove()
  }

  private advance() {
    const exchange = this.exchange
    if (!exchange) return
    window.clearTimeout(this.timer)
    exchange.index++
    if (exchange.index < exchange.lines.length) {
      this.render()
      return
    }
    this.exchange = undefined
    this.panel.hidden = true
    this.host.focus({ preventScroll: true })
    exchange.complete()
  }

  private render() {
    const exchange = this.exchange!
    const line = exchange.lines[exchange.index]
    this.panel.dataset.speaker = line.speaker
    this.speaker.textContent = line.speaker === 'ihor' ? 'Ihor Valeriyovych' : exchange.name
    this.line.textContent = line.text
    this.line.classList.toggle('dialogue-phrase', !!line.translation)
    this.translation.textContent = line.translation ?? ''
    this.translation.hidden = !line.translation
    this.advanceButton.setAttribute('aria-label', exchange.index === exchange.lines.length - 1 ? 'Finish' : 'Continue')
    this.timer = line.autoAdvanceMs ? window.setTimeout(() => this.advance(), line.autoAdvanceMs) : undefined
  }
}

