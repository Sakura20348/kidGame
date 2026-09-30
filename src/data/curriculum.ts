// The reading curriculum: 10 topics, what pupils should be able to do, and which reading skills they build.
// (From the school's topic plan; skill names translated from Uzbek.)

/** Reading skill components. */
export const readingSkills = [
  "Phonological awareness", // fonetik xabardorlik
  "Phonemic awareness", // fonemik xabardorlik
  "Vocabulary", // lug‘at boyligi
  "Decoding", // dekodlash
  "Comprehension", // tushunish
  "Fluency", // ravonlik
] as const
export type ReadingSkill = (typeof readingSkills)[number]

export type CurriculumTopic = { name: string; emoji: string; outcomes: string[]; skills: ReadingSkill[] }

export const curriculum: CurriculumTopic[] = [
  {
    name: "My Family",
    emoji: "👨‍👩‍👧",
    outcomes: ["Pupils can recognize and read simple words related to family members.", "Understand short sentences about family."],
    skills: ["Phonological awareness", "Vocabulary"],
  },
  {
    name: "My School",
    emoji: "🏫",
    outcomes: ["Pupils can read and identify school-related vocabulary.", "Understand simple classroom instructions."],
    skills: ["Phonemic awareness", "Decoding"],
  },
  {
    name: "Daily Routines",
    emoji: "⏰",
    outcomes: ["Pupils can read short sentences about daily activities.", "Identify the sequence of actions in a text."],
    skills: ["Decoding", "Comprehension"],
  },
  {
    name: "My Favourite Food",
    emoji: "🍎",
    outcomes: ["Pupils can read and understand food names and preferences.", "Match words with pictures."],
    skills: ["Vocabulary", "Comprehension"],
  },
  {
    name: "Animals Around Us",
    emoji: "🐾",
    outcomes: ["Pupils can read simple descriptive sentences about animals.", "Identify key information in a short text."],
    skills: ["Fluency", "Comprehension"],
  },
  {
    name: "Seasons and Weather",
    emoji: "🌦️",
    outcomes: ["Pupils can read and interpret simple weather descriptions.", "Recognize key vocabulary in context."],
    skills: ["Vocabulary", "Decoding"],
  },
  {
    name: "My House",
    emoji: "🏠",
    outcomes: ["Pupils can read short texts about rooms and objects.", "Understand spatial vocabulary (in, on, under, next to)."],
    skills: ["Decoding", "Comprehension"],
  },
  {
    name: "Clothes and Colours",
    emoji: "👕",
    outcomes: ["Pupils can read and match clothing descriptions.", "Identify descriptive words in sentences."],
    skills: ["Phonemic awareness", "Vocabulary"],
  },
  {
    name: "My Best Friend",
    emoji: "🤝",
    outcomes: ["Pupils can read short descriptive texts about a person.", "Understand basic character descriptions."],
    skills: ["Fluency", "Comprehension"],
  },
  {
    name: "A Short Story (Simple Narrative)",
    emoji: "📖",
    outcomes: ["Pupils can read a short story and understand the main idea.", "Retell simple events from the text."],
    skills: ["Fluency", "Comprehension"],
  },
]

export const curriculumTopic = (name: string) => curriculum.find((t) => t.name === name)
