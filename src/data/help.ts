// Help & Guides content. Each article is a list of simple blocks.

export type Block = { p: string } | { h: string } | { list: string[] }

export type Article = { id: string; title: string; body: Block[] }
export type Category = { id: string; title: string; emoji: string; articles: Article[] }

export const helpCategories: Category[] = [
  {
    id: "start",
    title: "Getting Started",
    emoji: "🚀",
    articles: [
      {
        id: "what-is",
        title: "What is LittleReaderLab?",
        body: [
          { p: "LittleReaderLab is a place for interactive reading adventures for young English learners: stories, lessons, games and tasks, with scores and saved progress. Read. Explore. Grow." },
          { h: "What you’ll find inside" },
          {
            list: [
              "Discover — a library of learning resources you can filter by level, age, format and topic.",
              "Dashboard — your projects, team, students’ scores and settings in one place.",
              "Kids games — games for every class, from Math Sprint to Python Quest.",
            ],
          },
        ],
      },
      {
        id: "sign-in",
        title: "How do I sign in or create an account?",
        body: [
          { p: "On the sign-in page, choose Student or Teacher, then enter your email and password." },
          { h: "New here?" },
          { p: "Press “Create an account”, pick your role, then fill in your name, email and a password with at least 6 characters. Students don’t need an email — they choose their class (0–4) and get a student ID; teachers can add their school." },
          { p: "If you sign in as the wrong role, LittleReaderLab tells you which one your account uses." },
        ],
      },
      {
        id: "roles",
        title: "Student or teacher — what’s the difference?",
        body: [
          { p: "Both roles can explore resources and play the kids games. The role is shown on your ID card and in Settings → Account." },
          { list: ["Teachers get the dashboard tools: projects, team, and the Student’s library with scores.", "Students get the Student workspace with materials, assignments and progress."] },
        ],
      },
      {
        id: "offline",
        title: "Can I use LittleReaderLab without internet?",
        body: [
          { p: "Yes. Once the app has loaded, the games, your saved items and your projects keep working offline. A small “You’re offline” note appears at the bottom, and “You’re back online” when the connection returns." },
        ],
      },
    ],
  },
  {
    id: "lessons",
    title: "Lessons & Resources",
    emoji: "📚",
    articles: [
      {
        id: "find",
        title: "How do I find a lesson?",
        body: [
          { p: "Open Discover. Type in the search box or use the Level, Class, Format and Topic filters." },
          { p: "Your search and filters are kept in the page address, so you can bookmark or share a filtered list." },
        ],
      },
      {
        id: "save",
        title: "How do I save a resource to My Library?",
        body: [{ p: "Press the bookmark icon at the bottom of any resource card. Saved resources appear in My Library; press the bookmark again to remove it." }],
      },
      {
        id: "project",
        title: "How do I create my own project?",
        body: [
          { p: "Open the account menu (your avatar) and choose “New project”, or press “Add Project” on the dashboard." },
          { p: "Fill in the name, description, level, class, topic and format, pick a card colour and press “Create project”. It appears first on Discover." },
          { p: "To delete one of your projects, open its Details and press “Delete project”." },
        ],
      },
      {
        id: "import",
        title: "Can I import projects from a file?",
        body: [
          { p: "Yes — on the dashboard press “Import Data” and choose a .json file with a list of projects. Each project needs at least a title." },
          { list: ["Optional fields: description, level, ageGroup, topic, format, skills, source, speaker, tasks, color."] },
        ],
      },
    ],
  },
  {
    id: "kids",
    title: "Kids Games",
    emoji: "🎮",
    articles: [
      {
        id: "games",
        title: "Which games are there?",
        body: [
          { p: "Open “Kids games” in the Discover sidebar. There are games for numbers, reading, memory, time, typing, logic, coding, chess and sudoku — each with its own levels and stars." },
        ],
      },
      {
        id: "stars",
        title: "How do kids earn stars?",
        body: [
          { p: "Each game gives 0–3 stars for a round or level. The ⭐ total in the top corner adds them up, and each game tile shows the best result." },
          { p: "In games with levels (Mountain Climb, Python Quest, Town Helpers…), replaying only adds stars when you do better." },
        ],
      },
      {
        id: "separate",
        title: "Why are the stars different on another account?",
        body: [{ p: "Every account keeps its own stars and progress, so each child should sign in with their own email. Progress is saved on the device you play on." }],
      },
      {
        id: "python",
        title: "How does Python Quest check my code?",
        body: [
          { p: "Python Quest runs your code with a small built-in Python. It highlights the running line in yellow, and if something is wrong it shows a friendly message on the red line — for example “Did you mean right()?”." },
        ],
      },
    ],
  },
  {
    id: "account",
    title: "Account & Settings",
    emoji: "⚙️",
    articles: [
      {
        id: "change",
        title: "How do I change my name, email or password?",
        body: [
          { p: "Go to Settings → Account. Each field has its own Save button." },
          { list: ["Name — updates your avatar, ID card and greetings.", "Email — your stars, photo, settings and plan move to the new email.", "Password — enter your current password, then the new one twice."] },
        ],
      },
      {
        id: "photo",
        title: "How do I add a profile photo?",
        body: [
          { p: "In Settings → Account, tap the camera badge on your avatar. Take a photo with your camera or upload one from your device. It appears on your avatar everywhere and on your ID card." },
        ],
      },
      {
        id: "theme",
        title: "How do I switch between light and dark mode?",
        body: [{ p: "Use the sun/moon button in the top bar, or choose Light, Dark or System in Settings → Appearance." }],
      },
      {
        id: "data",
        title: "How do I download or delete my data?",
        body: [
          { p: "Settings → Privacy & Security has “Download my data” (a file with everything saved on this device) and “Clear data on this device”, which removes it and signs you out." },
        ],
      },
    ],
  },
  {
    id: "signin",
    title: "Signing in & classes",
    emoji: "🔐",
    articles: [
      {
        id: "email-code",
        title: "Why do teachers get a code by email?",
        body: [
          { p: "Every time a teacher signs in, LittleReaderLab sends a 6-digit code to their email. Type it on the “Enter your code” screen to open your workspace." },
          { list: ["The code works for 10 minutes", "No email? Press “Send a new code” after 30 seconds", "Signing out means you get a new code next time"] },
        ],
      },
      {
        id: "student-id",
        title: "How do students sign in?",
        body: [{ p: "Students don’t need an email. When they sign up they get a 6-digit student ID, and they sign in with that ID and their password. Teachers can see every student’s ID under Dashboard → Student view." }],
      },
      {
        id: "class-code",
        title: "How do students join my class?",
        body: [{ p: "Open Dashboard → Team to see your class code. Students type it once after signing up, and then they can use LittleReaderLab. You can remove a student from the Team page at any time." }],
      },
    ],
  },
  {
    id: "team",
    title: "Teams & Students",
    emoji: "👥",
    articles: [
      {
        id: "online",
        title: "How do I see who is online?",
        body: [
          { p: "Open Team in the dashboard. A green dot on the avatar and “Online” in the Last Active column show who is signed in right now; others show “Last seen …”." },
        ],
      },
      {
        id: "emoji",
        title: "What do the emoji scores mean?",
        body: [
          { p: "In the Student’s library, each test score out of 5 has an emoji:" },
          { list: ["😁 5/5 Excellent", "😃 4/5 Great", "😐 3/5 Okay", "😕 2/5 Getting there", "😠 1/5 Keep trying", "😡 0/5 Needs help"] },
        ],
      },
      {
        id: "status",
        title: "How do I change a learner’s status?",
        body: [{ p: "In Team, press ⋮ at the end of a row and choose Mark as completed, pending or canceled. You can also remove a learner there." }],
      },
    ],
  },
]

export const allArticles = helpCategories.flatMap((c) => c.articles.map((a) => ({ ...a, category: c })))

export const articleText = (a: Article) =>
  a.body.map((b) => ("p" in b ? b.p : "h" in b ? b.h : b.list.join(" "))).join(" ")
