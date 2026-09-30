// Town Helpers: everyday jobs that are really logic puzzles (ages 7–9).

export type Thing = { emoji: string; label: string; tags?: string[] }

/** A small picture that shows one clue (so kids can “see” it). */
export type CluePic =
  | { kind: "taller" | "costs"; a: Thing & { v: number }; b: Thing & { v: number } } // a is bigger than b
  | { kind: "before"; a: Thing; b: Thing } // a comes before b
  | { kind: "not"; a: Thing } // it is NOT a

export type Puzzle =
  /** Tap the steps in the right order (items are listed in the correct order). */
  | { kind: "order"; ask: string; clues?: string[]; pics?: (CluePic | null)[]; items: Thing[]; hint: string }
  /** Pick one option. `why` explains what's wrong with each wrong option. */
  | {
      kind: "choice"
      ask: string
      clues?: string[]
      pics?: (CluePic | null)[] // one picture per clue (optional)
      sequence?: string[] // shown as a pattern row, "?" = missing
      options: (Thing & { why?: string })[]
      answer: number
      explain: string
    }
  /** Put each item in the right box, one at a time. */
  | { kind: "sort"; ask: string; bins: Thing[]; items: (Thing & { bin: number; why: string })[] }

export type Helper = {
  id: number
  name: string
  face: string
  job: string
  skill: string
  scene: string // background emoji
  tile: string // gradient
  hello: string
  thanks: string[]
  puzzles: Puzzle[]
}

