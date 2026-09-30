// Word Builder stories: spell the missing word in each sentence and the story fills in.
// "___" marks the missing word in a sentence.

import { gradeOf } from "@/lib/accounts"

export type WordTrack = "c0" | "c1" | "c2" | "c3" | "story" // one level per class (Class 4 = story words)

export type StoryLine = { text: string; word: string; hint: string }
export type WordStory = { id: string; track: WordTrack; title: string; emoji: string; lines: StoryLine[] }

/** `exam`: how many words the exam (sentences mixed from every story) has for this class range. */
export const wordTracks: { id: WordTrack; name: string; ages: string; blurb: string; emoji: string; tile: string; exam: number }[] = [
  { id: "c0", name: "First words", ages: "Class 0", blurb: "3-letter words with a picture clue", emoji: "🐣", tile: "from-[#FFB347] to-[#FF7A59]", exam: 10 },
  { id: "c1", name: "Little words", ages: "Class 1", blurb: "3- and 4-letter words with a picture clue", emoji: "🧸", tile: "from-[#FF8A5B] to-[#FF5E7E]", exam: 10 },
  { id: "c2", name: "Picture words", ages: "Class 2", blurb: "Words of 4 to 7 letters with a picture clue", emoji: "🖼️", tile: "from-[#4FACFE] to-[#6C63FF]", exam: 10 },
  { id: "c3", name: "Picture stories", ages: "Class 3", blurb: "Longer words in bigger stories", emoji: "📚", tile: "from-[#B06AB3] to-[#5B3FA8]", exam: 10 },
  { id: "story", name: "Story words", ages: "Class 4", blurb: "Longer words with a meaning clue", emoji: "📖", tile: "from-[#2BC0A4] to-[#1F9D6B]", exam: 15 },
]

/** The level for a student's class (Class 0 → c0 … Class 3 → c3, Class 4 → story words). */
export const trackForAge = (age?: string): WordTrack => {
  const g = gradeOf(age) ?? 0
  return g >= 4 ? "story" : (`c${g}` as WordTrack)
}

/** Picture clues for Class 0–3, meaning clues for Class 4. */
export const hasPictureClue = (track: WordTrack) => track !== "story"

const L = (text: string, word: string, hint: string): StoryLine => ({ text, word, hint })

