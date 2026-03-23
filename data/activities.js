/**
 * NeuroPlex — Activity Registry
 * Single source of truth for all activity metadata.
 * To add a new activity: add one object to this array,
 * create activities/{id}.html and js/exercises/{id}.js
 */

const ACTIVITIES = [
  {
    id: 'schulte',
    icon: '🔢',
    color: '#00e5ff',
    tag: 'Visual Processing',
    title: 'Schulte Tables',
    slug: 'schulte',
    desc: 'Find numbers or letters in order as fast as possible across a randomized grid.',
    chips: ['Visual Scanning', 'Processing Speed', 'Focus'],
    functionTrained: 'Visual scanning, peripheral awareness, and processing speed through rapid sequential search.',
    benefits: [
      'Faster visual field scanning for reading and driving',
      'Improved peripheral awareness in daily life',
      'Enhanced attentional switching between targets',
      'Used by elite athletes, pilots, and military personnel'
    ],
    instructions: [
      'Click numbers in order from 1 to the grid maximum.',
      'Find each number as quickly as possible without moving your head.',
      'Use peripheral vision — avoid scanning every cell individually.',
      'Work from the center of the grid outward to engage your peripheral field.',
      'Aim to beat your completion time with each attempt.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Train visual scanning speed and peripheral awareness with Schulte Tables — a proven neuroplasticity exercise used by athletes and pilots.',
    file: 'activities/schulte.html'
  },
  {
    id: 'stroop',
    icon: '🎨',
    color: '#06ffa5',
    tag: 'Cognitive Control',
    title: 'Stroop Challenge',
    slug: 'stroop',
    desc: 'Name the COLOR of each word — not what the word says. Override your automatic reading response.',
    chips: ['Inhibition', 'Selective Attention', 'Cognitive Flexibility'],
    functionTrained: 'Cognitive control, selective attention, and executive function by suppressing automatic responses.',
    benefits: [
      'Override automatic responses under pressure',
      'Improved focus in cognitively conflicting situations',
      'Stronger executive function and self-regulation',
      'Used in psychological assessment and clinical brain training'
    ],
    instructions: [
      'A color word appears on screen printed in a mismatched ink color.',
      'Select the COLOR the word is printed in — NOT what the word says.',
      'Work as quickly as you can while staying accurate.',
      'Consciously override the urge to read the word aloud mentally.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Build cognitive control and inhibitory focus with the Stroop Challenge — train your brain to override automatic responses.',
    file: 'activities/stroop.html'
  },
  {
    id: 'rsvp',
    icon: '⚡',
    color: '#ff6b35',
    tag: 'Reading Speed',
    title: 'RSVP Speed Reading',
    slug: 'rsvp',
    desc: 'Read one word at a time at increasing speeds. Eliminate subvocalization and train faster comprehension.',
    chips: ['Reading Speed', 'Focus', 'Processing Speed'],
    functionTrained: 'Reading speed, attentional focus, and processing fluency by eliminating eye movement.',
    benefits: [
      'Significantly faster reading speeds with practice',
      'Reduced subvocalization (inner reading voice)',
      'Improved sustained focus under time pressure',
      'Better comprehension at high reading speeds'
    ],
    instructions: [
      'Words from a passage appear one at a time in the center of the screen.',
      'Keep your eyes fixed on the word zone — do not scan.',
      'Adjust WPM speed with the slider to find your edge.',
      'Start slow and increase gradually as comprehension stays intact.',
      'The goal is fluency and comprehension, not just raw speed.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Eliminate subvocalization and train faster reading comprehension with RSVP Speed Reading — a proven rapid serial visual presentation technique.',
    file: 'activities/rsvp.html'
  },
  {
    id: 'memory-grid',
    icon: '🧩',
    color: '#7c3aed',
    tag: 'Visual Memory',
    title: 'Grid Memory Challenge',
    slug: 'memory-grid',
    desc: 'Memorize emoji positions in a grid — then recall them after they are hidden.',
    chips: ['Visual Memory', 'Positional Memory', 'Working Memory'],
    functionTrained: 'Visual memory, spatial encoding, and working memory capacity through positional recall.',
    benefits: [
      'Improved recall for object locations in real life',
      'Stronger visuospatial working memory',
      'Better attention to detail and spatial awareness',
      'Useful for navigation, multitasking, and daily recall tasks'
    ],
    instructions: [
      'A grid of emojis will be shown for a limited memorization period.',
      'Study the positions carefully — build a mental map of the layout.',
      'When the grid hides, tap cells in the correct positions from memory.',
      'Progress from a 3×2 grid to larger grids as your memory improves.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Strengthen visual and positional working memory with the Grid Memory Challenge — memorize and recall emoji positions for real brain gains.',
    file: 'activities/memory-grid.html'
  },
  {
    id: 'focus-training',
    icon: '🎯',
    color: '#00e5ff',
    tag: 'Sustained Attention',
    title: 'Focus & Distraction Training',
    slug: 'focus-training',
    desc: 'Keep your gaze on one target while other objects move and distract around it.',
    chips: ['Selective Attention', 'Inhibition', 'Concentration'],
    functionTrained: 'Selective attention, inhibitory control, and distraction resistance in a dynamic visual field.',
    benefits: [
      'Stronger ability to focus in noisy or chaotic environments',
      'Improved ability to filter out irrelevant stimuli',
      'Better performance in high-distraction work contexts',
      'Practical benefits for studying, driving, and sports performance'
    ],
    instructions: [
      'A central target appears on screen — a glowing crosshair.',
      'Other objects move and change around it as distractors.',
      'Keep your focus on the central target for the full duration.',
      'Resist the urge to track the moving distractors.',
      'Progressively increase the number and speed of distractors.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Train selective attention and distraction resistance with Focus Training — build the mental discipline to stay locked on what matters.',
    file: 'activities/focus-training.html'
  },
  {
    id: 'peripheral',
    icon: '👁',
    color: '#06ffa5',
    tag: 'Peripheral Vision',
    title: 'Peripheral Vision Tracking',
    slug: 'peripheral',
    desc: 'Track a highlighted ball with your peripheral vision while keeping eyes fixed on the center.',
    chips: ['Peripheral Awareness', 'Attention Distribution', 'Visual Field'],
    functionTrained: 'Peripheral vision, divided attention, and spatial tracking across the full visual field.',
    benefits: [
      'Better situational awareness while driving or playing sport',
      'Wider effective visual field in daily life',
      'Ability to consciously monitor multiple things simultaneously',
      'Used in vision therapy and elite sports training programs'
    ],
    instructions: [
      'Fix your gaze on the central cross at all times — do not look away.',
      'A highlighted green ball will move in your peripheral field.',
      'Track it mentally without moving your eyes to follow it.',
      'Increase to multiple balls for advanced divided-attention training.',
      'The goal is to expand your field of conscious visual awareness.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Expand your peripheral vision and situational awareness with Peripheral Tracking — training used in vision therapy and elite sports programs.',
    file: 'activities/peripheral.html'
  },
  {
    id: 'reverse-recall',
    icon: '🔁',
    color: '#ff6b35',
    tag: 'Working Memory',
    title: 'Reverse Recall',
    slug: 'reverse-recall',
    desc: 'Memorize a sequence of numbers, then repeat it in reverse order from memory.',
    chips: ['Working Memory', 'Mental Manipulation', 'Sequencing'],
    functionTrained: 'Working memory, cognitive flexibility, and mental manipulation of held information.',
    benefits: [
      'Expanded working memory capacity with consistent training',
      'Improved ability to hold and manipulate information mentally',
      'Stronger cognitive flexibility and mental agility',
      'Associated with higher fluid intelligence scores in research'
    ],
    instructions: [
      'A sequence of numbers will be displayed one at a time.',
      'Memorize the full sequence in order as shown.',
      'When prompted, enter the sequence in REVERSE order.',
      'Start with 4-digit sequences and work up to 9 or more.',
      'Tip: chunk numbers into pairs to make reversal easier.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Expand working memory and mental flexibility with Reverse Recall — a digit-span exercise linked to higher fluid intelligence.',
    file: 'activities/reverse-recall.html'
  },
  {
    id: 'gorilla',
    icon: '🦍',
    color: '#7c3aed',
    tag: 'Attentional Control',
    title: 'Gorilla Effect Challenge',
    slug: 'gorilla',
    desc: 'Track one specific shape among many — and notice when the unexpected intruder walks through.',
    chips: ['Sustained Attention', 'Inattentional Blindness', 'Awareness'],
    functionTrained: 'Sustained attention, inattentional blindness awareness, and attentional control under novelty.',
    benefits: [
      'Reduced inattentional blindness in real-life situations',
      'Improved situational and environmental awareness',
      'Stronger sustained focus over extended time periods',
      'Direct awareness of your own attentional limitations'
    ],
    instructions: [
      'A group of shapes will move across the screen.',
      'Track the highlighted cyan target shape with your eyes.',
      'An unexpected object will appear mid-task — notice it.',
      'After the round, reflect on whether you spotted the intruder.',
      'This trains awareness of your attentional blind spots.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Train attentional awareness and reduce inattentional blindness with the Gorilla Effect Challenge — inspired by landmark psychology research.',
    file: 'activities/gorilla.html'
  },
  {
    id: 'stationary-focus',
    icon: '🕯',
    color: '#06ffa5',
    tag: 'Mindfulness Focus',
    title: 'Stationary Object Focus',
    slug: 'stationary-focus',
    desc: 'Fix your gaze on a single object for a set period. Build the muscle of sustained attention.',
    chips: ['Sustained Attention', 'Mindfulness', 'Concentration Endurance'],
    functionTrained: 'Sustained attention, mindfulness, and prefrontal self-regulation through deliberate fixation.',
    benefits: [
      'Extended concentration endurance over time',
      'Reduced mind-wandering and involuntary rumination',
      'Calmer default-mode network activity',
      'Foundation skill that enhances all other cognitive training'
    ],
    instructions: [
      'A candle flame appears on screen — animated to feel real.',
      'Fix your gaze on it and do not deliberately look away.',
      'When your mind wanders — and it will — notice it, then return.',
      'Each return of attention is one repetition of the training.',
      'Start with 30 seconds. Build gradually to 5 minutes over weeks.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Build deep concentration endurance with Stationary Object Focus — a mindfulness-based attention exercise that is the foundation of all cognitive training.',
    file: 'activities/stationary-focus.html'
  },
  {
    id: 'maze',
    icon: '🌀',
    color: '#00e5ff',
    tag: 'Spatial Memory',
    title: 'Maze Memory Challenge',
    slug: 'maze',
    desc: 'Memorize a maze path — then navigate through it from memory alone.',
    chips: ['Spatial Memory', 'Working Memory', 'Planning'],
    functionTrained: 'Spatial memory, route planning, and cognitive mapping through the hippocampal system.',
    benefits: [
      'Better memory for spatial layouts and directions',
      'Improved planning, foresight, and route construction',
      'Stronger mental map construction abilities',
      'Useful for navigation, architecture, and strategic thinking'
    ],
    instructions: [
      'A maze with a marked solution path is shown briefly.',
      'Study the path — focus on the feel and shape of each turn.',
      'The path is then hidden, showing only your current position.',
      'Navigate using arrow keys or WASD from memory alone.',
      'This trains your hippocampal spatial map encoding system.'
    ],
    interactive: true,
    offline: false,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Train spatial memory and hippocampal route planning with the Maze Memory Challenge — navigate from memory alone after a brief study period.',
    file: 'activities/maze.html'
  },
  {
    id: 'dual-hand',
    icon: '✋',
    color: '#7c3aed',
    tag: 'Bilateral Coordination',
    title: 'Dual-Hand Drawing',
    slug: 'dual-hand',
    desc: 'Draw two different shapes simultaneously — one with each hand. Challenges both hemispheres at once.',
    chips: ['Motor Control', 'Bilateral Coordination', 'Attention Split'],
    functionTrained: 'Bilateral motor coordination, corpus callosum integration, and split-attention motor control.',
    benefits: [
      'Strengthens corpus callosum connections between brain hemispheres',
      'Improves fine motor control and body awareness',
      'Better performance at multitasking physical tasks',
      'Used in neuro-rehabilitation and advanced musical training'
    ],
    instructions: [
      'Prepare two sheets of paper and a pen for each hand.',
      'Assign a shape to each hand — e.g., circle left, triangle right.',
      'Begin drawing both shapes simultaneously at the same pace.',
      'Your brain will resist — this resistance is the training.',
      'Progress to more complex shapes as bilateral coordination improves.'
    ],
    interactive: false,
    offline: true,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Strengthen both brain hemispheres with Dual-Hand Drawing — a bilateral coordination exercise used in neuro-rehabilitation and musical training.',
    file: 'activities/dual-hand.html'
  },
  {
    id: 'blindfold',
    icon: '🙈',
    color: '#ff6b35',
    tag: 'Motor Memory',
    title: 'Blindfold Tasks',
    slug: 'blindfold',
    desc: 'Perform typing, writing or tracing tasks without visual input to train proprioception and motor memory.',
    chips: ['Proprioception', 'Motor Memory', 'Internal Focus'],
    functionTrained: 'Proprioception, motor memory encoding, and internal body awareness without visual feedback.',
    benefits: [
      'Stronger muscle memory and clean motor programs',
      'Reduced visual dependency for motor tasks',
      'Improved internal body and spatial awareness',
      'Better typing speed and accuracy; stronger coding flow states'
    ],
    instructions: [
      'Choose a task: type a sentence, write numbers 1–20, or trace a shape.',
      'Close your eyes or use a sleep mask — no peeking.',
      'Perform the entire task relying only on touch and muscle memory.',
      'Open your eyes and assess accuracy without judgment.',
      'Identify your weakest points and repeat those sections specifically.'
    ],
    interactive: false,
    offline: true,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Train proprioception and motor memory with Blindfold Tasks — build visual-independent muscle memory for typing, writing, and physical movement.',
    file: 'activities/blindfold.html'
  },
  {
    id: 'bimanual',
    icon: '🤲',
    color: '#06ffa5',
    tag: 'Motor-Cognitive',
    title: 'Bimanual Hand Signs',
    slug: 'bimanual',
    desc: 'Replicate different hand signs with each hand simultaneously as they appear on screen.',
    chips: ['Bilateral Coordination', 'Reaction Time', 'Motor-Cognitive'],
    functionTrained: 'Motor-cognitive integration, independent bilateral hand control, and dynamic reaction speed.',
    benefits: [
      'Elite-level hand coordination for musicians, surgeons, and athletes',
      'Faster reaction to dynamic bilateral stimuli',
      'Independent fine motor control per hand',
      'Strengthens both hemispheres and their cross-communication'
    ],
    instructions: [
      'Two hand signs appear on screen — one for each hand.',
      'Replicate both signs simultaneously using both hands.',
      'Hold each combination as a new pairing appears.',
      'Practice for 2–5 minutes continuously without stopping.',
      'Use a mirror to verify both hands are forming correct signs.'
    ],
    interactive: false,
    offline: true,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'],
    seoDescription: 'Develop elite bilateral hand coordination with Bimanual Hand Signs — motor-cognitive training used by musicians, surgeons, and top athletes.',
    file: 'activities/bimanual.html'
  }
];

// Export for use in both browser (global) and module contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACTIVITIES };
}
