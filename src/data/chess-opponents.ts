import type { Level } from "@/lib/chess-ai"

/** Moments in a game where the opponent says something. */
export type ChatEvent =
  | "greet"
  | "thinking"
  | "aiCaptures"
  | "playerCaptures"
  | "aiChecks"
  | "playerChecks"
  | "banter"
  | "aiWins"
  | "playerWins"
  | "draw"
  | "undo"
  | "hint"
  | "resign"

export type Mood = "happy" | "thinking" | "surprised" | "proud" | "sad" | "cheeky"

export type Opponent = {
  level: Level
  name: string
  face: string // emoji
  title: string
  tagline: string
  difficulty: string
  tile: string // tailwind gradient
  /** {piece} is replaced with the captured piece's name */
  lines: Record<ChatEvent, string[]>
}

export const moodEmoji: Record<Mood, string> = {
  happy: "😊",
  thinking: "🤔",
  surprised: "😮",
  proud: "😎",
  sad: "😢",
  cheeky: "😜",
}

export const eventMood: Record<ChatEvent, Mood> = {
  greet: "happy",
  thinking: "thinking",
  aiCaptures: "cheeky",
  playerCaptures: "surprised",
  aiChecks: "proud",
  playerChecks: "surprised",
  banter: "happy",
  aiWins: "proud",
  playerWins: "sad",
  draw: "happy",
  undo: "happy",
  hint: "happy",
  resign: "happy",
}

