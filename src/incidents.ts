import Phaser from 'phaser'
import type { Destination } from './building'
import { OfficeDialogue } from './dialogue'
import { dialogueScenes } from './dialogue-scenes'

const incidents = {
  junior: {
    title: 'Junior needs help', cue: '?', doing: 'Mentoring a junior', done: 'Junior ready to continue',
    patience: 54, points: 100,
  },
  interview: {
    title: 'Interview waiting', cue: 'I', doing: 'Conducting the interview', done: 'Interview complete',
    patience: 65, points: 160,
  },
  staffing: {
    title: 'Staffing request', cue: 'S', doing: 'Discussing project allocation', done: 'Project staffed',
    patience: 59, points: 130,
  },
  management: {
    title: 'Management meeting', cue: 'M', doing: 'Attending the management meeting', done: 'Meeting complete',
    patience: 67, points: 175,
  },
  training: {
    title: 'Lecture / Training', cue: 'T', doing: 'Leading a training session', done: 'Training complete',
    patience: 61, points: 150,
  },
  event: {
    title: 'Team event issue', cue: 'E', doing: 'Planning the team event', done: 'Team event rescheduled',
    patience: 60, points: 140,
  },
} as const

type Role = keyof typeof incidents
type Routine = 'working' | 'idle'
type NPCState = Routine | 'needsHelp' | 'waiting' | 'beingHelped' | 'resolved' | 'cooldown'

export interface OfficeNPC {
  person: Phaser.GameObjects.Sprite
  floor: number
  role: Role
  routine?: Phaser.Tweens.Tween
}

type Colleague = OfficeNPC & {
  state: NPCState
  until: number
  normal: Routine
  effect?: Phaser.Tweens.Tween
}

type Incident = {
  npc: Colleague
  marker: HTMLButtonElement
  entry: HTMLButtonElement
  remaining: number
  startedAt: number
}

type Assignment = { incident: Incident } | { coffee: Phaser.GameObjects.Sprite }

const bestKey = 'cosplay-ihor-best'

function readBest() {
  try {
    const best = Number(localStorage.getItem(bestKey))
    return Number.isFinite(best) && best > 0 ? best : 0
  } catch {
    return 0
  }
}

export class OfficeIncidents {
  private readonly colleagues: Colleague[]
  private readonly dialogue: OfficeDialogue
  private readonly active: Incident[] = []
  private readonly feedback = new Map<Colleague, HTMLElement>()
  private readonly hud = document.createElement('section')
  private readonly layer = document.createElement('div')
  private readonly status: HTMLElement
  private readonly scoreLabel: HTMLElement
  private readonly totals: HTMLElement
  private readonly stressMeter: HTMLProgressElement
  private readonly stressLabel: HTMLElement
  private readonly coffeeCount: HTMLElement
  private readonly list: HTMLElement
  private readonly roleCount: Record<Role, number> = { junior: 0, interview: 0, staffing: 0, management: 0, training: 0, event: 0 }
  private assignment?: Assignment
  private elapsed = 0
  private nextIncident = 2
  private score = 0
  private best = readBest()
  private resolved = 0
  private coffee = 0
  private stress = 0
  private ended = false

