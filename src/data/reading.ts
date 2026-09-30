// Content for the "Learn to Read" game, Class 0–3 (Words → Sentences → Stories).

/** Listen & Find: the first word is the answer, the rest look/sound alike. */
export const wordSets: { words: [string, string, string, string]; emoji: string }[] = [
  { words: ["ship", "shop", "chip", "sheep"], emoji: "🚢" },
  { words: ["cat", "cap", "cut", "cot"], emoji: "🐱" },
  { words: ["frog", "flag", "from", "fog"], emoji: "🐸" },
  { words: ["train", "rain", "brain", "tray"], emoji: "🚆" },
  { words: ["house", "horse", "mouse", "hose"], emoji: "🏠" },
  { words: ["light", "night", "right", "kite"], emoji: "💡" },
  { words: ["cloud", "clown", "cold", "crowd"], emoji: "☁️" },
  { words: ["bread", "bead", "break", "bird"], emoji: "🍞" },
  { words: ["snake", "snack", "shake", "stake"], emoji: "🐍" },
  { words: ["plant", "plane", "plan", "pant"], emoji: "🌱" },
  { words: ["whale", "while", "wheel", "wall"], emoji: "🐋" },
  { words: ["queen", "green", "quiet", "screen"], emoji: "👸" },
]

/** Read & Match: the first picture is the answer. */
export const sentences: { text: string; pictures: [string, string, string, string] }[] = [
  { text: "The dog is playing with a ball.", pictures: ["🐶⚽", "🐱🧶", "🐶🦴", "🐭🧀"] },
  { text: "A red apple is on the table.", pictures: ["🍎", "🍌", "🍇", "🍐"] },
  { text: "The bird is flying over the tree.", pictures: ["🐦🌳", "🐟🌊", "🐦🏠", "🐝🌻"] },
  { text: "It is raining, so I have an umbrella.", pictures: ["🌧️☂️", "☀️😎", "❄️⛄", "🌈🌤️"] },
  { text: "The fish swims in the blue sea.", pictures: ["🐟🌊", "🐦☁️", "🐢🏖️", "🐸🪷"] },
  { text: "Mom is baking a big cake.", pictures: ["👩‍🍳🎂", "👨‍🍳🍕", "👩‍🌾🌽", "🧑‍🎨🎨"] },
  { text: "Two cars are waiting at the red light.", pictures: ["🚗🚗🚦", "🚌🚏", "🚲🚲", "✈️🛫"] },
  { text: "The moon and the stars shine at night.", pictures: ["🌙⭐", "☀️🌤️", "🌈☔", "🌅🌊"] },
  { text: "A little frog sits on a green leaf.", pictures: ["🐸🍃", "🐢🪨", "🐛🍎", "🦆💧"] },
  { text: "The boy reads a book in bed.", pictures: ["👦📖🛏️", "👧🎨", "👦⚽", "🧒🎮"] },
  { text: "I brush my teeth every morning.", pictures: ["🪥😁", "🛁🧼", "🍳🥓", "👟🏃"] },
  { text: "The snowman has a carrot nose.", pictures: ["⛄🥕", "🎃🕯️", "🌻🐝", "🎄🎁"] },
]

/** Story Time: the first option of each question is the answer. */
export const stories: {
  title: string
  emoji: string
  text: string
  questions: { q: string; options: [string, string, string, string] }[]
}[] = [
  {
    title: "Mia and the Lost Kitten",
    emoji: "🐈",
    text:
      "Mia heard a small sound in the garden. It was a little grey kitten under a bush. The kitten was cold and hungry. " +
      "Mia gave it some warm milk and a soft blanket. The next day, a girl from next door knocked on the door. " +
      "“That is my kitten, Smoky!” she said. Mia was sad, but also happy. Now she visits Smoky every day.",
    questions: [
      { q: "Where did Mia find the kitten?", options: ["Under a bush", "In a tree", "On the roof", "In a box"] },
      { q: "What did Mia give the kitten?", options: ["Warm milk", "A fish", "A toy mouse", "Some bread"] },
      { q: "What is the kitten’s name?", options: ["Smoky", "Snowy", "Tiger", "Mia"] },
    ],
  },
  {
    title: "The Big Race",
    emoji: "🐢",
    text:
      "Tom the turtle wanted to run in the big race. All the other animals laughed. “You are too slow!” said the rabbit. " +
      "But Tom trained every morning. On the day of the race, the rabbit ran very fast and then took a nap under a tree. " +
      "Tom walked and walked and never stopped. When the rabbit woke up, Tom was already at the finish line!",
    questions: [
      { q: "Who laughed at Tom?", options: ["The other animals", "His mother", "The teacher", "Nobody"] },
      { q: "What did the rabbit do during the race?", options: ["Took a nap", "Ate a carrot", "Helped Tom", "Went home"] },
      { q: "Who won the race?", options: ["Tom the turtle", "The rabbit", "The fox", "It was a draw"] },
    ],
  },
  {
    title: "A Rainy Day",
    emoji: "🌧️",
    text:
      "It was raining all day, so Sam and his sister Lily could not play outside. They were bored. " +
      "Then Lily had an idea. They built a big fort with chairs and blankets in the living room. " +
      "Inside the fort, they read books with a torch and ate popcorn. “Rainy days are the best!” said Sam.",
    questions: [
      { q: "Why could they not play outside?", options: ["It was raining", "It was dark", "They were sick", "It was snowing"] },
      { q: "What did they build?", options: ["A fort", "A snowman", "A boat", "A car"] },
      { q: "What did they eat in the fort?", options: ["Popcorn", "Pizza", "Apples", "Ice cream"] },
    ],
  },
]