export const helpers: Helper[] = [
  {
    id: 1,
    name: "Grandma Rose",
    face: "👵",
    job: "Kitchen helper",
    skill: "Putting steps in order",
    scene: "🏡",
    tile: "from-[#FFC48A] to-[#F2784B]",
    hello: "Hello dear! Can you help me in the kitchen today?",
    thanks: ["Thank you, sweetie! 🥰", "What a clever helper!", "Perfect, just like I do it!"],
    puzzles: [
      {
        kind: "order",
        ask: "Help me make a cheese sandwich. What comes first?",
        items: [
          { emoji: "🍞", label: "Take a slice of bread" },
          { emoji: "🧈", label: "Spread the butter" },
          { emoji: "🧀", label: "Add the cheese" },
          { emoji: "🥪", label: "Put bread on top" },
        ],
        hint: "You need bread before you can spread anything on it!",
      },
      {
        kind: "order",
        ask: "Let’s make a cup of tea. Put the steps in order.",
        items: [
          { emoji: "🫖", label: "Boil the water" },
          { emoji: "🍵", label: "Put a tea bag in the cup" },
          { emoji: "💧", label: "Pour in the hot water" },
          { emoji: "🥄", label: "Stir it" },
        ],
        hint: "The water must be hot before you pour it.",
      },
      {
        kind: "choice",
        ask: "I need something to cut the bread. What should you bring me?",
        options: [
          { emoji: "🥄", label: "Spoon", why: "A spoon is for stirring and eating soup." },
          { emoji: "🔪", label: "Knife" },
          { emoji: "🧽", label: "Sponge", why: "A sponge is for washing, not cutting." },
          { emoji: "🍴", label: "Fork", why: "A fork holds food, but it can’t cut bread well." },
        ],
        answer: 1,
        explain: "Yes! A knife cuts bread.",
      },
      {
        kind: "sort",
        ask: "Help me put the shopping away. Fridge or cupboard?",
        bins: [
          { emoji: "🧊", label: "Fridge" },
          { emoji: "🗄️", label: "Cupboard" },
        ],
        items: [
          { emoji: "🥛", label: "Milk", bin: 0, why: "Milk goes bad if it isn’t kept cold." },
          { emoji: "🥫", label: "Tin of soup", bin: 1, why: "A closed tin keeps fine on the shelf." },
          { emoji: "🧀", label: "Cheese", bin: 0, why: "Cheese needs to stay cold." },
          { emoji: "🍝", label: "Dry pasta", bin: 1, why: "Dry pasta doesn’t need to be cold." },
          { emoji: "🍦", label: "Ice cream", bin: 0, why: "Ice cream would melt in the cupboard!" },
          { emoji: "🍪", label: "Cookies", bin: 1, why: "Cookies stay crunchy in the cupboard." },
        ],
      },
      {
        kind: "order",
        ask: "Now let’s wash the dishes. What order?",
        items: [
          { emoji: "🍽️", label: "Scrape off the food" },
          { emoji: "🫧", label: "Wash with soap" },
          { emoji: "🚿", label: "Rinse with water" },
          { emoji: "🧺", label: "Dry with a towel" },
        ],
        hint: "You rinse the soap off after washing, and dry at the very end.",
      },
    ],
  },
  {
    id: 2,
    name: "Postman Paul",
    face: "🧑‍✈️",
    job: "Letter delivery",
    skill: "Following clues",
    scene: "📮",
    tile: "from-[#7FB2FF] to-[#3E6FD8]",
    hello: "I have letters to deliver, but I need a detective! Read the clues with me.",
    thanks: ["Delivered! Thanks, detective! 📬", "Right house! You’re great with clues!", "Another happy neighbour!"],
    puzzles: [
      {
        kind: "choice",
        ask: "Which house gets this letter?",
        clues: ["The house has a RED door."],
        options: [
          { emoji: "🏠", label: "House 1", tags: ["🔵 blue door"], why: "This door is blue, not red." },
          { emoji: "🏠", label: "House 2", tags: ["🔴 red door"] },
          { emoji: "🏠", label: "House 3", tags: ["🟢 green door"], why: "This door is green, not red." },
        ],
        answer: 1,
        explain: "The red door — well spotted!",
      },
      {
        kind: "choice",
        ask: "Which house gets this parcel?",
        clues: ["The door is red.", "They have a dog."],
        options: [
          { emoji: "🏠", label: "House A", tags: ["🔴 red door", "🐱 cat"], why: "Red door, but they have a cat, not a dog." },
          { emoji: "🏠", label: "House B", tags: ["🔴 red door", "🐶 dog"] },
          { emoji: "🏠", label: "House C", tags: ["🔵 blue door", "🐶 dog"], why: "They have a dog, but the door is blue." },
        ],
        answer: 1,
        explain: "Red door AND a dog — both clues match!",
      },
      {
        kind: "choice",
        ask: "Where does this postcard go?",
        clues: ["The house is NOT next to the tree 🌳.", "It has flowers 🌷."],
        pics: [{ kind: "not", a: { emoji: "🌳", label: "Next to the tree" } }, null],
        options: [
          { emoji: "🏡", label: "House A", tags: ["🌳 next to tree", "🌷 flowers"], why: "It has flowers, but it IS next to the tree." },
          { emoji: "🏡", label: "House B", tags: ["🌷 flowers"] },
          { emoji: "🏡", label: "House C", tags: ["🚲 bike"], why: "Not next to the tree, but there are no flowers." },
        ],
        answer: 1,
        explain: "Flowers, and no tree nearby. Great thinking!",
      },
      {
        kind: "choice",
        ask: "Which house number is it?",
        clues: ["The number is EVEN.", "The number is bigger than 5."],
        options: [
          { emoji: "4️⃣", label: "Number 4", why: "4 is even, but it’s not bigger than 5." },
          { emoji: "7️⃣", label: "Number 7", why: "7 is bigger than 5, but it’s odd." },
          { emoji: "6️⃣", label: "Number 6" },
          { emoji: "3️⃣", label: "Number 3", why: "3 is odd AND smaller than 5." },
        ],
        answer: 2,
        explain: "6 is even and bigger than 5!",
      },
      {
        kind: "choice",
        ask: "The last letter of the day! Which house?",
        clues: ["It has 2 windows.", "The house is NOT blue.", "They have a cat."],
        options: [
          { emoji: "🏠", label: "House A", tags: ["🔵 blue", "🪟🪟 2 windows", "🐱 cat"], why: "2 windows and a cat, but the house is blue." },
          { emoji: "🏠", label: "House B", tags: ["🟡 yellow", "🪟🪟🪟 3 windows", "🐱 cat"], why: "This one has 3 windows." },
          { emoji: "🏠", label: "House C", tags: ["🟡 yellow", "🪟🪟 2 windows", "🐱 cat"] },
          { emoji: "🏠", label: "House D", tags: ["🟢 green", "🪟🪟 2 windows", "🐶 dog"], why: "They have a dog, not a cat." },
        ],
        answer: 2,
        explain: "All three clues match House C!",
      },
    ],
  },
  {
    id: 3,
    name: "Vet Vicky",
    face: "👩‍⚕️",
    job: "Animal clinic",
    skill: "Groups & odd one out",
    scene: "🐾",
    tile: "from-[#8EE0A1] to-[#2E9E6B]",
    hello: "Welcome to my animal clinic! Let’s sort out these animals together.",
    thanks: ["The animals thank you! 🐾", "You know your animals!", "Woof! Meow! (That means thank you.)"],
    puzzles: [
      {
        kind: "choice",
        ask: "One of these doesn’t belong in my clinic. Which one?",
        options: [
          { emoji: "🐶", label: "Dog", why: "A dog is an animal, so it belongs." },
          { emoji: "🐱", label: "Cat", why: "A cat is an animal, so it belongs." },
          { emoji: "🚗", label: "Car" },
          { emoji: "🐰", label: "Rabbit", why: "A rabbit is an animal, so it belongs." },
        ],
        answer: 2,
        explain: "A car isn’t an animal — it goes to the garage!",
      },
      {
        kind: "choice",
        ask: "Which one is the odd one out?",
        options: [
          { emoji: "🐟", label: "Fish", why: "Fish live in water." },
          { emoji: "🐬", label: "Dolphin", why: "Dolphins live in water." },
          { emoji: "🐄", label: "Cow" },
          { emoji: "🐙", label: "Octopus", why: "Octopuses live in water." },
        ],
        answer: 2,
        explain: "The cow is the only one that doesn’t live in water!",
      },
      {
        kind: "sort",
        ask: "Which animals can fly?",
        bins: [
          { emoji: "🪽", label: "Can fly" },
          { emoji: "🚫", label: "Can’t fly" },
        ],
        items: [
          { emoji: "🐦", label: "Bird", bin: 0, why: "Birds flap their wings to fly." },
          { emoji: "🐧", label: "Penguin", bin: 1, why: "Penguins are birds, but they swim instead of fly!" },
          { emoji: "🦋", label: "Butterfly", bin: 0, why: "Butterflies fly from flower to flower." },
          { emoji: "🐘", label: "Elephant", bin: 1, why: "Elephants are far too heavy to fly." },
          { emoji: "🦉", label: "Owl", bin: 0, why: "Owls fly at night." },
          { emoji: "🐢", label: "Turtle", bin: 1, why: "Turtles walk and swim, but can’t fly." },
        ],
      },
      {
        kind: "choice",
        ask: "Which one is my patient, Max?",
        clues: ["Max has 4 legs.", "Max says “meow”."],
        options: [
          { emoji: "🐶", label: "Dog", why: "4 legs, but a dog says “woof”." },
          { emoji: "🐦", label: "Bird", why: "A bird has only 2 legs." },
          { emoji: "🐱", label: "Cat" },
          { emoji: "🐍", label: "Snake", why: "A snake has no legs at all!" },
        ],
        answer: 2,
        explain: "4 legs and says meow — Max is a cat!",
      },
      {
        kind: "choice",
        ask: "Which animal is the odd one out?",
        options: [
          { emoji: "🐔", label: "Hen", why: "A hen has feathers." },
          { emoji: "🦆", label: "Duck", why: "A duck has feathers." },
          { emoji: "🐈", label: "Cat" },
          { emoji: "🦢", label: "Swan", why: "A swan has feathers." },
        ],
        answer: 2,
        explain: "The cat has fur — all the others have feathers!",
      },
    ],
  },
  {
    id: 4,
    name: "Driver Dan",
    face: "🧔",
    job: "Bus driver",
    skill: "Finding patterns",
    scene: "🚌",
    tile: "from-[#FFD66B] to-[#F2A30F]",
    hello: "All aboard! My bus follows patterns. Can you work out what comes next?",
    thanks: ["Beep beep! Great job! 🚌", "Right on time, thanks to you!", "You’re a pattern pro!"],
    puzzles: [
      {
        kind: "choice",
        ask: "The traffic lights blink in a pattern. What comes next?",
        sequence: ["🔴", "🟡", "🔴", "🟡", "🔴", "?"],
        options: [
          { emoji: "🔴", label: "Red", why: "Red just blinked — look at what comes after red." },
          { emoji: "🟡", label: "Yellow" },
          { emoji: "🟢", label: "Green", why: "Green isn’t in this pattern at all." },
        ],
        answer: 1,
        explain: "Red, yellow, red, yellow… yellow is next!",
      },
      {
        kind: "choice",
        ask: "The cars and buses line up in a pattern. What’s next?",
        sequence: ["🚌", "🚗", "🚗", "🚌", "🚗", "🚗", "🚌", "?"],
        options: [
          { emoji: "🚌", label: "Bus", why: "After each bus come TWO cars." },
          { emoji: "🚗", label: "Car" },
          { emoji: "🚲", label: "Bike", why: "There are no bikes in this pattern." },
        ],
        answer: 1,
        explain: "Bus, car, car — so a car comes after the bus!",
      },
      {
        kind: "choice",
        ask: "My bus stops are numbered in a pattern. What’s the next stop?",
        sequence: ["2", "4", "6", "8", "?"],
        options: [
          { emoji: "9️⃣", label: "9", why: "The numbers go up by 2 each time, not 1." },
          { emoji: "🔟", label: "10" },
          { emoji: "1️⃣2️⃣", label: "12", why: "That skips a number – they go up by 2." },
        ],
        answer: 1,
        explain: "+2 each time: 8 + 2 = 10!",
      },
      {
        kind: "choice",
        ask: "The stars on my sign grow each day. How many tomorrow?",
        sequence: ["⭐", "⭐⭐", "⭐⭐⭐", "?"],
        options: [
          { emoji: "⭐⭐⭐", label: "3 stars", why: "That’s the same as today — it grows each day." },
          { emoji: "⭐⭐⭐⭐", label: "4 stars" },
          { emoji: "⭐⭐⭐⭐⭐⭐", label: "6 stars", why: "It grows by only 1 star each day." },
        ],
        answer: 1,
        explain: "One more star each day — 4 stars!",
      },
      {
        kind: "choice",
        ask: "Passengers get off at each stop. How many are left next?",
        sequence: ["20", "17", "14", "11", "?"],
        options: [
          { emoji: "8️⃣", label: "8" },
          { emoji: "🔟", label: "10", why: "The number goes DOWN by 3 each time." },
          { emoji: "9️⃣", label: "9", why: "Check: 20 → 17 is 3 fewer. 11 − 3 = ?" },
        ],
        answer: 0,
        explain: "−3 each time: 11 − 3 = 8!",
      },
    ],
  },
  {
    id: 5,
    name: "Shopkeeper Sara",
    face: "👩‍💼",
    job: "Corner shop",
    skill: "Rules & comparing",
    scene: "🛒",
    tile: "from-[#C7A6FF] to-[#7B4FD8]",
    hello: "Welcome to my shop! Help me think it through — use the rules and compare.",
    thanks: ["Thank you, shop star! 🛒", "Smart thinking!", "My customers are happy!"],
    puzzles: [
      {
        kind: "choice",
        ask: "What should I sell today?",
        clues: ["If it is sunny, sell ice cream 🍦.", "If it is rainy, sell umbrellas ☂️.", "Today it is raining 🌧️."],
        options: [
          { emoji: "🍦", label: "Ice cream", why: "Ice cream is for sunny days — today it’s raining." },
          { emoji: "☂️", label: "Umbrellas" },
          { emoji: "🕶️", label: "Sunglasses", why: "Sunglasses aren’t in the rules, and it’s rainy." },
        ],
        answer: 1,
        explain: "It’s rainy, so the rule says umbrellas!",
      },
      {
        kind: "choice",
        ask: "Which fruit costs the MOST?",
        clues: ["Apples cost more than bananas.", "Bananas cost more than grapes."],
        pics: [
          { kind: "costs", a: { emoji: "🍎", label: "Apples", v: 3 }, b: { emoji: "🍌", label: "Bananas", v: 2 } },
          { kind: "costs", a: { emoji: "🍌", label: "Bananas", v: 2 }, b: { emoji: "🍇", label: "Grapes", v: 1 } },
        ],
        options: [
          { emoji: "🍎", label: "Apples" },
          { emoji: "🍌", label: "Bananas", why: "Apples cost more than bananas." },
          { emoji: "🍇", label: "Grapes", why: "Grapes cost less than bananas." },
        ],
        answer: 0,
        explain: "Apples > bananas > grapes, so apples cost the most!",
      },
      {
        kind: "choice",
        ask: "Mum needs bread, milk and eggs. She wants to go to only ONE shop. Which place should she go to?",
        clues: ["She needs bread 🍞, milk 🥛 and eggs 🥚.", "The shop must have ALL three."],
        options: [
          { emoji: "🥐", label: "Bakery", tags: ["🍞 bread"], why: "The bakery has bread, but no milk or eggs." },
          { emoji: "🛒", label: "Supermarket", tags: ["🍞 bread", "🥛 milk", "🥚 eggs"] },
          { emoji: "🐄", label: "Farm shop", tags: ["🥛 milk", "🥚 eggs"], why: "The farm shop has milk and eggs, but no bread." },
          { emoji: "💊", label: "Pharmacy", tags: ["💊 medicine"], why: "A pharmacy sells medicine, not food." },
        ],
        answer: 1,
        explain: "Only the supermarket has bread, milk AND eggs!",
      },
      {
        kind: "choice",
        ask: "I hid the prize ball in a box. Which box is it in?",
        clues: ["It is NOT in the red box.", "It is NOT in the blue box."],
        pics: [
          { kind: "not", a: { emoji: "🟥", label: "Red box" } },
          { kind: "not", a: { emoji: "🟦", label: "Blue box" } },
        ],
        options: [
          { emoji: "🟥", label: "Red box", why: "The clue says it’s NOT in the red box." },
          { emoji: "🟦", label: "Blue box", why: "The clue says it’s NOT in the blue box." },
          { emoji: "🟩", label: "Green box" },
        ],
        answer: 2,
        explain: "Not red, not blue… so it must be green!",
      },
      {
        kind: "order",
        ask: "Who came to the shop first? Put them in order.",
        clues: ["Mia came before Leo.", "Leo came before Zoe."],
        pics: [
          { kind: "before", a: { emoji: "👧", label: "Mia" }, b: { emoji: "👦", label: "Leo" } },
          { kind: "before", a: { emoji: "👦", label: "Leo" }, b: { emoji: "👩‍🦰", label: "Zoe" } },
        ],
        items: [
          { emoji: "👧", label: "Mia" },
          { emoji: "👦", label: "Leo" },
          { emoji: "👩‍🦰", label: "Zoe" },
        ],
        hint: "Who came before everyone else?",
      },
    ],
  },
  {
    id: 6,
    name: "Firefighter Fred",
    face: "🧑‍🚒",
    job: "Fire station",
    skill: "Safety thinking",
    scene: "🚒",
    tile: "from-[#FF8A7A] to-[#D83A3A]",
    hello: "Hi, helper! Firefighters think carefully to keep everyone safe. Ready?",
    thanks: ["You’re a safety hero! 🚒", "That’s exactly right!", "Safe and smart — thank you!"],
    puzzles: [
      {
        kind: "choice",
        ask: "The fire alarm rings at school. What do you do?",
        options: [
          { emoji: "🎒", label: "Pack your bag first", why: "Leave your things — getting out safely comes first." },
          { emoji: "🚶", label: "Walk calmly outside with your class" },
          { emoji: "🙈", label: "Hide under the desk", why: "Hiding makes it hard for firefighters to find you." },
          { emoji: "🧸", label: "Go back for a toy", why: "Never go back inside for things." },
        ],
        answer: 1,
        explain: "Walk out calmly with your class — that’s the safe way!",
      },
      {
        kind: "order",
        ask: "If your clothes catch fire: stop, drop and roll! Put it in order.",
        items: [
          { emoji: "🛑", label: "Stop where you are" },
          { emoji: "⬇️", label: "Drop to the ground" },
          { emoji: "🔄", label: "Roll over and over" },
        ],
        hint: "It’s in the name: stop, drop and roll.",
      },
      {
        kind: "choice",
        ask: "Which one is NOT safe to play with?",
        options: [
          { emoji: "🧸", label: "Teddy", why: "A teddy is safe to play with." },
          { emoji: "⚽", label: "Ball", why: "A ball is safe to play with." },
          { emoji: "🔥", label: "Matches" },
          { emoji: "🧩", label: "Puzzle", why: "A puzzle is safe to play with." },
        ],
        answer: 2,
        explain: "Matches can start fires — only grown-ups use them.",
      },
      {
        kind: "choice",
        ask: "Which fire truck is mine?",
        clues: ["It is red.", "It has a ladder.", "It has the number 7."],
        options: [
          { emoji: "🚒", label: "Truck A", tags: ["🔴 red", "🪜 ladder", "3️⃣"], why: "Red with a ladder, but it’s number 3." },
          { emoji: "🚒", label: "Truck B", tags: ["🔴 red", "🪜 ladder", "7️⃣"] },
          { emoji: "🚒", label: "Truck C", tags: ["🟡 yellow", "🪜 ladder", "7️⃣"], why: "Number 7 with a ladder, but it’s yellow." },
          { emoji: "🚒", label: "Truck D", tags: ["🔴 red", "7️⃣"], why: "Red and number 7, but it has no ladder." },
        ],
        answer: 1,
        explain: "Red, ladder, number 7 — that’s my truck!",
      },
      {
        kind: "sort",
        ask: "Should we call for help? Sort each one.",
        bins: [
          { emoji: "🚨", label: "Call for help" },
          { emoji: "🙂", label: "No need" },
        ],
        items: [
          { emoji: "🔥", label: "A house is on fire", bin: 0, why: "A fire is an emergency — call for help!" },
          { emoji: "🩹", label: "A small scratch", bin: 1, why: "A plaster is enough for a small scratch." },
          { emoji: "💥", label: "A car crash", bin: 0, why: "People could be hurt — call for help." },
          { emoji: "🍦", label: "Dropped ice cream", bin: 1, why: "Sad, but not an emergency!" },
          { emoji: "🌊", label: "Someone can’t swim", bin: 0, why: "Someone could be in danger — call for help." },
          { emoji: "🎈", label: "A lost balloon", bin: 1, why: "Not an emergency — just get a new one." },
        ],
      },
    ],
  },
]

/** 0–1 mistakes = 3★, up to 4 = 2★, finishing = 1★. */
export function helperStars(mistakes: number) {
  if (mistakes <= 1) return 3
  if (mistakes <= 4) return 2
  return 1
}