  constructor(
    private readonly scene: Phaser.Scene,
    host: HTMLElement,
    coworkers: OfficeNPC[],
    ihor: Phaser.GameObjects.Image,
    private readonly goTo: (destination?: Destination) => void,
  ) {
    this.colleagues = coworkers.map(npc => {
      const normal = npc.role === 'interview' || npc.role === 'management' ? 'idle' : 'working'
      return { ...npc, normal, state: normal, until: 0 }
    })

    this.hud.className = 'office-hud'
    this.hud.setAttribute('aria-label', 'Shift dashboard')
    this.hud.innerHTML = `
      <div class="hud-totals">
        <div><strong data-score>0</strong><small>Score</small></div>
        <div><strong data-totals>0 / 1</strong><small>Helped / Level</small></div>
        <div class="hud-stress"><strong data-stress>0%</strong><small>Stress</small>
          <progress max="100" value="0" aria-label="Stress"></progress></div>
      </div>
      <div class="hud-message" role="status">Click an incident to send Ihor. Click the floor to walk.</div>
      <div class="hud-incidents" aria-label="Active incidents"></div>
      <p class="coffee-count">Coffee breaks · 0</p>
    `
    this.status = this.hud.querySelector('.hud-message')!
    this.scoreLabel = this.hud.querySelector('[data-score]')!
    this.totals = this.hud.querySelector('[data-totals]')!
    this.stressLabel = this.hud.querySelector('[data-stress]')!
    this.stressMeter = this.hud.querySelector('progress')!
    this.coffeeCount = this.hud.querySelector('.coffee-count')!
    this.list = this.hud.querySelector('.hud-incidents')!

    this.layer.className = 'incident-layer'
    host.append(this.layer, this.hud)
    this.dialogue = new OfficeDialogue(host, ihor)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.dialogue.destroy()
      this.hud.remove()
      this.layer.remove()
    })
  }

  get gameOver() { return this.ended }
  get inDialogue() { return this.dialogue.active }

  requestCoffee(person: Phaser.GameObjects.Sprite) {
    if (this.ended || this.inDialogue) return
    if (this.assignment && 'coffee' in this.assignment && this.assignment.coffee === person) return
    this.cancel()
    this.assignment = { coffee: person }
    this.goTo({ x: person.x, floor: 0 })
    this.status.textContent = 'Heading to the kitchen'
  }

  cancel() {
    if (!this.assignment || this.inDialogue) return
    if ('incident' in this.assignment) {
      const { npc } = this.assignment.incident
      this.setState(npc, 'needsHelp')
    }
    this.assignment = undefined
    this.goTo()
    this.status.textContent = 'Choose an incident to help a colleague'
  }

  update(delta: number, player: Destination, canInteract: boolean) {
    if (this.ended || this.inDialogue) return
    const seconds = delta / 1000
    this.elapsed += seconds

    for (const colleague of this.colleagues) {
      if (colleague.until > this.elapsed) continue
      if (colleague.state === 'resolved') this.cooldown(colleague)
      else if (colleague.state === 'cooldown') this.setState(colleague, colleague.normal)
    }

    for (const incident of [...this.active]) {
      if (incident.npc.state === 'beingHelped') continue
      incident.remaining -= seconds
      if (incident.remaining <= 0) this.miss(incident)
      if (this.ended) return
    }

    if (canInteract) this.updateAssignment(player)
    if (!this.inDialogue && this.elapsed >= this.nextIncident && this.active.length < Math.min(4, 1 + this.level)) {
      if (this.spawn(player.floor)) this.nextIncident = this.elapsed + Math.max(5, 13 - this.level)
    }
    this.render()
  }

  private get level() { return 1 + Math.floor(Math.max(this.elapsed / 65, this.resolved / 6)) }

  private select(incident: Incident) {
    if (this.ended || this.inDialogue || this.isSelected(incident) || !this.active.includes(incident)) return
    this.cancel()
    this.assignment = { incident }
    this.setState(incident.npc, 'waiting')
    this.goTo({ x: incident.npc.person.x, floor: incident.npc.floor })
    this.status.textContent = 'On the way · ' + incidents[incident.npc.role].title
  }

  private isSelected(incident: Incident) {
    return this.assignment && 'incident' in this.assignment && this.assignment.incident === incident
  }

  private spawn(playerFloor: number) {
    const available = this.colleagues.filter(npc => npc.state === npc.normal)
    if (available.length === 0) return false
    const first = Object.values(this.roleCount).every(count => count === 0)
    const onFloor = available.filter(npc => npc.role === 'junior' && npc.floor === playerFloor)
    const roleOrder = (Object.keys(incidents) as Role[])
      .filter(role => available.some(npc => npc.role === role))
      .sort((a, b) => this.roleCount[a] - this.roleCount[b])
    const role = roleOrder[0]
    const pool = first && onFloor.length > 0 ? onFloor : available.filter(npc => npc.role === role)
    const npc = Phaser.Utils.Array.GetRandom(pool)
    this.roleCount[npc.role]++

    const marker = document.createElement('button')
    const entry = document.createElement('button')
    marker.type = entry.type = 'button'
    marker.className = 'incident-marker'
    entry.className = 'incident-entry'
    const incident = {
      npc, marker, entry, startedAt: this.elapsed,
      remaining: Math.max(39, incidents[npc.role].patience - 2.5 * (this.level - 1)),
    }
    marker.addEventListener('click', () => this.select(incident))
    entry.addEventListener('click', () => this.select(incident))
    this.layer.append(marker)
    this.list.append(entry)
    this.active.push(incident)
    this.setState(npc, 'needsHelp')
    return true
  }

  private setState(npc: Colleague, state: NPCState) {
    npc.effect?.remove()
    npc.effect = undefined
    npc.person.angle = 0
    npc.state = state
    if (state === npc.normal || state === 'cooldown') {
      npc.routine?.resume()
      npc.person.anims.resume()
      return
    }
    npc.routine?.pause()
    if (npc.person.anims.isPlaying && npc.person.texture.key === 'coworker-typing') {
      npc.person.anims.pause(npc.person.anims.currentAnim?.frames[6])
    } else {
      npc.person.anims.pause()
    }
    if (state === 'resolved') {
      npc.effect = this.scene.tweens.add({
        targets: npc.person, angle: npc.person.flipX ? 3 : -3,
        duration: 260, yoyo: true, ease: 'Sine.InOut',
      })
      return
    }
    const helping = state === 'beingHelped'
    npc.effect = this.scene.tweens.add({
      targets: npc.person,
      angle: helping ? 2 : (npc.person.flipX ? -4 : 4),
      duration: helping ? 580 : 370,
      hold: helping ? 130 : 260,
      yoyo: true,
      repeat: -1,
      repeatDelay: helping ? 360 : 720,
      ease: 'Sine.InOut',
    })
  }

  private updateAssignment(player: Destination) {
    const assignment = this.assignment
    if (!assignment) return
    if ('coffee' in assignment) {
      const person = assignment.coffee
      if (player.floor !== 0 || Math.abs(player.x - person.x) > 0.5) return
      this.status.textContent = 'At the coffee station'
      this.startDialogue('coffee', person, () => {
        this.assignment = undefined
        if (this.coffee > 0) {
          this.coffee--
          this.stress = Math.max(0, this.stress - 35)
          this.status.textContent = 'Coffee break complete · Stress reduced'
        } else {
          this.status.textContent = 'Help colleagues to earn a coffee break'
        }
      })
      return
    }

    const { incident } = assignment
    const { npc } = incident
    if (player.floor !== npc.floor || Math.abs(player.x - npc.person.x) > 0.5) return
    this.setState(npc, 'beingHelped')
    this.status.textContent = incidents[npc.role].doing
    this.startDialogue(npc.role, npc.person, () => this.resolve(incident))
  }

  private startDialogue(
    key: keyof typeof dialogueScenes, person: Phaser.GameObjects.Sprite, complete: () => void,
  ) {
    const { name, line } = dialogueScenes[key]
    this.hud.inert = this.layer.inert = true
    this.dialogue.open(name, person, line, () => {
      this.hud.inert = this.layer.inert = false
      complete()
      this.render()
    })
  }

  private resolve(incident: Incident) {
    const { npc } = incident
    const task = incidents[npc.role]
    this.assignment = undefined
    this.score += task.points + Math.ceil(incident.remaining)
    if (this.score > this.best) {
      this.best = this.score
      try { localStorage.setItem(bestKey, String(this.best)) } catch { /* Storage is optional. */ }
    }
    this.resolved++
    if (this.resolved % 3 === 0) this.coffee++
    this.stress = Math.max(0, this.stress - 4)
    this.status.textContent = task.done
    this.remove(incident)
    this.setState(npc, 'resolved')
    npc.until = this.elapsed + 1.4
    const check = document.createElement('span')
    check.className = 'incident-marker incident-resolved'
    check.textContent = '✓'
    this.layer.append(check)
    this.feedback.set(npc, check)
    this.position(check, npc, 0)
  }

  private miss(incident: Incident) {
    const selected = this.isSelected(incident)
    if (selected) {
      this.assignment = undefined
      this.goTo()
    }
    this.remove(incident)
    this.cooldown(incident.npc)
    this.stress = Math.min(100, this.stress + 24)
    if (selected || !this.assignment) this.status.textContent = 'Missed · ' + incidents[incident.npc.role].title
    if (this.stress >= 100) this.endRun()
  }

  private cooldown(npc: Colleague) {
    this.feedback.get(npc)?.remove()
    this.feedback.delete(npc)
    this.setState(npc, 'cooldown')
    npc.until = this.elapsed + 18
  }

  private remove(incident: Incident) {
    this.active.splice(this.active.indexOf(incident), 1)
    incident.marker.remove()
    incident.entry.remove()
  }

  private endRun() {
    this.ended = true
    this.assignment = undefined
    this.goTo()
    for (const incident of [...this.active]) {
      this.cooldown(incident.npc)
      this.remove(incident)
    }
    for (const check of this.feedback.values()) check.remove()
    this.feedback.clear()
    this.render()
    this.status.textContent = 'Shift over · Stress reached 100%'
    const restart = document.createElement('button')
    restart.type = 'button'
    restart.className = 'restart-button'
    restart.textContent = 'Start a new shift'
    restart.addEventListener('click', () => this.scene.scene.restart(), { once: true })
    const record = document.createElement('p')
    record.className = 'hud-record'
    record.textContent = 'Personal best · ' + this.best.toLocaleString()
    this.list.append(record, restart)
    restart.focus()
  }

  private position(element: HTMLElement, npc: Colleague, lift: number) {
    const camera = this.scene.cameras.main
    const screenX = (npc.person.x - camera.scrollX - camera.width / 2) * camera.zoom + camera.width / 2
    const screenY = (npc.person.getTopCenter().y - camera.scrollY - camera.height / 2) * camera.zoom
      + camera.height / 2 - 6 - lift
    element.hidden = screenX < 18 || screenX > camera.width - 18 || screenY < 30 || screenY > camera.height
    element.style.left = screenX + 'px'
    element.style.top = screenY + 'px'
  }

  private render() {
    for (const [npc, check] of this.feedback) this.position(check, npc, 0)
    this.scoreLabel.textContent = this.score.toLocaleString()
    this.totals.textContent = this.resolved + ' / ' + this.level
    this.stressMeter.value = this.stress
    this.stressLabel.textContent = this.stress + '%'
    this.coffeeCount.textContent = 'Coffee breaks · ' + this.coffee
    for (const incident of this.active) {
      const { npc, marker, entry } = incident
      const task = incidents[npc.role]
      const selected = Boolean(this.isSelected(incident))
      const helping = npc.state === 'beingHelped'
      const countdown = Math.max(0, Math.ceil(incident.remaining)) + 's'
      const progress = helping ? 'In conversation' : countdown
      const label = task.title + ' · F' + (npc.floor + 1) + ' · ' + progress
      const markerText = helping ? '?' : task.cue + ' ' + countdown
      if (marker.textContent !== markerText) marker.textContent = markerText
      if (entry.textContent !== label) entry.textContent = label
      marker.setAttribute('aria-label', label)
      marker.toggleAttribute('data-selected', selected)
      entry.toggleAttribute('data-selected', selected)
      marker.toggleAttribute('data-urgent', !helping && incident.remaining <= 12)
      entry.toggleAttribute('data-urgent', !helping && incident.remaining <= 12)
      this.position(marker, npc, Math.sin((this.elapsed - incident.startedAt) * 3) * 2)
    }
  }
}
