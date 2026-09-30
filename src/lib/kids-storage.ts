/** localStorage key for one account's kids data, e.g. "pragmalab.kids:ali@mail.com". */
export const kidsKey = (email: string | null, name: string) =>
  `pragmalab.${name}:${(email ?? "guest").toLowerCase()}`
