import type { DialogueLine } from './dialogue'

type DialogueScene = { name: string; lines: readonly DialogueLine[] }

export const dialogueScenes = {
  junior: {
    name: 'Junior Developer',
    lines: [
      { speaker: 'npc', text: 'I’m stuck. I’ve made three plans for this assignment and started none of them.' },
      { speaker: 'ihor', text: 'What’s so complicated? It’s easy. Look.' },
      { speaker: 'ihor', text: 'Beremo i robymo!', translation: 'We just get it done!' },
      { speaker: 'npc', text: 'Right. I’ll start with the first draft. There goes plan number four.' },
    ],
  },
  interview: {
    name: 'Candidate',
    lines: [
      { speaker: 'npc', text: 'Where do you see this team in five years?' },
      { speaker: 'ihor', text: 'You’re interviewing me now? Good. Two minutes in and you’ve already taken ownership.' },
      { speaker: 'npc', text: 'Great. My first decision is to skip the next interview round.' },
    ],
  },
  staffing: {
    name: 'Project Coordinator',
    lines: [
      { speaker: 'npc', text: 'The project needs one more person. Everyone is already booked.' },
      { speaker: 'ihor', text: 'Then take something off their calendar first. We’re staffing a project, not arranging a miracle.' },
      { speaker: 'npc', text: 'I’ll cancel the meeting about finding time. There’s an hour already.' },
    ],
  },
  management: {
    name: 'Operations Manager',
    lines: [
      { speaker: 'npc', text: 'We need one priority for next week. I’ve shortlisted seven.' },
      { speaker: 'ihor', text: 'Pick one. Put the other six on the last slide. That’s where plans go to rest.' },
      { speaker: 'npc', text: 'Fine. I’ll call that slide “Long-Term Strategy.”', autoAdvanceMs: 3200 },
    ],
  },
  training: {
    name: 'Training Coordinator',
    lines: [
      { speaker: 'npc', text: 'We’re ready for your lecture on giving feedback. How many slides did you bring?' },
      { speaker: 'ihor', text: 'One. Pair up and tell each other how to improve it.' },
      { speaker: 'npc', text: 'First bit of feedback: make the font bigger.' },
    ],
  },
  event: {
    name: 'Team Event Organizer',
    lines: [
      { speaker: 'npc', text: 'The team lunch clashes with two handovers. Should I make attendance mandatory?' },
      { speaker: 'ihor', text: 'Move the lunch after the handovers. If you make it mandatory, they’ll ask for an agenda.' },
      { speaker: 'npc', text: 'Good point. The agenda was pizza.' },
    ],
  },
  coffee: {
    name: 'Colleague',
    lines: [
      { speaker: 'npc', text: 'Kofe idyosh pit?', translation: 'Coffee? You coming?' },
      { speaker: 'ihor', text: 'Of course. It’s the only meeting today with a clear outcome.' },
      { speaker: 'npc', text: 'Two coffees. I’ll put it in the minutes.', autoAdvanceMs: 3000 },
    ],
  },
} satisfies Record<string, DialogueScene>

