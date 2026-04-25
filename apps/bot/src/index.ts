import { bot } from "./bot";

async function main() {
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  await bot.launch({
    allowedUpdates: ["message", "callback_query", "inline_query"],
  });

  console.log("Kinosayt bot started");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main();
