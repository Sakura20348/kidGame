// "Learn to Read" for older readers: longer texts with comprehension questions.
// Class 4 reads ~200-word texts.
// Class 0–3 keep the picture games (Words → Sentences → Stories) in src/data/reading.ts.

import { gradeOf } from "@/lib/accounts"

export type ReadLevel = "kids" | "middle"

export const readLevels: { id: ReadLevel; name: string; classes: string; blurb: string; emoji: string; tile: string; words?: number }[] = [
  { id: "kids", name: "First reading", classes: "Class 0–3", blurb: "1. Words · 2. Sentences · 3. Stories", emoji: "🧸", tile: "from-[#F6A85B] to-[#E0607E]" },
  { id: "middle", name: "Reading club", classes: "Class 4", blurb: "Texts of about 200 words + 5 questions", emoji: "📗", tile: "from-[#4FACFE] to-[#6C63FF]", words: 200 },
]

export const readLevelForClass = (band?: string): ReadLevel => ((gradeOf(band) ?? 0) <= 3 ? "kids" : "middle")

/** What a question checks – shown as a small tag so readers learn the question types. */
export type QKind = "Detail" | "Vocabulary" | "Main idea" | "Inference" | "Sequence"

export type Passage = {
  id: string
  title: string
  emoji: string
  topic: string
  text: string
  /** Harder words, explained before or while reading. */
  glossary: { word: string; meaning: string }[]
  /** The first option is the answer. */
  questions: { kind: QKind; q: string; options: [string, string, string, string] }[]
}

