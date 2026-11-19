import type { DialogueLine } from './dialogue'

type DialogueScene = { name: string; line: DialogueLine }

export const dialogueScenes = {
  junior: {
    name: 'Junior Developer',
    line: { speaker: 'ihor', text: 'Беремо і робимо!', translation: 'We just get it done!' },
  },
  interview: {
    name: 'Candidate',
    line: { speaker: 'ihor', text: 'Иногда, редко.', translation: 'Sometimes. Rarely.' },
  },
  staffing: {
    name: 'Project Coordinator',
    line: { speaker: 'ihor', text: 'Касса впереди!', translation: 'The checkout is still ahead!' },
  },
  management: {
    name: 'Operations Manager',
    line: { speaker: 'ihor', text: 'Нда-а, втянули в какую-то хуйню.', translation: 'Well, they dragged us into some bullshit.' },
  },
  training: {
    name: 'Training Coordinator',
    line: { speaker: 'ihor', text: 'Жизнь — это супермаркет.', translation: 'Life is a supermarket.' },
  },
  event: {
    name: 'Team Event Organizer',
    line: { speaker: 'ihor', text: 'Шёл на день рождения, а попал в больницу.', translation: 'I was going to a birthday party and ended up in the hospital.' },
  },
  coffee: {
    name: 'Colleague',
    line: { speaker: 'npc', text: 'Кофе идёшь пить?', translation: 'Coffee? You coming?' },
  },
} satisfies Record<string, DialogueScene>

