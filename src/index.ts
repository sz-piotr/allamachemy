import ollama from "ollama";
import { createInterface } from "readline/promises";

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const obtained = [
    { concept: "water", emoji: "💧" },
    { concept: "fire", emoji: "🔥" },
    { concept: "earth", emoji: "🪨" },
    { concept: "air", emoji: "💨" },
  ];
  const known = new Set(obtained.map((x) => x.concept));

  console.log(
    'Welcome to Alchemy! Type "/exit" to exit, "/list" to list your known items.'
  );
  console.log("You start with:");
  for (const item of obtained) {
    console.log(item.emoji, capitalize(item.concept));
  }
  console.log("You can combine two items with +. Try now with: water + fire");

  outer: while (true) {
    const query = await readline.question("> ");
    if (query === "/exit") {
      break;
    }
    if (query === "/list") {
      for (const item of obtained) {
        console.log(item.emoji, capitalize(item.concept));
      }
      continue;
    }
    const items = query.split("+").map((x) => x.trim());
    if (items.length !== 2) {
      console.log("Please enter two items separated by a +");
      continue;
    }
    for (const item of items) {
      if (!known.has(item)) {
        console.log(`You don't have ${item} yet`);
        continue outer;
      }
    }

    const conceptResponse = await ollama.generate({
      model: "llama2:13b",
      system:
        "You are the game alchemy. You only respond with a single thing or a concept.",
      prompt: `Combine ${items[0]} and ${items[1]}`,
      stream: false,
    });
    const concept = conceptResponse.response
      .trim()
      .toLowerCase()
      .replaceAll(/["'\.]/g, "");
    if (concept.length > 50) {
      console.log(`Response too long (${concept.length}):`, concept);
      continue;
    }

    if (known.has(concept)) {
      const emoji = obtained.find((x) => x.concept === concept)!.emoji;
      console.log(emoji, capitalize(concept));
      continue;
    }

    const emojiResponse = await ollama.generate({
      model: "llama2:13b",
      system:
        "You can only respond with emojis. Choose the emoji that best represents the concept.",
      prompt: concept,
      stream: false,
    });
    const emoji = emojiResponse.response.trim();
    if (emoji.length > 10) {
      console.log(`Response too long (${emoji.length}):`, emoji);
      continue;
    }

    console.log(emoji, capitalize(concept));
    obtained.push({ concept, emoji });
    known.add(concept);
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
