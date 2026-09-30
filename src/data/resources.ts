import type { LessonTask } from "@/data/lesson-tasks"
import { classNames } from "@/lib/accounts"
import { curriculum } from "@/data/curriculum"

/** One learning resource shown on the Discover page. */
export type Resource = {
  id: string
  title: string
  description: string
  level: string // always "A1"
  ageGroup: string // "Class 2" – or an older range like "Class 0–3" that covers several classes
  topic: string
  format: "Video" | "Article" | "Podcast"
  skills: string[]
  source: string
  speaker: string
  color: string // card header color
  tasks: number
  custom?: boolean // created by the user with "New project"
  owner?: string // the teacher who made the project
  taskList?: LessonTask[] // tasks the teacher built for the project
  image?: string // cover picture for the card (small JPEG data URL)
}

/** Options for the filter dropdowns. */
export const resourceFilters = {
  levels: ["A1"], // CEFR – every lesson here is A1 (Class 0–4 beginners)
  ageGroups: classNames, // Class 0 … Class 4, each separate
  formats: ["Video", "Article", "Podcast"],
  // the 10 topics of the reading curriculum (src/data/curriculum.ts)
  topics: curriculum.map((t) => t.name),
}

export const cardColors = {
  mint: "#B2DCC6",
  peach: "#F4B6A6",
  lavender: "#C9C1EC",
  butter: "#F4DB94",
  sky: "#A9CBE3",
  sage: "#A7C79B",
}

// TODO: load these from your API instead of hard-coding them.
export const sampleResources: Resource[] = [
  {
    id: "cutts",
    title: "Try something new for 30 days",
    description:
      "A short guided video lesson using the exact TED talk, focused on the challenges Cutts tried and the simple language he uses to describe them.",
    level: "A1",
    ageGroup: "Class 4",
    topic: "Daily Routines",
    format: "Video",
    skills: ["Listening", "Speaking"],
    source: "TED",
    speaker: "Matt Cutts",
    color: cardColors.butter,
    tasks: 4,
  },
  // ------------------------------------------------ younger learners
  {
    id: "caterpillar",
    title: "The Very Hungry Caterpillar",
    description: "A read-along story lesson about a tiny caterpillar who eats and eats — practising days of the week, numbers and food words.",
    level: "A1",
    ageGroup: "Class 0–3",
    topic: "Animals Around Us",
    format: "Article",
    skills: ["Reading", "Vocabulary"],
    source: "Picture book",
    speaker: "Eric Carle",
    color: cardColors.sage,
    tasks: 5,
  },
  {
    id: "tortoise",
    title: "The Tortoise and the Hare",
    description: "A read-along fable lesson about a proud hare, a patient tortoise and a race — with the story’s lesson at the end.",
    level: "A1",
    ageGroup: "Class 0–3",
    topic: "A Short Story (Simple Narrative)",
    format: "Article",
    skills: ["Reading", "Listening"],
    source: "Aesop’s Fables",
    speaker: "Aesop",
    color: cardColors.peach,
    tasks: 5,
  },
  {
    id: "wolf",
    title: "The Boy Who Cried Wolf",
    description: "A read-along fable lesson about a shepherd boy who plays a trick one time too many — and why telling the truth matters.",
    level: "A1",
    ageGroup: "Class 0–3",
    topic: "A Short Story (Simple Narrative)",
    format: "Article",
    skills: ["Reading", "Speaking"],
    source: "Aesop’s Fables",
    speaker: "Aesop",
    color: cardColors.sky,
    tasks: 5,
  },
  {
    id: "kidpresident",
    title: "A Pep Talk from Kid President to You",
    description: "A guided video lesson on Kid President’s famous pep talk — big ideas about being awesome, trying new roads and making the world better.",
    level: "A1",
    ageGroup: "Class 4",
    topic: "My Best Friend",
    format: "Video",
    skills: ["Listening", "Speaking"],
    source: "SoulPancake",
    speaker: "Kid President",
    color: cardColors.lavender,
    tasks: 5,
  },
  {
    id: "malala",
    title: "Malala’s speech at the United Nations",
    description: "A guided video lesson on Malala Yousafzai’s speech about every child’s right to go to school.",
    level: "A1",
    ageGroup: "Class 4",
    topic: "My School",
    format: "Video",
    skills: ["Listening", "Reading"],
    source: "United Nations",
    speaker: "Malala Yousafzai",
    color: cardColors.mint,
    tasks: 5,
  },
]

/** Topics from before the curriculum list → the matching curriculum topic. */
const oldTopics: Record<string, string> = {
  "Me and my friends": "My Best Friend",
  "My family": "My Family",
  "My school": "My School",
  "Colours and numbers": "Clothes and Colours",
  Animals: "Animals Around Us",
  "Food and drinks": "My Favourite Food",
  "My body": "My Best Friend",
  Clothes: "Clothes and Colours",
  "Toys and games": "My House",
  "My home": "My House",
  "Weather and seasons": "Seasons and Weather",
  "Holidays and Navruz": "Daily Routines",
  "Hobbies and free time": "Daily Routines",
  Sports: "Daily Routines",
  Health: "Daily Routines",
  "Nature and environment": "Animals Around Us",
  "Science and technology": "Animals Around Us",
  "Education and future": "My School",
  Education: "My School",
  Communication: "My Best Friend",
  Psychology: "My Best Friend",
  "Feelings and psychology": "My Best Friend",
  Lifestyle: "Daily Routines",
  Science: "Animals Around Us",
}
/** Any topic (old or new) as one of the 10 curriculum topics; unknown ones count as a short story. */
export const normalizeTopic = (topic: string) =>
  curriculum.some((t) => t.name === topic) ? topic : (oldTopics[topic] ?? "A Short Story (Simple Narrative)")
