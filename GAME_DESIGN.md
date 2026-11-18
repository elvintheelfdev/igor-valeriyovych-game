# Cosplay Ihor: Become Ihor for a Day!

## Browser game

Build with Phaser, TypeScript, and Vite. The game takes place in one large, scrollable office level. Use a warm, hand-painted 2.5D style. Igor Valeriyovych is the team lead.

## Core loop

The game fills the browser viewport. Frame the camera at room scale, with the current floor and portions of neighboring floors visible. Players can pan the camera across the full building.

Keep permanent architecture in the background art. Add usable furniture and equipment as separate Phaser objects so they can have their own interaction targets and depth.

- Problems appear among everyday office NPCs. Click a problem and Igor automatically runs to it and resolves it.
- Play continues indefinitely as difficulty increases. Managing stress is central to the run.
- Resolving problems earns coffee breaks. The coffee and smoking area is outside the building entrance.
- At Game Over, Igor relaxes at home playing GTA VI.
- Keep the UI in English and preserve the two established meme phrases verbatim once their wording is recovered.

## Progress and scores

The prior discussion proposed saving unfinished runs and personal bests in the browser. Resuming a run requires restoring active problems, positions, and remaining timers alongside the score and stress state. The design calls for a shared online leaderboard. Supabase was discussed as a possible backend, with score submission after Game Over.

## References needed for implementation

- Approved Igor sprite sheet (PNG).
- Approved office mockup.
- Exact wording of the two meme phrases and any gameplay tuning from the earlier design discussion.

Source: [Створення прототипу гри](chatgpt-conversation://6afd7e8f-64e4-83ed-b18d-08f340057d14).
