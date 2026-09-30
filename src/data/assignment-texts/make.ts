import type { Assignment } from "@/data/assignments"

const colors = ["#B2DCC6", "#F4DB94", "#A9CBE3", "#C9C1EC", "#F4B6A6", "#A7C79B"]

export type Draft = Omit<Assignment, "age" | "color">

/** Gives every text in a class group its class and a card colour. */
export const band = (age: string, list: Draft[]): Assignment[] => list.map((a, i) => ({ ...a, age, color: colors[i % colors.length] }))
