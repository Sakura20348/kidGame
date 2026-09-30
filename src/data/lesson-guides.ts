// What each lesson teaches: a picture, key ideas / a simple story, new words and a writing prompt.
// Kid-style lessons (Class 0–3) show the story; study-style lessons (Class 4) use the ideas and prompt.

import type { Resource } from "@/data/resources"
import { gradeOf } from "@/lib/accounts"

export type LessonGuide = {
  emoji: string
  /** Simple sentences: the story for kids, the key ideas for older learners. */
  ideas: string[]
  words: { word: string; emoji: string; meaning: string }[]
  prompt: string
}

const guides: Record<string, LessonGuide> = {
  // ------------------------------------------------------------ Class 0–3
  caterpillar: {
    emoji: "🐛",
    ideas: [
      "A little egg lay on a leaf in the moonlight.",
      "On Sunday morning, out popped a tiny and very hungry caterpillar!",
      "Every day he ate more fruit: one apple, then two pears, then three plums…",
      "On Saturday he ate so much food that he got a stomachache.",
      "He ate one nice green leaf, built a cocoon around himself and slept for two weeks.",
      "Then he pushed his way out — he was a beautiful butterfly! 🦋",
    ],
    words: [
      { word: "caterpillar", emoji: "🐛", meaning: "a baby insect that turns into a butterfly" },
      { word: "cocoon", emoji: "🥚", meaning: "a little house the caterpillar sleeps in" },
      { word: "butterfly", emoji: "🦋", meaning: "an insect with big colourful wings" },
    ],
    prompt: "What is your favourite fruit? How many would you eat in one day?",
  },
  tortoise: {
    emoji: "🐢",
    ideas: [
      "A fast hare laughed at a slow tortoise. “You are so slow!” he said.",
      "“Let’s have a race,” said the tortoise calmly.",
      "The hare ran far ahead. He was so sure he would win that he lay down for a nap.",
      "The tortoise did not stop. Slowly and steadily, he kept walking.",
      "When the hare woke up, the tortoise was crossing the finish line!",
      "Slow and steady wins the race. 🏁",
    ],
    words: [
      { word: "tortoise", emoji: "🐢", meaning: "a slow animal with a hard shell" },
      { word: "hare", emoji: "🐇", meaning: "an animal like a big, fast rabbit" },
      { word: "race", emoji: "🏁", meaning: "a game to see who is the fastest" },
    ],
    prompt: "Tell about a time you kept trying and did not give up.",
  },
  wolf: {
    emoji: "🐺",
    ideas: [
      "A shepherd boy looked after sheep on a hill. He was bored.",
      "For a joke, he shouted: “Wolf! Wolf!” The villagers ran up to help — but there was no wolf.",
      "He laughed and did the same trick again the next day.",
      "Then a real wolf came! “Wolf! Wolf!” he cried.",
      "This time nobody came, because nobody believed him.",
      "When you tell lies, people stop believing you — even when you tell the truth. 💬",
    ],
    words: [
      { word: "shepherd", emoji: "🐑", meaning: "a person who looks after sheep" },
      { word: "wolf", emoji: "🐺", meaning: "a wild animal like a big dog" },
      { word: "truth", emoji: "✅", meaning: "what really happened" },
    ],
    prompt: "Why is it important to tell the truth? Give an example.",
  },
  // ------------------------------------------------------------ Class 4
  kidpresident: {
    emoji: "🎤",
    ideas: [
      "Kid President gives everyone a pep talk: a short speech to make you feel strong.",
      "He says we were made to be awesome — so we should stop being boring!",
      "He tells the story of taking “the road less traveled” like the poet Robert Frost… and getting hurt on the rocks.",
      "The world needs you to make it a better place, even with small things.",
      "His big question: “What will you create that will make the world awesome?” 🌟",
    ],
    words: [
      { word: "pep talk", emoji: "📣", meaning: "a short talk to make someone feel brave" },
      { word: "awesome", emoji: "🌟", meaning: "really, really great" },
      { word: "create", emoji: "🛠️", meaning: "to make something new" },
    ],
    prompt: "What will you create to make the world more awesome?",
  },
  malala: {
    emoji: "📚",
    ideas: [
      "Malala Yousafzai is from Pakistan. She spoke up for girls’ right to go to school.",
      "On her 16th birthday she gave a speech at the United Nations.",
      "She asked world leaders to make sure every child can go to school.",
      "Her famous words: “One child, one teacher, one book and one pen can change the world.” ✏️",
    ],
    words: [
      { word: "education", emoji: "🎓", meaning: "learning at school" },
      { word: "right", emoji: "⚖️", meaning: "something every person should have" },
      { word: "speech", emoji: "🎤", meaning: "a talk in front of many people" },
    ],
    prompt: "Why is school important for every child? Give two reasons.",
  },
  cutts: {
    emoji: "🗓️",
    ideas: [
      "Matt Cutts felt stuck in a rut, so he tried something new for 30 days.",
      "He took a photo every day, biked to work and even climbed Mount Kilimanjaro.",
      "He wrote a 50,000-word novel in one month!",
      "Small, sustainable changes are the ones that stick.",
    ],
    words: [
      { word: "challenge", emoji: "🏔️", meaning: "something hard that you try to do" },
      { word: "habit", emoji: "🔁", meaning: "something you do again and again" },
      { word: "sustainable", emoji: "🌱", meaning: "easy to keep doing for a long time" },
    ],
    prompt: "What will you try for 30 days? Say how you’ll do it each day.",
  },
}

const formatEmoji: Record<Resource["format"], string> = { Video: "🎬", Article: "📰", Podcast: "🎧" }

/** Automatic guide for teacher-made projects. */
function autoGuide(r: Resource): LessonGuide {
  return {
    emoji: formatEmoji[r.format] ?? "📘",
    ideas: [r.description, `This ${r.format.toLowerCase()} is by ${r.speaker || r.source}.`, `It helps you practise ${r.skills.join(" and ").toLowerCase() || "English"}.`],
    words: r.skills.slice(0, 3).map((s) => ({ word: s.toLowerCase(), emoji: "⭐", meaning: `the skill of ${s.toLowerCase()}` })),
    prompt: `What did you learn from “${r.title}”? Explain it in your own words.`,
  }
}

export const guideFor = (r: Resource): LessonGuide => guides[r.id] ?? autoGuide(r)

/** Kid style for Class 0–3, study style for Class 4 (and when the class is unknown). */
export const isYoungAge = (age?: string) => {
  const g = gradeOf(age)
  return g !== null && g <= 3
}