export const wordStories: WordStory[] = [
  // ------------------------------------------------------------ First words (Class 0): 3 letters, very short sentences
  {
    id: "pets",
    track: "c0",
    title: "Animal Friends",
    emoji: "🐾",
    lines: [L("I see a ___.", "CAT", "🐱"), L("The ___ can run.", "DOG", "🐶"), L("A ___ is pink.", "PIG", "🐷"), L("The ___ has eggs.", "HEN", "🐔"), L("A ___ says moo.", "COW", "🐄"), L("The ___ is red.", "FOX", "🦊")],
  },
  {
    id: "sunny",
    track: "c0",
    title: "Sunny Day",
    emoji: "☀️",
    lines: [L("The ___ is hot.", "SUN", "☀️"), L("I have a ___.", "HAT", "👒"), L("I get on the ___.", "BUS", "🚌"), L("I see the ___.", "SEA", "🌊"), L("Dad has a red ___.", "CAR", "🚗"), L("I drink from a ___.", "CUP", "🥤")],
  },
  {
    id: "home0",
    track: "c0",
    title: "At Home",
    emoji: "🏠",
    lines: [L("I hug my ___.", "MUM", "👩"), L("My ___ is tall.", "DAD", "👨"), L("I sleep in my ___.", "BED", "🛏️"), L("The toy is in the ___.", "BOX", "📦"), L("I draw with a ___.", "PEN", "🖊️"), L("Mum has a ___.", "KEY", "🔑")],
  },
  {
    id: "yummy",
    track: "c0",
    title: "Yummy Food",
    emoji: "🍽️",
    lines: [L("I eat an ___.", "EGG", "🥚"), L("Grandma makes a ___.", "PIE", "🥧"), L("A squirrel eats a ___.", "NUT", "🥜"), L("I have a ___.", "BUN", "🥯"), L("Dad drinks ___.", "TEA", "🍵"), L("The ___ is cold.", "ICE", "🧊")],
  },

  // ------------------------------------------------------------ Little words (Class 1): 3–4 letters
  {
    id: "park",
    track: "c1",
    title: "In the Park",
    emoji: "🌳",
    lines: [L("We go to the ___.", "PARK", "🏞️"), L("I kick a big ___.", "BALL", "⚽"), L("A ___ sings in the tree.", "BIRD", "🐦"), L("I fly my ___.", "KITE", "🪁"), L("A ___ swims in the pond.", "DUCK", "🦆"), L("We eat ___ on the grass.", "CAKE", "🍰")],
  },
  {
    id: "body",
    track: "c1",
    title: "My Body",
    emoji: "🧒",
    lines: [L("I see with my ___.", "EYES", "👀"), L("I smell with my ___.", "NOSE", "👃"), L("I hear with my ___.", "EAR", "👂"), L("I smile with my ___.", "LIPS", "👄"), L("I wave my ___.", "HAND", "✋"), L("I walk on my ___.", "FEET", "🦶")],
  },
  {
    id: "weather1",
    track: "c1",
    title: "Weather Walk",
    emoji: "🌦️",
    lines: [L("Look at the ___!", "RAIN", "🌧️"), L("The ___ is white and cold.", "SNOW", "❄️"), L("A ___ falls from the tree.", "LEAF", "🍂"), L("I put on my ___.", "COAT", "🧥"), L("The ___ is in the night sky.", "MOON", "🌙"), L("I see a little ___.", "STAR", "⭐")],
  },
  {
    id: "toys",
    track: "c1",
    title: "My Toy Box",
    emoji: "🧸",
    lines: [L("I love my teddy ___.", "BEAR", "🧸"), L("I bang my ___.", "DRUM", "🥁"), L("She has a pretty ___.", "DOLL", "🪆"), L("I read a ___.", "BOOK", "📖"), L("We play a ___.", "GAME", "🎲"), L("My toy ___ can jump.", "FROG", "🐸")],
  },

  // ------------------------------------------------------------ Picture words (Class 2): 4–7 letters
  {
    id: "market2",
    track: "c2",
    title: "At the Market",
    emoji: "🧺",
    lines: [
      L("Mum buys a red ___.", "APPLE", "🍎"),
      L("We need fresh ___.", "BREAD", "🍞"),
      L("Dad gets a bottle of ___.", "MILK", "🥛"),
      L("A ___ is yellow and sour.", "LEMON", "🍋"),
      L("I like sweet green ___.", "GRAPES", "🍇"),
      L("The mouse wants the ___.", "CHEESE", "🧀"),
      L("A rabbit eats an orange ___.", "CARROT", "🥕"),
      L("Mum pays with ___.", "MONEY", "💰"),
    ],
  },
  {
    id: "school2",
    track: "c2",
    title: "My Classroom",
    emoji: "🏫",
    lines: [
      L("I sit on my ___.", "CHAIR", "🪑"),
      L("I write with a ___.", "PENCIL", "✏️"),
      L("The ___ says nine o’clock.", "CLOCK", "🕘"),
      L("Our ___ is very kind.", "TEACHER", "🧑‍🏫"),
      L("I draw a line with a ___.", "RULER", "📏"),
      L("I draw a cat on the ___.", "PAPER", "📄"),
      L("The school ___ rings.", "BELL", "🔔"),
      L("We eat ___ at twelve.", "LUNCH", "🍱"),
    ],
  },
  {
    id: "sea2",
    track: "c2",
    title: "By the Sea",
    emoji: "🌊",
    lines: [
      L("We sail in a small ___.", "BOAT", "🚤"),
      L("I find a pink ___.", "SHELL", "🐚"),
      L("A ___ walks sideways.", "CRAB", "🦀"),
      L("A big ___ swims by.", "WHALE", "🐋"),
      L("I make a castle in the ___.", "SAND", "🏖️"),
      L("The ___ are big today.", "WAVES", "🌊"),
      L("A ___ has sharp teeth.", "SHARK", "🦈"),
      L("A little ___ swims fast.", "FISH", "🐟"),
    ],
  },
  {
    id: "night2",
    track: "c2",
    title: "Good Night",
    emoji: "🌙",
    lines: [
      L("I have a warm ___.", "BATH", "🛁"),
      L("I brush my ___.", "TEETH", "🦷"),
      L("Dad reads me a ___.", "STORY", "📖"),
      L("My head is on the ___.", "PILLOW", "🛏️"),
      L("Mum turns off the ___.", "LIGHT", "💡"),
      L("An ___ says hoo-hoo.", "OWL", "🦉"),
      L("I have a happy ___.", "DREAM", "💭"),
      L("Now it is time to ___.", "SLEEP", "😴"),
    ],
  },

  // ------------------------------------------------------------ Picture stories (Class 3)
  {
    id: "garden",
    track: "c3",
    title: "Lily’s Garden",
    emoji: "🌻",
    lines: [
      { text: "Lily has a small ___ behind her house.", word: "GARDEN", hint: "🪴" },
      { text: "Every morning she waters the red ___.", word: "ROSES", hint: "🌹" },
      { text: "A big yellow ___ shines in the sky.", word: "SUN", hint: "☀️" },
      { text: "A little green ___ hops on the grass.", word: "FROG", hint: "🐸" },
      { text: "A busy ___ buzzes around the flowers.", word: "BEE", hint: "🐝" },
      { text: "Lily picks a shiny ___ from the tree.", word: "APPLE", hint: "🍎" },
      { text: "Her ___ runs after a ball.", word: "DOG", hint: "🐶" },
      { text: "At night, Lily looks at the ___.", word: "MOON", hint: "🌙" },
    ],
  },
  {
    id: "trip",
    track: "c3",
    title: "The Big Trip",
    emoji: "🚂",
    lines: [
      { text: "Sam packs his ___ for a trip.", word: "BAG", hint: "🎒" },
      { text: "He gets on a long ___.", word: "TRAIN", hint: "🚂" },
      { text: "Out of the window he sees a ___.", word: "COW", hint: "🐄" },
      { text: "The train goes over a ___.", word: "BRIDGE", hint: "🌉" },
      { text: "Sam eats a ___ for lunch.", word: "PIZZA", hint: "🍕" },
      { text: "Then he reads a ___.", word: "BOOK", hint: "📖" },
      { text: "Grandma gives him a big ___.", word: "HUG", hint: "🤗" },
      { text: "Sam sleeps well in his warm ___.", word: "BED", hint: "🛏️" },
    ],
  },

  {
    id: "farm",
    track: "c3",
    title: "At the Farm",
    emoji: "🐄",
    lines: [
      { text: "Grandpa drives a red ___.", word: "TRACTOR", hint: "🚜" },
      { text: "A ___ gives us milk.", word: "COW", hint: "🐄" },
      { text: "The ___ says oink.", word: "PIG", hint: "🐖" },
      { text: "A little ___ says cluck.", word: "HEN", hint: "🐔" },
      { text: "The hen lays an ___.", word: "EGG", hint: "🥚" },
      { text: "A ___ eats hay in the barn.", word: "HORSE", hint: "🐴" },
      { text: "The ___ has soft wool.", word: "SHEEP", hint: "🐑" },
      { text: "The cat sleeps in the warm ___.", word: "SUN", hint: "☀️" },
    ],
  },
  {
    id: "beach",
    track: "c3",
    title: "Beach Day",
    emoji: "🏖️",
    lines: [
      { text: "Today we go to the ___.", word: "BEACH", hint: "🏖️" },
      { text: "Big waves come from the ___.", word: "SEA", hint: "🌊" },
      { text: "I build a sand ___.", word: "CASTLE", hint: "🏰" },
      { text: "A ___ walks sideways.", word: "CRAB", hint: "🦀" },
      { text: "I see a little ___ in the water.", word: "FISH", hint: "🐟" },
      { text: "We eat cold ___ cream.", word: "ICE", hint: "🍦" },
      { text: "Dad opens a big ___ for shade.", word: "UMBRELLA", hint: "⛱️" },
      { text: "In the evening, the ___ goes down.", word: "SUN", hint: "🌅" },
    ],
  },
  {
    id: "party",
    track: "c3",
    title: "Birthday Party",
    emoji: "🎂",
    lines: [
      { text: "Mia has a big ___ with pink icing.", word: "CAKE", hint: "🍰" },
      { text: "There are six ___ on the cake.", word: "CANDLES", hint: "🕯️" },
      { text: "Her friends bring a ___.", word: "GIFT", hint: "🎁" },
      { text: "Red ___ float up high.", word: "BALLOONS", hint: "🎈" },
      { text: "Everyone wears a funny ___.", word: "HAT", hint: "🎩" },
      { text: "We all sing a happy ___.", word: "SONG", hint: "🎵" },
      { text: "Mia gets a teddy ___.", word: "BEAR", hint: "🧸" },
      { text: "We dance to loud ___.", word: "MUSIC", hint: "🎶" },
    ],
  },
  {
    id: "rain",
    track: "c3",
    title: "Rainy Day",
    emoji: "🌧️",
    lines: [
      { text: "Dark ___ fill the sky.", word: "CLOUDS", hint: "☁️" },
      { text: "Then the ___ starts to fall.", word: "RAIN", hint: "🌧️" },
      { text: "Leo takes his ___.", word: "UMBRELLA", hint: "☂️" },
      { text: "He puts on his red ___.", word: "BOOTS", hint: "👢" },
      { text: "A slow ___ comes out on the path.", word: "SNAIL", hint: "🐌" },
      { text: "A green ___ jumps in the water.", word: "FROG", hint: "🐸" },
      { text: "After the rain, we see a ___.", word: "RAINBOW", hint: "🌈" },
      { text: "Then the warm ___ comes back.", word: "SUN", hint: "☀️" },
    ],
  },
  {
    id: "kitchen",
    track: "c3",
    title: "In the Kitchen",
    emoji: "🍳",
    lines: [
      { text: "Mum pours a glass of ___.", word: "MILK", hint: "🥛" },
      { text: "I crack an ___.", word: "EGG", hint: "🥚" },
      { text: "We cook it in a ___.", word: "PAN", hint: "🍳" },
      { text: "I cut a red ___.", word: "TOMATO", hint: "🍅" },
      { text: "Dad makes hot ___.", word: "SOUP", hint: "🍲" },
      { text: "We eat with a ___.", word: "SPOON", hint: "🥄" },
      { text: "Grandma drinks a cup of ___.", word: "TEA", hint: "🍵" },
      { text: "For dessert I have a ___.", word: "COOKIE", hint: "🍪" },
    ],
  },
  {
    id: "zoo",
    track: "c3",
    title: "The Zoo",
    emoji: "🦁",
    lines: [
      { text: "The ___ has a very long neck.", word: "GIRAFFE", hint: "🦒" },
      { text: "The ___ roars loudly.", word: "LION", hint: "🦁" },
      { text: "The ___ has a long trunk.", word: "ELEPHANT", hint: "🐘" },
      { text: "A ___ swings in the tree.", word: "MONKEY", hint: "🐒" },
      { text: "The ___ has black and white stripes.", word: "ZEBRA", hint: "🦓" },
      { text: "A ___ swims in the cold water.", word: "PENGUIN", hint: "🐧" },
      { text: "The big brown ___ is sleepy.", word: "BEAR", hint: "🐻" },
      { text: "A green ___ sits by the river.", word: "CROCODILE", hint: "🐊" },
    ],
  },
  {
    id: "space",
    track: "c3",
    title: "Space Trip",
    emoji: "🚀",
    lines: [
      { text: "Nina flies in a ___.", word: "ROCKET", hint: "🚀" },
      { text: "She waves goodbye to the ___.", word: "EARTH", hint: "🌍" },
      { text: "She lands on the ___.", word: "MOON", hint: "🌙" },
      { text: "She sees a bright ___.", word: "STAR", hint: "⭐" },
      { text: "A big ___ has rings around it.", word: "PLANET", hint: "🪐" },
      { text: "She meets a friendly ___.", word: "ALIEN", hint: "👽" },
      { text: "She looks through a ___.", word: "TELESCOPE", hint: "🔭" },
      { text: "Then she flies home to her ___.", word: "BED", hint: "🛏️" },
    ],
  },
  {
    id: "school",
    track: "c3",
    title: "School Day",
    emoji: "🏫",
    lines: [
      { text: "Ali walks to ___.", word: "SCHOOL", hint: "🏫" },
      { text: "He opens his ___.", word: "BAG", hint: "🎒" },
      { text: "He writes with a ___.", word: "PENCIL", hint: "✏️" },
      { text: "He reads a funny ___.", word: "BOOK", hint: "📖" },
      { text: "He makes a picture with ___.", word: "PAINT", hint: "🎨" },
      { text: "At lunch he eats an ___.", word: "APPLE", hint: "🍎" },
      { text: "He plays ___ with his friends.", word: "FOOTBALL", hint: "⚽" },
      { text: "When the ___ rings, he goes home.", word: "BELL", hint: "🔔" },
    ],
  },

  // ------------------------------------------------------------ Story words (Class 4)
  {
    id: "map",
    track: "story",
    title: "The Lost Map",
    emoji: "🗺️",
    lines: [
      { text: "Mia found an old map in her grandfather’s ___.", word: "ATTIC", hint: "the room just under the roof of a house" },
      { text: "The map showed hidden ___ on a small island.", word: "TREASURE", hint: "gold, jewels or other valuable things" },
      { text: "She asked her brother to join the ___.", word: "JOURNEY", hint: "a long trip from one place to another" },
      { text: "They borrowed a boat from a friendly ___.", word: "FISHERMAN", hint: "a person who catches fish for a living" },
      { text: "A strong ___ pushed the boat towards the island.", word: "WIND", hint: "air that moves" },
      { text: "They followed the map through a thick ___.", word: "FOREST", hint: "a large area covered with trees" },
      { text: "Under an old tree they discovered a wooden ___.", word: "CHEST", hint: "a big strong box with a lid" },
      { text: "Inside were letters Grandpa wrote as a ___.", word: "TEENAGER", hint: "a person aged 13 to 19" },
    ],
  },
  {
    id: "science",
    track: "story",
    title: "The Science Fair",
    emoji: "🔬",
    lines: [
      { text: "Omar wanted to win the school science ___.", word: "FAIR", hint: "an event where people show their projects" },
      { text: "He decided to build a small ___.", word: "ROBOT", hint: "a machine that can do jobs by itself" },
      { text: "First, he drew a careful ___.", word: "PLAN", hint: "an idea of how to do something, step by step" },
      { text: "He used a ___ to power the motor.", word: "BATTERY", hint: "it stores electricity" },
      { text: "His first test was a ___ — the robot fell over.", word: "FAILURE", hint: "when something does not work" },
      { text: "He did not give up and tried ___.", word: "AGAIN", hint: "one more time" },
      { text: "The judges were ___ by his idea.", word: "IMPRESSED", hint: "they thought it was very good" },
      { text: "In the end, Omar won second ___.", word: "PLACE", hint: "your position in a competition" },
    ],
  },

  {
    id: "firefighter",
    track: "story",
    title: "The Brave Firefighter",
    emoji: "🚒",
    lines: [
      { text: "Sara always wanted to be a ___.", word: "FIREFIGHTER", hint: "a person who puts out fires" },
      { text: "One night, the ___ rang at the station.", word: "ALARM", hint: "a loud sound that warns of danger" },
      { text: "Smoke was coming from an old ___.", word: "BUILDING", hint: "a house, school or other place with walls and a roof" },
      { text: "She climbed a tall ___ to the window.", word: "LADDER", hint: "steps you carry and lean against a wall" },
      { text: "Inside, a scared ___ was hiding under a bed.", word: "KITTEN", hint: "a baby cat" },
      { text: "Sara carried it out ___.", word: "SAFELY", hint: "without getting hurt" },
      { text: "The crowd outside ___ loudly.", word: "CHEERED", hint: "shouted happily" },
      { text: "That night Sara felt very ___.", word: "PROUD", hint: "happy about something good you did" },
    ],
  },
  {
    id: "mysterybox",
    track: "story",
    title: "The Mystery Box",
    emoji: "📦",
    lines: [
      { text: "A strange box arrived at Leo’s front ___.", word: "DOOR", hint: "what you open to go into a house" },
      { text: "There was no ___ on it.", word: "NAME", hint: "the word people call you by" },
      { text: "Leo was very ___ about what was inside.", word: "CURIOUS", hint: "wanting to know something" },
      { text: "He shook it and heard a ___.", word: "NOISE", hint: "a sound, often a loud one" },
      { text: "He opened it very ___.", word: "CAREFULLY", hint: "slowly, so nothing goes wrong" },
      { text: "Inside was an old ___.", word: "COMPASS", hint: "a tool that shows which way is north" },
      { text: "A note said: “Follow it to the ___.”", word: "RIVER", hint: "water that flows to the sea" },
      { text: "There, Grandma was waiting with a birthday ___.", word: "SURPRISE", hint: "something you did not expect" },
    ],
  },
  {
    id: "camping",
    track: "story",
    title: "Camping Trip",
    emoji: "⛺",
    lines: [
      { text: "Our class went on a camping ___.", word: "TRIP", hint: "a short journey" },
      { text: "We put up our ___ near the lake.", word: "TENT", hint: "a small house made of cloth" },
      { text: "At night we sat around a ___.", word: "CAMPFIRE", hint: "a fire you make outside" },
      { text: "We told scary ___ in the dark.", word: "STORIES", hint: "tales about things that happened" },
      { text: "An ___ hooted in the trees.", word: "OWL", hint: "a bird that is awake at night" },
      { text: "I used my ___ to find the path.", word: "TORCH", hint: "a small lamp you carry" },
      { text: "In the morning we went ___ in the lake.", word: "SWIMMING", hint: "moving through water" },
      { text: "It was the best ___ ever.", word: "ADVENTURE", hint: "an exciting experience" },
    ],
  },
  {
    id: "football",
    track: "story",
    title: "The Football Match",
    emoji: "⚽",
    lines: [
      { text: "Our team had a big ___ on Saturday.", word: "MATCH", hint: "a game between two teams" },
      { text: "Our ___ told us to work together.", word: "COACH", hint: "the person who trains a team" },
      { text: "The other team was very ___.", word: "STRONG", hint: "having a lot of power" },
      { text: "At half-time we were ___ 1–0.", word: "LOSING", hint: "not winning" },
      { text: "Then Timur ran fast and scored a ___.", word: "GOAL", hint: "a point in football" },
      { text: "The ___ blew the whistle.", word: "REFEREE", hint: "the person who makes players follow the rules" },
      { text: "The game ended in a ___.", word: "DRAW", hint: "when both teams have the same score" },
      { text: "We learned that ___ matters most.", word: "TEAMWORK", hint: "working well together" },
    ],
  },
  {
    id: "robot",
    track: "story",
    title: "The Robot Friend",
    emoji: "🤖",
    lines: [
      { text: "Kamila built a small robot from old ___.", word: "PARTS", hint: "pieces of a machine" },
      { text: "She added a tiny ___ so it could think.", word: "COMPUTER", hint: "a machine that stores and uses information" },
      { text: "The robot could ___ her voice.", word: "UNDERSTAND", hint: "to know what something means" },
      { text: "It helped her ___ her room.", word: "CLEAN", hint: "to make something not dirty" },
      { text: "One day, it ran out of ___.", word: "ENERGY", hint: "the power that makes things work" },
      { text: "Kamila ___ it with a cable.", word: "CHARGED", hint: "filled a battery with electricity" },
      { text: "The robot said, “Thank you, my ___!”", word: "FRIEND", hint: "someone you like and trust" },
      { text: "Together they won the school ___.", word: "PRIZE", hint: "something you get for winning" },
    ],
  },
  {
    id: "lighthouse",
    track: "story",
    title: "The Old Lighthouse",
    emoji: "🗼",
    lines: [
      { text: "On the coast stood an old ___.", word: "LIGHTHOUSE", hint: "a tall tower with a light that helps ships" },
      { text: "Its light guided ___ at night.", word: "SHIPS", hint: "big boats" },
      { text: "One stormy night, the light went ___.", word: "OUT", hint: "stopped shining" },
      { text: "A girl named Lola climbed the ___.", word: "STAIRS", hint: "steps inside a building" },
      { text: "At the top she found the broken ___.", word: "LAMP", hint: "something that gives light" },
      { text: "She fixed it with a new ___.", word: "BULB", hint: "the glass part of a lamp that lights up" },
      { text: "The ships sailed ___ into the harbour.", word: "HOME", hint: "the place where you live" },
      { text: "The whole town called her a ___.", word: "HERO", hint: "a person who does something brave" },
    ],
  },
  {
    id: "timemachine",
    track: "story",
    title: "The Time Machine",
    emoji: "⏰",
    lines: [
      { text: "Amir found a strange ___ in the museum.", word: "MACHINE", hint: "equipment with moving parts" },
      { text: "He pressed a big red ___.", word: "BUTTON", hint: "a small part you press" },
      { text: "Suddenly he was in the ___.", word: "PAST", hint: "the time before now" },
      { text: "He saw real ___ walking by.", word: "DINOSAURS", hint: "huge animals that lived long ago" },
      { text: "One was eating ___ from a tall tree.", word: "LEAVES", hint: "the green parts of a plant" },
      { text: "Amir felt a little ___.", word: "NERVOUS", hint: "worried and a bit scared" },
      { text: "He pressed the button ___.", word: "AGAIN", hint: "one more time" },
      { text: "He was back in the ___, just in time for lunch.", word: "PRESENT", hint: "the time now" },
    ],
  },
  {
    id: "market",
    track: "story",
    title: "Market Day",
    emoji: "🧺",
    lines: [
      { text: "Every Sunday, we go to the ___.", word: "MARKET", hint: "a place where people buy and sell things" },
      { text: "Mum writes a shopping ___.", word: "LIST", hint: "things written one under another" },
      { text: "We buy fresh ___ like carrots and onions.", word: "VEGETABLES", hint: "plants we eat, like carrots" },
      { text: "A kind man sells warm ___.", word: "BREAD", hint: "food made from flour and baked" },
      { text: "I ask about the ___ of the melons.", word: "PRICE", hint: "how much something costs" },
      { text: "Mum pays with ___.", word: "MONEY", hint: "coins and notes" },
      { text: "The seller gives us our ___.", word: "CHANGE", hint: "money you get back after paying" },
      { text: "We carry everything home in a ___.", word: "BASKET", hint: "a container made of woven sticks" },
    ],
  },
]

/** An exam: `count` random sentences from all the stories of a track (each word only once). */
export function examStory(track: WordTrack, count: number): WordStory {
  const seen = new Set<string>()
  const lines = wordStories
    .filter((s) => s.track === track)
    .flatMap((s) => s.lines)
    .sort(() => Math.random() - 0.5)
    .filter((l) => !seen.has(l.word) && seen.add(l.word))
    .slice(0, count)
  return { id: `exam-${track}`, track, title: "Exam", emoji: "📝", lines }
}