export const opponents: Opponent[] = [
  {
    level: 1,
    name: "Pip",
    face: "🐣",
    title: "The Little Chick",
    tagline: "Just learned how the pieces move!",
    difficulty: "Easy",
    tile: "from-[#FFD166] to-[#F7A928]",
    lines: {
      greet: ["Peep peep! Hi! I just learned chess. Let’s play!", "Hello friend! Go easy on me, okay? 🐣"],
      thinking: ["Hmm… which one is the horsey again?", "Peep… let me think…", "Eeny, meeny, miny… this one!"],
      aiCaptures: ["Oh! I got your {piece}! Was that okay?", "Yay, a {piece}! Peep peep!"],
      playerCaptures: ["Oh no, my {piece}! 🥺", "Hey! I was using that {piece}!", "Peep! You’re good at this!"],
      aiChecks: ["Check! …Did I say that right?", "Check! Hehe, that’s the king one, right?"],
      playerChecks: ["Eek! My king is in trouble!", "Check?! Where do I hide him?"],
      banter: ["Chess is fun!", "I like the little pawns. They’re brave!", "Your turn, your turn!"],
      aiWins: ["I… I WON?! Peep peep peep! 🎉", "Wow, I really won! Want to play again?"],
      playerWins: ["You won! Great job! 🌟 Can you beat Bella next?", "Checkmate… you’re a star! Peep!"],
      draw: ["A draw! We’re both winners! 🐣"],
      undo: ["Sure, try again! Everybody makes oopsies."],
      hint: ["Ooh, a hint! Good idea!"],
      resign: ["Aww, okay! Let’s play again soon!"],
    },
  },
  {
    level: 2,
    name: "Bella",
    face: "🐰",
    title: "The Hoppy Bunny",
    tagline: "Hops around the board looking for treats.",
    difficulty: "Easy+",
    tile: "from-[#FF9A9E] to-[#F06292]",
    lines: {
      greet: ["Hop hop! I’m Bella. Ready for a bouncy game?", "Hi there! Knights are my favourite — they hop like me! 🐰"],
      thinking: ["Hop… hop… where to go?", "Let me sniff out a good move…", "Hmm, carrots or queens? Both!"],
      aiCaptures: ["Nom nom! Your {piece} was tasty! 🥕", "Hop! I caught a {piece}!"],
      playerCaptures: ["Hey, that was my {piece}! Hmph!", "Oh! You caught my {piece}. Sneaky!"],
      aiChecks: ["Check! Hop hop, your king has to move!", "Boing! Check!"],
      playerChecks: ["Yikes! Check! Let me hop away!", "My king needs a burrow to hide in!"],
      banter: ["Did you know knights can jump over pieces? Like me!", "This is hop-tastic!", "Your move, bunny buddy!"],
      aiWins: ["Checkmate! Hop hop hooray! 🎉", "I won! Want a rematch? I’ll share my carrots."],
      playerWins: ["You won! You’re a super hopper! 🌟", "Checkmate… wow! Try Professor Hoot next!"],
      draw: ["A draw! Let’s share the carrot cake. 🥕"],
      undo: ["Okay, hop back and try again!"],
      hint: ["A hint? Smart bunny move!"],
      resign: ["Aww, let’s hop into another game later!"],
    },
  },
  {
    level: 3,
    name: "Professor Hoot",
    face: "🦉",
    title: "The Wise Owl",
    tagline: "Thinks one step ahead. Loves a good lesson.",
    difficulty: "Medium",
    tile: "from-[#7AD3FF] to-[#4F8BFF]",
    lines: {
      greet: ["Hoo-hoo! Welcome to my classroom. Control the centre, young one!", "Good day! Remember: knights before bishops. Hoo!"],
      thinking: ["Hoo… let me consider the possibilities…", "An interesting position. Hmm…", "Every move is a lesson…"],
      aiCaptures: ["I’ll take that {piece}, thank you. Guard your pieces!", "A {piece} left alone is a {piece} lost. Hoo!"],
      playerCaptures: ["Well spotted! You took my {piece}.", "Hoo! A fine capture of my {piece}."],
      aiChecks: ["Check! Can you find the safe square?", "Check! Think carefully now."],
      playerChecks: ["Check! Excellent attacking, student!", "Hoo! My king must retreat."],
      banter: ["Tip: castle early to keep your king safe.", "Tip: a rook loves an open file.", "Tip: look at every check and capture first."],
      aiWins: ["Checkmate. Study this game and you’ll grow stronger! 🦉", "Class dismissed! Try again — you’re learning fast."],
      playerWins: ["Checkmate! Top marks, student! 🌟", "Hoo-ray! You’ve graduated. Captain Rex awaits!"],
      draw: ["A draw — a respectable result. Hoo!"],
      undo: ["Of course. Mistakes are how we learn."],
      hint: ["Let’s see what a wise owl would play…"],
      resign: ["Resigning is okay. Let’s review and try again!"],
    },
  },
  {
    level: 4,
    name: "Captain Rex",
    face: "🦖",
    title: "The Dino Captain",
    tagline: "Loves to attack. ROAR!",
    difficulty: "Hard",
    tile: "from-[#6BCB77] to-[#2E8B57]",
    lines: {
      greet: ["ROAR! Captain Rex reporting! Prepare for battle!", "My army is ready. Is yours? RAWR! 🦖"],
      thinking: ["Planning my ATTACK…", "Grr… scanning the battlefield…", "Where is your weak spot…"],
      aiCaptures: ["CHOMP! Your {piece} is dino food!", "ROAR! That {piece} is mine!"],
      playerCaptures: ["GRR! You got my {piece}!", "Ouch! My {piece}! You’ll pay for that! (nicely)"],
      aiChecks: ["CHECK! RAWR!", "Check! The dino is coming for your king!"],
      playerChecks: ["What?! Check on the Captain?!", "Grr… a brave attack!"],
      banter: ["Attack, attack, ATTACK!", "My tiny arms can still move big pieces!", "Is that all you’ve got? RAWR!"],
      aiWins: ["CHECKMATE! The Captain wins! ROAR! 🦖", "Victory! But you fought bravely, soldier."],
      playerWins: ["You… beat the Captain?! Legendary! 🌟", "Checkmate… RAWR, respect! Only Luna is left!"],
      draw: ["A draw! A worthy opponent. RAWR!"],
      undo: ["Fine, take it back. Even dinos slip!"],
      hint: ["Calling for backup, eh?"],
      resign: ["You surrender? Train hard and come back!"],
    },
  },
  {
    level: 5,
    name: "Luna",
    face: "🐲",
    title: "The Champion Dragon",
    tagline: "The champion of LittleReaderLab. Can you beat her?",
    difficulty: "Champion",
    tile: "from-[#A18CD1] to-[#5B3FA8]",
    lines: {
      greet: ["So, you want to face the champion? Very well. 🐲", "I have guarded this board for a thousand years. Begin."],
      thinking: ["I see many futures…", "Calculating…", "Interesting. Very interesting…"],
      aiCaptures: ["Your {piece} was undefended.", "I’ll collect that {piece}. 🔥"],
      playerCaptures: ["You took my {piece}. Impressive.", "Hmm. My {piece}… I did not see that."],
      aiChecks: ["Check.", "Check. The fire grows closer. 🔥"],
      playerChecks: ["Check? Bold. Very bold.", "You dare check a dragon?"],
      banter: ["Every piece matters.", "Patience wins more games than speed.", "The champion is watching every move."],
      aiWins: ["Checkmate. Come back when you are stronger. 🐲", "The champion remains. But you are growing."],
      playerWins: ["Checkmate… You are the new champion of LittleReaderLab! 👑", "I… lost? Incredible. You have earned my crown. 👑"],
      draw: ["A draw against a dragon. Few can say that."],
      undo: ["Hmm. Take it back, then."],
      hint: ["Seeking wisdom? Wise."],
      resign: ["A wise retreat. Return when ready."],
    },
  },
]

export function lineFor(op: Opponent, event: ChatEvent, piece?: PieceName, avoid?: string) {
  const pool = op.lines[event]
  const options = pool.length > 1 ? pool.filter((l) => l !== avoid) : pool
  const line = options[Math.floor(Math.random() * options.length)]
  return piece ? line.replaceAll("{piece}", piece) : line
}

export type PieceName = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"
export const pieceName: Record<string, PieceName> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
}
