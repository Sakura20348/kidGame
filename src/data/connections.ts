// "Associate Words: Connections" – find the words that belong together.
// One level per class: Class 0 two groups of 3 pictures … Class 3 three groups of 4 pictures · Class 4 three groups of 4 words.

import { gradeOf } from "@/lib/accounts"

export type ConnLevel = "c0" | "c1" | "c2" | "c3" | "c4"
export type ConnGroup = { name: string; words: string[]; emojis?: string[] }
export type ConnPuzzle = { groups: ConnGroup[] }

export const connLevels: { id: ConnLevel; name: string; classes: string; blurb: string; emoji: string; tile: string; hearts: number }[] = [
  { id: "c0", name: "Tiny groups", classes: "Class 0", blurb: "2 groups of 3 pictures", emoji: "🐣", tile: "from-[#FFB347] to-[#FF7A59]", hearts: 5 },
  { id: "c1", name: "Picture groups", classes: "Class 1", blurb: "3 groups of 3 pictures", emoji: "🧸", tile: "from-[#FF8A5B] to-[#FF5E7E]", hearts: 5 },
  { id: "c2", name: "More pictures", classes: "Class 2", blurb: "3 groups of 3 – trickier groups", emoji: "🖼️", tile: "from-[#2BC0A4] to-[#1F7A6B]", hearts: 4 },
  { id: "c3", name: "Picture fours", classes: "Class 3", blurb: "3 groups of 4 pictures", emoji: "🧩", tile: "from-[#B06AB3] to-[#5B3FA8]", hearts: 4 },
  { id: "c4", name: "Word groups", classes: "Class 4", blurb: "3 groups of 4 words", emoji: "📚", tile: "from-[#4FACFE] to-[#6C63FF]", hearts: 4 },
]

/** The level for a student's class (Class 0 → c0 … Class 4 → c4). */
export const connLevelForClass = (band?: string): ConnLevel => `c${Math.min(4, Math.max(0, gradeOf(band) ?? 0))}` as ConnLevel

const g = (name: string, words: string[], emojis?: string[]): ConnGroup => ({ name, words, emojis })