export const passages: Record<Exclude<ReadLevel, "kids">, Passage[]> = {
  // ================================================================ Class 4 · ~200 words
  middle: [
    {
      id: "bees",
      title: "The Busy Life of Bees",
      emoji: "🐝",
      topic: "Nature",
      text:
        "A honeybee lives for only about six weeks in summer, but it is busy every single day. A hive can hold more than fifty thousand bees, and each one has a job.\n\n" +
        "The queen is the only bee that lays eggs. She can lay up to two thousand eggs in one day! Young worker bees stay inside the hive. They clean the cells, feed the babies and build wax combs.\n\n" +
        "Older workers fly outside to collect nectar and pollen from flowers. A bee may visit hundreds of flowers on one trip.\n\n" +
        "When a bee finds a good field of flowers, it flies home and does a special dance. The dance tells the other bees which way to fly and how far to go.\n\n" +
        "Back at the hive, the bees turn nectar into honey. They fan it with their wings until most of the water dries up. Then they seal it inside the wax cells to eat in winter.\n\n" +
        "Bees also help us. When they move pollen from flower to flower, plants can make fruit and seeds. Without bees, we would have far fewer apples, melons and nuts. So the next time a bee buzzes past you, stay calm and let it do its important work.",
      glossary: [
        { word: "hive", meaning: "the home where a group of bees lives" },
        { word: "nectar", meaning: "a sweet liquid inside flowers" },
        { word: "pollen", meaning: "a yellow powder that helps plants make seeds" },
        { word: "seal", meaning: "to close something tightly" },
      ],
      questions: [
        { kind: "Detail", q: "Which bee is the only one that lays eggs?", options: ["The queen", "The oldest worker", "The youngest worker", "Every bee"] },
        { kind: "Detail", q: "What do young worker bees do?", options: ["Clean, feed babies and build combs", "Fly out to find flowers", "Guard the flowers", "Lay eggs"] },
        { kind: "Sequence", q: "What does a bee do right after it finds a good field of flowers?", options: ["It flies home and dances", "It makes honey there", "It sleeps in a flower", "It calls the queen"] },
        { kind: "Vocabulary", q: "In the text, “seal” the honey means…", options: ["close it tightly", "an animal in the sea", "eat it quickly", "share it with others"] },
        { kind: "Main idea", q: "What is the text mostly about?", options: ["How bees work together and help us", "How to keep bees at home", "Why bees can sting", "The biggest hive in the world"] },
      ],
    },
    {
      id: "windmill",
      title: "The Boy Who Caught the Wind",
      emoji: "🌬️",
      topic: "True story",
      text:
        "William Kamkwamba grew up in a small village in Malawi, in Africa. When he was fourteen, a terrible dry season came. The crops died, and his family could not pay for school, so William had to stay home.\n\n" +
        "He did not stop learning. Every day he walked to a small library and read science books. In one book he saw a picture of a windmill. He learned that a windmill can turn wind into electricity.\n\n" +
        "William decided to build one. He had no money, so he searched a rubbish yard. He found an old bicycle, a broken fan, plastic pipes and pieces of metal. People in the village laughed and called him crazy.\n\n" +
        "William kept working. He cut the pipes into blades and made a tall tower from blue gum trees. At last the day came to test it. The wind blew, the blades spun, and a small light bulb began to glow!\n\n" +
        "Later he built a bigger windmill that pumped water for the fields. His story became a famous book and a film. It shows how reading, curiosity and hard work can change a whole village. Today William helps other young people to build their own ideas.",
      glossary: [
        { word: "crops", meaning: "plants that farmers grow for food" },
        { word: "electricity", meaning: "energy that makes lights and machines work" },
        { word: "blades", meaning: "the flat parts of a windmill that the wind turns" },
      ],
      questions: [
        { kind: "Detail", q: "Why did William have to leave school?", options: ["His family could not pay", "He was ill", "The school closed for summer", "He wanted to work"] },
        { kind: "Detail", q: "Where did William learn about windmills?", options: ["In a library book", "From his teacher", "On television", "From a friend in the city"] },
        { kind: "Inference", q: "Why did William look in a rubbish yard?", options: ["He had no money to buy parts", "He was looking for food", "He lost his bicycle", "His father told him to clean it"] },
        { kind: "Vocabulary", q: "When the light bulb began to “glow”, it…", options: ["gave out light", "broke into pieces", "became very cold", "made a loud noise"] },
        { kind: "Main idea", q: "What lesson does the story teach?", options: ["Reading and hard work can change lives", "Windmills are easy to build", "You should never go to a library", "Only adults can invent things"] },
      ],
    },
    {
      id: "raindrop",
      title: "The Journey of a Raindrop",
      emoji: "💧",
      topic: "Science",
      text:
        "Have you ever wondered where rain comes from? The water in a raindrop is very old. It has been travelling around the Earth for millions of years in a trip called the water cycle.\n\n" +
        "The journey begins when the sun warms a lake, a river or the sea. The heat turns some of the water into an invisible gas called water vapour. This is called evaporation. The vapour rises high into the sky.\n\n" +
        "Up there the air is cold. The vapour cools down and turns back into tiny drops of water. Millions of these drops join together to make a cloud. This step is called condensation.\n\n" +
        "Inside the cloud, the tiny drops bump into each other and grow bigger. When they become too heavy to float, they fall to the ground as rain. If the air is very cold, they fall as snow or hail instead.\n\n" +
        "Some of the rain soaks into the soil, where plants drink it. The rest flows into streams and rivers and back to the sea. Then the sun warms it again, and the journey starts once more. So the water you drink today may once have been drunk by a dinosaur!",
      glossary: [
        { word: "invisible", meaning: "impossible to see" },
        { word: "evaporation", meaning: "when water turns into gas because it is warmed" },
        { word: "condensation", meaning: "when gas cools and turns back into water" },
      ],
      questions: [
        { kind: "Sequence", q: "What happens first in the water cycle?", options: ["The sun warms the water", "Clouds form", "Rain falls", "Water soaks into the soil"] },
        { kind: "Vocabulary", q: "What is “evaporation”?", options: ["Water turning into gas", "Gas turning into water", "Water freezing into ice", "Rain falling from a cloud"] },
        { kind: "Detail", q: "Why do drops fall from a cloud?", options: ["They become too heavy", "The cloud breaks", "The wind pushes them", "The sun melts them"] },
        { kind: "Detail", q: "When does water fall as snow or hail?", options: ["When the air is very cold", "When it is very sunny", "At night only", "When there is no wind"] },
        { kind: "Main idea", q: "Why is it called a “cycle”?", options: ["It goes round and starts again", "It moves very fast", "It happens only once", "It needs a bicycle"] },
      ],
    },
    {
      id: "map",
      title: "The Map in the Attic",
      emoji: "🗺️",
      topic: "Adventure",
      text:
        "On the first day of the holidays, Aziz and his cousin Nilufar were helping Grandma clean the attic. Under a pile of old coats, Nilufar found a wooden box. Inside was a yellow map drawn in pencil.\n\n" +
        "At the top it said, “Treasure of the Walnut Tree.” There was a house, a well, and a big X under a tree. “That's our garden!” shouted Aziz.\n\n" +
        "The children raced downstairs. They counted twenty steps from the well, just like the map said, and stopped under the old walnut tree. They took turns digging with a small spade.\n\n" +
        "After a long time, the spade hit something hard. It was a rusty tin. With shaking hands, Nilufar opened it. There was no gold inside. Instead they found a marble, a toy car, a photo of two smiling boys and a note.\n\n" +
        "The note said, “To whoever finds this: have as much fun as we did. Love, Karim and Rustam, 1972.”\n\n" +
        "Grandma laughed when she saw the photo. “That's your grandfather and his brother!” she said. That evening, the children made their own treasure box to bury for the next explorers. Inside they put a drawing, a shell and a letter of their own.",
      glossary: [
        { word: "attic", meaning: "a room just under the roof of a house" },
        { word: "rusty", meaning: "covered in brown marks because old metal got wet" },
        { word: "explorers", meaning: "people who search new places" },
      ],
      questions: [
        { kind: "Detail", q: "Where did Nilufar find the box?", options: ["Under old coats in the attic", "In the garden", "Behind the well", "In Grandma's kitchen"] },
        { kind: "Sequence", q: "What did the children do after they reached the walnut tree?", options: ["They dug with a spade", "They counted twenty steps", "They showed Grandma the map", "They made their own box"] },
        { kind: "Detail", q: "What was NOT in the tin?", options: ["Gold coins", "A marble", "A toy car", "A note"] },
        { kind: "Inference", q: "Who were Karim and Rustam?", options: ["Grandfather and his brother", "Two neighbours", "The children's teachers", "Famous pirates"] },
        { kind: "Inference", q: "How did the children feel at the end?", options: ["Happy and inspired", "Angry about the gold", "Scared of the attic", "Bored"] },
      ],
    },
    {
      id: "ulugh-beg",
      title: "The Prince Who Counted the Stars",
      emoji: "🔭",
      topic: "History",
      text:
        "Six hundred years ago, the city of Samarkand was ruled by a prince named Ulugh Beg. Many princes loved gold and battles, but Ulugh Beg loved something else: the night sky.\n\n" +
        "As a boy, he travelled with his grandfather, the great ruler Amir Timur, and saw famous buildings and libraries. He grew up curious about mathematics and the stars.\n\n" +
        "When he became ruler, he built a school where students studied astronomy and maths. Then, around 1420, he built an observatory on a hill. Inside was a giant curved instrument, more than forty metres long, cut deep into the rock. With it, scientists could measure the exact position of the sun, the moon and the stars.\n\n" +
        "Ulugh Beg and his team made a catalogue of more than a thousand stars. They also measured the length of a year. Their answer was wrong by less than one minute!\n\n" +
        "Sadly, the observatory was later destroyed and forgotten. In 1908, an archaeologist found its remains under the ground. Today visitors in Samarkand can still see the huge curved stairway where scientists once watched the sky. It reminds us that curiosity can be more valuable than any crown.",
      glossary: [
        { word: "astronomy", meaning: "the science of stars, planets and space" },
        { word: "observatory", meaning: "a building for watching the sky" },
        { word: "catalogue", meaning: "a careful list of many things" },
        { word: "archaeologist", meaning: "a scientist who digs up old places and objects" },
      ],
      questions: [
        { kind: "Detail", q: "What did Ulugh Beg love most?", options: ["The night sky", "Gold", "Battles", "Horses"] },
        { kind: "Detail", q: "Who was Ulugh Beg's grandfather?", options: ["Amir Timur", "An astronomer from Greece", "A farmer", "The king of Egypt"] },
        { kind: "Vocabulary", q: "An “observatory” is…", options: ["a building for watching the sky", "a kind of school bag", "a big library", "a palace for princes"] },
        { kind: "Inference", q: "Why is the measurement of the year so impressive?", options: ["It was almost perfect without modern tools", "It was made in one night", "Nobody had measured anything before", "It used a telescope from America"] },
        { kind: "Sequence", q: "What happened in 1908?", options: ["The remains were found", "The observatory was built", "Ulugh Beg became ruler", "The star catalogue was finished"] },
      ],
    },
    {
      id: "captain",
      title: "The New Captain",
      emoji: "⚽",
      topic: "School",
      text:
        "Madina was the fastest player on the school football team, so she was sure the coach would choose her as captain. When the coach read out the name, it was not hers. It was Timur, a quiet boy who rarely scored goals.\n\n" +
        "Madina was angry. “Why him?” she whispered to her friend. “He's not even good!”\n\n" +
        "At the next match, the team was losing by two goals. Madina ran with the ball again and again, but she never passed, and she lost it every time. The other players began to argue.\n\n" +
        "At half time, Timur did not shout. He asked everyone for their ideas. He noticed that the other team left the left side open. “Madina,” he said, “you're the fastest. Run down the left, and we'll pass to you.”\n\n" +
        "In the second half, the plan worked. Madina scored once, and then she passed to Timur, who scored the winning goal.\n\n" +
        "After the match, Madina walked over to Timur. “Now I understand why the coach chose you,” she said. “A captain doesn't need to be the best player. A captain makes the whole team better.” Timur smiled, and the two of them walked home together, already planning the next match.",
      glossary: [
        { word: "captain", meaning: "the leader of a team" },
        { word: "rarely", meaning: "not often" },
        { word: "argue", meaning: "to disagree in an angry way" },
      ],
      questions: [
        { kind: "Detail", q: "Who did the coach choose as captain?", options: ["Timur", "Madina", "Madina's friend", "The coach's son"] },
        { kind: "Inference", q: "Why was the team losing in the first half?", options: ["Madina never passed and players argued", "It was raining", "Timur was not playing", "The coach was late"] },
        { kind: "Detail", q: "What did Timur do at half time?", options: ["He asked everyone for ideas", "He shouted at the team", "He left the match", "He changed the goalkeeper"] },
        { kind: "Vocabulary", q: "Timur “rarely scored goals” means he…", options: ["did not score often", "scored every match", "never played", "scored very beautiful goals"] },
        { kind: "Main idea", q: "What did Madina learn?", options: ["A good leader makes the team better", "Fast players should be captains", "Football is not fun", "You should never pass the ball"] },
      ],
    },
  ],
}

export const wordCount = (text: string) => text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
