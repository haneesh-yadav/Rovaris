// Shared protocol directives for each round — used by TeamDashboard's
// in-header "Round Instructions" panel and by the Briefing page, so the
// two never drift out of sync.

export const ROUND_INSTRUCTIONS = {
  1: {
    title: 'ROUND 1 PROTOCOL DIRECTIVES',
    items: [
      { label: 'Interface Corrupted:', text: 'Control buttons are mismatched—test inputs to decipher true direction mapping.' },
      { label: 'Checkpoint Required:', text: 'Reach the halfway checkpoint, solve the riddle to clear path locks, and make it to the relay station.' },
    ],
  },
  2: {
    title: 'ROUND 2 PROTOCOL DIRECTIVES',
    items: [
      { label: 'Manage Emergency Power:', text: 'Allocate your initial 90 units among 7 systems; review exact consequences before locking in.' },
      { label: 'Solve Recovery Challenges:', text: 'Solve Hangman puzzles within 6 minutes to gain +15 power units and bonus points.' },
      { label: 'Mitigate Failures:', text: 'Failing a Hangman challenge forces you to select 1 active system to shut down.' },
    ],
  },
  3: {
    title: 'ROUND 3 PROTOCOL DIRECTIVES',
    items: [
      { label: 'Decode Morse Audio:', text: 'Play the distorted transmission to listen for embedded dot-and-dash Morse signals.' },
      { label: 'Use Reference Sheet:', text: 'Translate signals into letters using the permanent Morse Code Reference Table on screen.' },
      { label: 'Audio Controls:', text: 'Teams can play the audio as many times as they want and can pause/resume the audio at any time.' },
    ],
  },
};