export const connPuzzles: Record<ConnLevel, ConnPuzzle[]> = {
  c0: [
    { groups: [g("Animals", ["Dog", "Cat", "Fish"], ["🐶", "🐱", "🐟"]), g("Food", ["Apple", "Cake", "Egg"], ["🍎", "🍰", "🥚"])] },
    { groups: [g("Things that go", ["Car", "Bus", "Train"], ["🚗", "🚌", "🚂"]), g("Toys", ["Ball", "Teddy", "Doll"], ["⚽", "🧸", "🪆"])] },
    { groups: [g("In the sky", ["Sun", "Moon", "Star"], ["☀️", "🌙", "⭐"]), g("On the farm", ["Cow", "Pig", "Hen"], ["🐄", "🐖", "🐔"])] },
    { groups: [g("Clothes", ["Hat", "Sock", "Shoe"], ["👒", "🧦", "👟"]), g("Drinks", ["Milk", "Juice", "Water"], ["🥛", "🧃", "💧"])] },
    { groups: [g("My face", ["Eye", "Nose", "Ear"], ["👁️", "👃", "👂"]), g("Fruits", ["Banana", "Pear", "Grapes"], ["🍌", "🍐", "🍇"])] },
    { groups: [g("Family", ["Mum", "Dad", "Baby"], ["👩", "👨", "👶"]), g("At home", ["Bed", "Door", "Chair"], ["🛏️", "🚪", "🪑"])] },
  ],
  c1: [
    { groups: [g("Pets", ["Dog", "Cat", "Rabbit"], ["🐶", "🐱", "🐰"]), g("Fruits", ["Apple", "Banana", "Grapes"], ["🍎", "🍌", "🍇"]), g("Things that go", ["Car", "Bus", "Bike"], ["🚗", "🚌", "🚲"])] },
    { groups: [g("Colours", ["Red", "Blue", "Green"], ["🔴", "🔵", "🟢"]), g("Weather", ["Sun", "Rain", "Snow"], ["☀️", "🌧️", "❄️"]), g("Clothes", ["Cap", "Sock", "Shirt"], ["🧢", "🧦", "👕"])] },
    { groups: [g("Sea animals", ["Fish", "Crab", "Whale"], ["🐟", "🦀", "🐳"]), g("Food", ["Pizza", "Bread", "Cake"], ["🍕", "🍞", "🍰"]), g("Toys", ["Ball", "Teddy", "Kite"], ["⚽", "🧸", "🪁"])] },
    { groups: [g("Farm animals", ["Cow", "Pig", "Hen"], ["🐄", "🐖", "🐔"]), g("My body", ["Eye", "Hand", "Foot"], ["👁️", "✋", "🦶"]), g("School things", ["Book", "Pencil", "Bag"], ["📖", "✏️", "🎒"])] },
  ],
  c2: [
    { groups: [g("Bugs", ["Bee", "Ant", "Butterfly"], ["🐝", "🐜", "🦋"]), g("Drinks", ["Milk", "Juice", "Tea"], ["🥛", "🧃", "🍵"]), g("In the sky", ["Moon", "Star", "Cloud"], ["🌙", "⭐", "☁️"])] },
    { groups: [g("Music", ["Drum", "Guitar", "Trumpet"], ["🥁", "🎸", "🎺"]), g("Vegetables", ["Carrot", "Corn", "Potato"], ["🥕", "🌽", "🥔"]), g("Wild animals", ["Lion", "Tiger", "Bear"], ["🦁", "🐯", "🐻"])] },
    { groups: [g("Sports", ["Football", "Tennis", "Basketball"], ["⚽", "🎾", "🏀"]), g("At home", ["Bed", "Door", "Chair"], ["🛏️", "🚪", "🪑"]), g("Nature", ["Tree", "Flower", "Leaf"], ["🌳", "🌸", "🍃"])] },
    { groups: [g("Birds", ["Owl", "Duck", "Parrot"], ["🦉", "🦆", "🦜"]), g("Sweets", ["Candy", "Cookie", "Ice cream"], ["🍬", "🍪", "🍦"]), g("On the water", ["Boat", "Ship", "Canoe"], ["⛵", "🚢", "🛶"])] },
  ],
  c3: [
    { groups: [g("Jobs", ["Doctor", "Farmer", "Pilot", "Cook"], ["🧑‍⚕️", "🧑‍🌾", "🧑‍✈️", "🧑‍🍳"]), g("Vegetables", ["Carrot", "Potato", "Onion", "Corn"], ["🥕", "🥔", "🧅", "🌽"]), g("Insects", ["Bee", "Ant", "Ladybird", "Butterfly"], ["🐝", "🐜", "🐞", "🦋"])] },
    { groups: [g("Weather", ["Sunny", "Rainy", "Snowy", "Windy"], ["☀️", "🌧️", "❄️", "🌬️"]), g("In the kitchen", ["Fork", "Spoon", "Plate", "Cup"], ["🍴", "🥄", "🍽️", "☕"]), g("Transport", ["Plane", "Ship", "Train", "Bike"], ["✈️", "🚢", "🚂", "🚲"])] },
    { groups: [g("Feelings", ["Happy", "Sad", "Angry", "Scared"], ["😊", "😢", "😠", "😨"]), g("Shapes", ["Circle", "Square", "Triangle", "Star"], ["⚪", "🟥", "🔺", "⭐"]), g("Instruments", ["Drum", "Guitar", "Piano", "Violin"], ["🥁", "🎸", "🎹", "🎻"])] },
    { groups: [g("Sea animals", ["Whale", "Shark", "Octopus", "Crab"], ["🐋", "🦈", "🐙", "🦀"]), g("Wild animals", ["Lion", "Tiger", "Zebra", "Monkey"], ["🦁", "🐯", "🦓", "🐒"]), g("Birds", ["Owl", "Duck", "Parrot", "Penguin"], ["🦉", "🦆", "🦜", "🐧"])] },
    { groups: [g("Sports", ["Football", "Tennis", "Basketball", "Swimming"], ["⚽", "🎾", "🏀", "🏊"]), g("Sweets", ["Candy", "Cookie", "Ice cream", "Chocolate"], ["🍬", "🍪", "🍦", "🍫"]), g("School things", ["Book", "Pencil", "Ruler", "Bag"], ["📖", "✏️", "📏", "🎒"])] },
    { groups: [g("Seasons", ["Spring", "Summer", "Autumn", "Winter"], ["🌷", "🏖️", "🍂", "⛄"]), g("Clothes", ["Coat", "Dress", "Scarf", "Boots"], ["🧥", "👗", "🧣", "🥾"]), g("Fruits", ["Lemon", "Cherry", "Peach", "Melon"], ["🍋", "🍒", "🍑", "🍈"])] },
  ],
  c4: [
    { groups: [g("Jobs", ["Doctor", "Teacher", "Farmer", "Pilot"]), g("Weather words", ["Sunny", "Windy", "Cloudy", "Stormy"]), g("In the kitchen", ["Fork", "Plate", "Oven", "Cup"])] },
    { groups: [g("Planets", ["Mars", "Venus", "Jupiter", "Saturn"]), g("Continents", ["Asia", "Africa", "Europe", "Australia"]), g("Oceans", ["Pacific", "Atlantic", "Indian", "Arctic"])] },
    { groups: [g("Feelings", ["Happy", "Angry", "Scared", "Proud"]), g("Shapes", ["Circle", "Square", "Triangle", "Oval"]), g("Numbers", ["Seven", "Twelve", "Twenty", "Hundred"])] },
    { groups: [g("Seasons", ["Spring", "Summer", "Autumn", "Winter"]), g("Days", ["Monday", "Tuesday", "Friday", "Sunday"]), g("Months", ["March", "June", "October", "December"])] },
    { groups: [g("School subjects", ["Maths", "History", "Science", "Art"]), g("Sports", ["Tennis", "Hockey", "Boxing", "Cycling"]), g("Instruments", ["Piano", "Violin", "Flute", "Drum"])] },
    { groups: [g("Body parts", ["Elbow", "Knee", "Shoulder", "Ankle"]), g("Winter clothes", ["Jacket", "Scarf", "Gloves", "Boots"]), g("Furniture", ["Sofa", "Desk", "Shelf", "Wardrobe"])] },
    { groups: [g("Baby animals", ["Puppy", "Kitten", "Calf", "Foal"]), g("Animal homes", ["Nest", "Hive", "Den", "Burrow"]), g("Animal sounds", ["Bark", "Moo", "Roar", "Hiss"])] },
    { groups: [g("Ways to move", ["Run", "Jump", "Swim", "Climb"]), g("Size words", ["Tiny", "Huge", "Giant", "Little"]), g("Question words", ["Who", "Where", "Why", "How"])] },
  ],
}

/** Colours for found groups (easiest first, like the real game). */
export const groupColors = ["bg-[#FFD166] text-[#4A3500]", "bg-[#7ED957] text-[#173F12]", "bg-[#7FB2FF] text-[#0F2E5C]", "bg-[#C39BFF] text-[#2E1560]"]
