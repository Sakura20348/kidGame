import { cardColors } from "@/data/resources"
import { nameFromEmail, ONLINE_WINDOW_MS, readJoined } from "@/lib/presence"

export type MemberStatus = "Completed" | "Pending" | "Canceled"

export type Member = {
  id: string
  name: string
  email: string
  phone: string
  level: string
  lesson: string
  date: string // ISO
  type: "Virtual" | "In Person"
  status: MemberStatus
  color: string
  lastSeen: string // ISO – when they were last signed in and active
  joined?: boolean // signed in on this app (not sample data)
  online?: boolean // sample data only – real users use lastSeen
}

const names = [
  "Alexandra Deff", "Edwin Adenike", "Isaac Oluwatemilorun", "David Oshodi",
  "Claude Zieme", "Jessie Lubowitz", "Darrel Skiles", "Sean Harber",
  "Pat Gutmann", "Mona McKenzie", "Nicole Ziemann", "Pam Pouros",
  "James Jerin", "Aziza Karimova", "Jasur Tursunov", "Madina Yusupova",
  "Rustam Aliyev", "Nodira Qodirova", "Timur Rashidov", "Laylo Saidova",
  "Bekzod Nazarov", "Sevara Ismoilova", "Olim Ergashev", "Dilnoza Abdullayeva",
]
const lessons = [
  "The power of vulnerability", "Do schools kill creativity?",
  "The danger of a single story", "Try something new for 30 days",
  "The power of introverts", "10 ways to have a better conversation",
  "Grit: the power of passion and perseverance", "The best stats you’ve ever seen",
]
const levels = ["A1"]
const statuses: MemberStatus[] = ["Pending", "Completed", "Completed", "Canceled", "Pending", "Canceled", "Completed", "Canceled", "Pending"]
const colors = Object.values(cardColors)

// TODO: load learners from the API. These are sample rows.
export const sampleMembers: Member[] = names.map((name, i) => {
  const [first, last] = name.toLowerCase().split(" ")
  return {
    id: `m-${i + 1}`,
    name,
    email: `${first}.${last}@example.com`,
    phone: `+998 9${(i * 7) % 10} ${String(100 + ((i * 37) % 900))}-${String(10 + ((i * 13) % 90))}-${String(10 + ((i * 29) % 90))}`,
    level: levels[i % levels.length],
    lesson: lessons[i % lessons.length],
    date: new Date(Date.UTC(2026, 8, 1 + (i % 25), 9 + (i % 8), (i * 11) % 60)).toISOString(),
    type: i % 3 === 1 ? "In Person" : "Virtual",
    status: statuses[i % statuses.length],
    color: colors[i % colors.length],
    // every 5th sample learner is online, the rest were seen a while ago
    online: i % 5 === 0,
    lastSeen: new Date(Date.now() - (((i * 47) % 2880) + 10) * 60_000).toISOString(),
  }
})

/** People who have signed in on this device, newest first. */
export function joinedMembers(): Member[] {
  return readJoined().map((u, i) => ({
    id: `joined-${u.email}`,
    name: nameFromEmail(u.email) || u.email,
    email: u.email,
    phone: "—",
    level: "—",
    lesson: "No lesson yet",
    date: u.joinedAt,
    type: "Virtual",
    status: "Pending",
    color: colors[(i + 2) % colors.length],
    lastSeen: u.lastSeen,
    joined: true,
  }))
}

export function isOnline(m: Pick<Member, "lastSeen" | "online">) {
  return m.online ?? Date.now() - new Date(m.lastSeen).getTime() < ONLINE_WINDOW_MS
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
