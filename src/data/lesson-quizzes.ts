// 5-question lesson tests (score out of 5), one per built-in resource.
// Teacher-made projects get an automatic quiz built from their details.

import type { Resource } from "@/data/resources"

export type QuizQuestion = { q: string; choices: string[]; answer: number } // answer = index in choices

const quizzes: Record<string, QuizQuestion[]> = {
  cutts: [
    { q: "How long does Matt Cutts try each new thing?", choices: ["7 days", "30 days", "A year", "One weekend"], answer: 1 },
    { q: "Which mountain did he climb?", choices: ["Everest", "Kilimanjaro", "Fuji", "Mont Blanc"], answer: 1 },
    { q: "How many words did he write for his novel in a month?", choices: ["5,000", "50,000", "500", "1 million"], answer: 1 },
    { q: "Which changes does he say are more likely to stick?", choices: ["Big, crazy changes", "Small, sustainable changes", "Changes you tell nobody about", "Changes that cost money"], answer: 1 },
    { q: "Taking a picture every day helped him…", choices: ["Sell photos", "Remember his days better", "Sleep more", "Travel for free"], answer: 1 },
  ],
  caterpillar: [
    { q: "Where did the little egg lie at the start?", choices: ["On a leaf", "In a nest", "Under a rock", "In the water"], answer: 0 },
    { q: "What did the caterpillar eat on Monday?", choices: ["Two pears", "One apple", "Five oranges", "A leaf"], answer: 1 },
    { q: "Why did he get a stomachache on Saturday?", choices: ["He ate too much food", "He was cold", "He ran too fast", "He didn’t sleep"], answer: 0 },
    { q: "What did he build around himself?", choices: ["A house", "A cocoon", "A boat", "A tent"], answer: 1 },
    { q: "What did he become at the end?", choices: ["A bird", "A beautiful butterfly", "A frog", "A bee"], answer: 1 },
  ],
  tortoise: [
    { q: "Who laughed at the tortoise for being slow?", choices: ["The fox", "The hare", "The owl", "The dog"], answer: 1 },
    { q: "What did the tortoise and the hare decide to do?", choices: ["Have a race", "Have a picnic", "Go swimming", "Build a house"], answer: 0 },
    { q: "What did the hare do in the middle of the race?", choices: ["He ate dinner", "He took a nap", "He got lost", "He helped the tortoise"], answer: 1 },
    { q: "Who won the race?", choices: ["The hare", "The tortoise", "Nobody", "The fox"], answer: 1 },
    { q: "What is the lesson of the story?", choices: ["Fast is always best", "Slow and steady wins the race", "Never run", "Always sleep before a race"], answer: 1 },
  ],
  wolf: [
    { q: "What was the boy’s job?", choices: ["Looking after sheep", "Selling bread", "Fishing", "Cooking"], answer: 0 },
    { q: "Why did he shout “Wolf!” the first time?", choices: ["He saw a wolf", "He was bored and wanted a joke", "He was lost", "He was hungry"], answer: 1 },
    { q: "What did the villagers do when he shouted?", choices: ["They laughed and stayed home", "They ran to help him", "They called the police", "They sang a song"], answer: 1 },
    { q: "What happened when a real wolf came?", choices: ["Everyone came to help", "Nobody believed him", "The wolf ran away", "The boy caught the wolf"], answer: 1 },
    { q: "What is the lesson of the story?", choices: ["Wolves are friendly", "People don’t believe someone who lies", "Always shout loudly", "Sheep are clever"], answer: 1 },
  ],
  kidpresident: [
    { q: "Who is Kid President talking to in his pep talk?", choices: ["Only teachers", "You — everyone watching", "His dog", "The real president"], answer: 1 },
    { q: "Which poet does he talk about?", choices: ["Robert Frost", "William Shakespeare", "Dr. Seuss", "Emily Dickinson"], answer: 0 },
    { q: "What happened when he took the road less traveled?", choices: ["He found treasure", "He hurt himself on rocks and thorns", "He got a prize", "He met a dragon"], answer: 1 },
    { q: "What does he tell us to stop being?", choices: ["Boring", "Tall", "Quiet", "Happy"], answer: 0 },
    { q: "What big question does he ask at the end?", choices: ["What’s for lunch?", "What will you create that will make the world awesome?", "Where is my hat?", "Who is the best dancer?"], answer: 1 },
  ],
  malala: [
    { q: "Which country is Malala from?", choices: ["Pakistan", "India", "Egypt", "Turkey"], answer: 0 },
    { q: "On which special day did she give the speech?", choices: ["New Year’s Day", "Her 16th birthday", "Her first day of school", "Her wedding day"], answer: 1 },
    { q: "What was the speech mostly about?", choices: ["Sport", "Every child’s right to education", "Space travel", "Cooking"], answer: 1 },
    { q: "Finish her famous line: “One child, one teacher, one book and one pen…”", choices: ["…are very expensive", "…can change the world", "…need a school", "…are enough for today"], answer: 1 },
    { q: "What did she want world leaders to do?", choices: ["Build more shops", "Make sure all children can go to school", "Close schools", "Make more films"], answer: 1 },
  ],
}

const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5)

/** Wraps a question with its right answer first, shuffled for display. */
function mcq(q: string, right: string, wrong: string[]): QuizQuestion {
  const choices = shuffle([right, ...wrong.filter((w) => w !== right).slice(0, 3)])
  return { q, choices, answer: choices.indexOf(right) }
}

/** Automatic quiz for teacher-made projects, built from the project details. */
function autoQuiz(r: Resource): QuizQuestion[] {
  return [
    mcq(`Who is the speaker or author of “${r.title}”?`, r.speaker || "Unknown", ["Julian Treasure", "Susan Cain", "Hans Rosling", "Matt Cutts"]),
    mcq("Where does this material come from?", r.source || "Unknown", ["TED", "BBC", "YouTube", "A textbook"].filter((x) => x !== r.source)),
    mcq("What kind of material is it?", r.format, ["Video", "Article", "Podcast", "Game"].filter((x) => x !== r.format)),
    mcq("What is the main topic?", r.topic, ["Science", "Culture", "Education", "Lifestyle", "Psychology"].filter((x) => x !== r.topic)),
    mcq("Which skill does this lesson practise?", r.skills[0] ?? "Listening", ["Maths", "Drawing", "Swimming"]),
  ]
}

export function quizFor(r: Resource): QuizQuestion[] {
  return quizzes[r.id] ?? autoQuiz(r)
}
