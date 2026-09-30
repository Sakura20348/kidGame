// Reading corner (student Overview): for every curriculum topic – words, sentences and a short story.
// Simple English for Class 0–4.

export type CornerTopic = {
  name: string // matches src/data/curriculum.ts
  emoji: string
  tile: string // card gradient
  words: { word: string; emoji: string }[]
  sentences: string[]
  story: { title: string; text: string }
}

export const readingCorner: CornerTopic[] = [
  {
    name: "My Family",
    emoji: "👨‍👩‍👧",
    tile: "from-[#FF9A8B] to-[#FF6A88]",
    words: [
      { word: "mother", emoji: "👩" },
      { word: "father", emoji: "👨" },
      { word: "sister", emoji: "👧" },
      { word: "brother", emoji: "👦" },
      { word: "baby", emoji: "👶" },
      { word: "grandma", emoji: "👵" },
      { word: "grandpa", emoji: "👴" },
      { word: "family", emoji: "👨‍👩‍👧‍👦" },
    ],
    sentences: ["This is my mother.", "My father is tall.", "I have one sister.", "My baby brother is small.", "I love my family."],
    story: {
      title: "Sunday with Grandma",
      text: "It is Sunday. We visit Grandma. Grandma makes a big cake. My sister and I help her. Grandpa reads a book to the baby. Mum and Dad drink tea. We eat the cake together. I love Sundays with my family!",
    },
  },
  {
    name: "My School",
    emoji: "🏫",
    tile: "from-[#4FACFE] to-[#6C63FF]",
    words: [
      { word: "book", emoji: "📖" },
      { word: "pencil", emoji: "✏️" },
      { word: "bag", emoji: "🎒" },
      { word: "teacher", emoji: "🧑‍🏫" },
      { word: "chair", emoji: "🪑" },
      { word: "ruler", emoji: "📏" },
      { word: "clock", emoji: "🕒" },
      { word: "crayon", emoji: "🖍️" },
    ],
    sentences: ["Open your book.", "Take your pencil.", "Sit at your desk.", "Listen to the teacher.", "Put your bag on the chair."],
    story: {
      title: "Tom’s First Day",
      text: "Tom has a new red bag. In the bag there is a book and a pencil. Tom goes to school. His teacher smiles and says hello. Tom sits at a desk next to Sara. They draw a big sun. Tom likes his new school.",
    },
  },
  {
    name: "Daily Routines",
    emoji: "⏰",
    tile: "from-[#FFB347] to-[#FF7A59]",
    words: [
      { word: "wake up", emoji: "⏰" },
      { word: "wash", emoji: "🧼" },
      { word: "brush", emoji: "🪥" },
      { word: "breakfast", emoji: "🥣" },
      { word: "walk", emoji: "🚶" },
      { word: "play", emoji: "⚽" },
      { word: "dinner", emoji: "🍲" },
      { word: "sleep", emoji: "😴" },
    ],
    sentences: ["I wake up at seven.", "I brush my teeth.", "I eat breakfast with Mum.", "I walk to school.", "I go to bed at nine."],
    story: {
      title: "Anna’s Day",
      text: "Anna wakes up at seven o’clock. First, she washes her face. Then she eats breakfast. After that, she walks to school. In the afternoon, she plays in the park. In the evening, she eats dinner. At nine o’clock, Anna goes to sleep.",
    },
  },
  {
    name: "My Favourite Food",
    emoji: "🍎",
    tile: "from-[#6FCF97] to-[#1F9D6B]",
    words: [
      { word: "apple", emoji: "🍎" },
      { word: "banana", emoji: "🍌" },
      { word: "bread", emoji: "🍞" },
      { word: "milk", emoji: "🥛" },
      { word: "rice", emoji: "🍚" },
      { word: "soup", emoji: "🍲" },
      { word: "cake", emoji: "🍰" },
      { word: "egg", emoji: "🥚" },
    ],
    sentences: ["I like apples.", "I don’t like milk.", "My favourite food is plov.", "Bananas are yellow.", "Cake is sweet."],
    story: {
      title: "The Picnic",
      text: "Mia and Ben have a picnic. Mia has bread and cheese. Ben has apples and bananas. They drink orange juice. A little bird comes. Mia gives the bird some bread. ‘Yum!’ says Ben. ‘This is the best picnic!’",
    },
  },
  {
    name: "Animals Around Us",
    emoji: "🐾",
    tile: "from-[#B06AB3] to-[#5B3FA8]",
    words: [
      { word: "cat", emoji: "🐱" },
      { word: "dog", emoji: "🐶" },
      { word: "cow", emoji: "🐄" },
      { word: "bird", emoji: "🐦" },
      { word: "fish", emoji: "🐟" },
      { word: "horse", emoji: "🐴" },
      { word: "rabbit", emoji: "🐰" },
      { word: "lion", emoji: "🦁" },
    ],
    sentences: ["The cat is black.", "A bird can fly.", "The fish lives in water.", "A cow gives us milk.", "The rabbit has long ears."],
    story: {
      title: "Max the Dog",
      text: "Max is a brown dog. He has big ears and a short tail. Max lives on a farm. He likes to run with the horses. Every morning he says hello to the cow. At night he sleeps next to the cat. Max is a happy dog.",
    },
  },
  {
    name: "Seasons and Weather",
    emoji: "🌦️",
    tile: "from-[#56CCF2] to-[#2F80ED]",
    words: [
      { word: "sun", emoji: "☀️" },
      { word: "rain", emoji: "🌧️" },
      { word: "snow", emoji: "❄️" },
      { word: "wind", emoji: "🌬️" },
      { word: "cloud", emoji: "☁️" },
      { word: "spring", emoji: "🌷" },
      { word: "summer", emoji: "🏖️" },
      { word: "winter", emoji: "⛄" },
    ],
    sentences: ["It is sunny today.", "It is cold in winter.", "I wear a coat when it rains.", "Flowers grow in spring.", "We swim in summer."],
    story: {
      title: "A Snowy Day",
      text: "It is winter. Look! It is snowing. Ali puts on his hat and his gloves. He goes outside with his sister. They make a big snowman. The snowman has a carrot nose. Then they drink hot tea. What a fun snowy day!",
    },
  },
  {
    name: "My House",
    emoji: "🏠",
    tile: "from-[#FFD166] to-[#F4A259]",
    words: [
      { word: "kitchen", emoji: "🍳" },
      { word: "bedroom", emoji: "🛏️" },
      { word: "bathroom", emoji: "🛁" },
      { word: "door", emoji: "🚪" },
      { word: "window", emoji: "🪟" },
      { word: "table", emoji: "🍽️" },
      { word: "sofa", emoji: "🛋️" },
      { word: "lamp", emoji: "💡" },
    ],
    sentences: ["My bed is in my bedroom.", "The cat is under the table.", "The lamp is on the desk.", "The sofa is next to the window.", "We cook in the kitchen."],
    story: {
      title: "Where Is Teddy?",
      text: "Lola cannot find her teddy. Is it under the bed? No. Is it on the sofa? No. Is it in the kitchen? No. Then she looks in the bathroom. There is Teddy, in the bath! ‘Silly Teddy,’ laughs Lola.",
    },
  },
  {
    name: "Clothes and Colours",
    emoji: "👕",
    tile: "from-[#FF6FB5] to-[#C850C0]",
    words: [
      { word: "shirt", emoji: "👕" },
      { word: "dress", emoji: "👗" },
      { word: "hat", emoji: "👒" },
      { word: "shoes", emoji: "👟" },
      { word: "socks", emoji: "🧦" },
      { word: "red", emoji: "🔴" },
      { word: "blue", emoji: "🔵" },
      { word: "green", emoji: "🟢" },
    ],
    sentences: ["My shirt is blue.", "She has a red dress.", "His shoes are black.", "I like my green hat.", "These socks are yellow."],
    story: {
      title: "The Party",
      text: "Today is Sara’s birthday party. Sara wears a pink dress and white shoes. Her friend Tim has a blue shirt and a funny green hat. Grandma has a long purple scarf. Everyone looks beautiful. They sing and dance all day.",
    },
  },
  {
    name: "My Best Friend",
    emoji: "🤝",
    tile: "from-[#2BC0A4] to-[#1F7A6B]",
    words: [
      { word: "friend", emoji: "🤝" },
      { word: "tall", emoji: "🦒" },
      { word: "short", emoji: "🐭" },
      { word: "happy", emoji: "😊" },
      { word: "kind", emoji: "💖" },
      { word: "funny", emoji: "😂" },
      { word: "hair", emoji: "💇" },
      { word: "eyes", emoji: "👀" },
    ],
    sentences: ["My best friend is Aziz.", "He is tall and funny.", "She has long black hair.", "We play together every day.", "My friend is very kind."],
    story: {
      title: "My Friend Lily",
      text: "My best friend is Lily. She is eight years old. She has brown eyes and short hair. Lily is kind and funny. We sit together at school. After school we ride our bikes. When I am sad, Lily makes me laugh.",
    },
  },
  {
    name: "A Short Story (Simple Narrative)",
    emoji: "📖",
    tile: "from-[#7B61FF] to-[#3E6FD8]",
    words: [
      { word: "once", emoji: "⏳" },
      { word: "forest", emoji: "🌲" },
      { word: "fox", emoji: "🦊" },
      { word: "lost", emoji: "❓" },
      { word: "help", emoji: "🆘" },
      { word: "home", emoji: "🏡" },
      { word: "then", emoji: "➡️" },
      { word: "end", emoji: "🏁" },
    ],
    sentences: ["Once there was a little fox.", "The fox lived in a forest.", "One day the fox was lost.", "A bird helped the fox.", "Then the fox went home."],
    story: {
      title: "The Little Lost Fox",
      text: "Once upon a time, there was a little fox. One day, he played too far from home. Now he was lost! He sat under a tree and cried. A kind bird saw him. ‘Follow me,’ said the bird. The bird flew and the fox ran. Soon he saw his mother. The little fox was home again.",
    },
  },
]
