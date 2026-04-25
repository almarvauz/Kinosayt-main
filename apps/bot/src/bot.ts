import { Telegraf, Markup, Context } from "telegraf";
import type { Update } from "telegraf/types";
import { message } from "telegraf/filters";
import {
  searchMovies,
  searchByCode,
  getTrending,
  getGenres,
  getMoviesByGenre,
  getMovieStats,
  buildMovieCaption,
  watchUrl,
  downloadUrl,
  setMovieCode,
  escHtml,
  getR2Config,
  setR2Config,
  getStorageStatus,
} from "./api";
import type { Lang } from "./api";
import type { MovieDto } from "@kinosayt/types";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const SUPER_ADMIN_IDS: number[] = (process.env.ADMIN_IDS ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);
const ADMIN_IDS: number[] = [...SUPER_ADMIN_IDS];

const bot: Telegraf<Context<Update>> = new Telegraf(TOKEN);

// ─── i18n ──────────────────────────────────────────────────────────────────

const t: Record<string, Record<Lang, string>> = {
  welcome: {
    uz: "Assalomu alaykum, <b>%name%</b>! 🎬\n\n<b>PlayKinoUz</b> — O'zbek tilida kinolar platformasi.\n\nQuyidagi tugmalardan foydalaning 👇",
    ru: "Привет, <b>%name%</b>! 🎬\n\n<b>PlayKinoUz</b> — Платформа с фильмами на узбекском языке.\n\nИспользуйте кнопки ниже 👇",
    en: "Hello, <b>%name%</b>! 🎬\n\n<b>PlayKinoUz</b> — Movies platform in Uzbek language.\n\nUse the buttons below 👇",
  },
  trending: { uz: "🔥 Trendlar", ru: "🔥 Тренды", en: "🔥 Trending" },
  search: { uz: "🔍 Kino qidirish", ru: "🔍 Поиск фильма", en: "🔍 Search movie" },
  genres: { uz: "🎬 Janrlar", ru: "🎬 Жанры", en: "🎬 Genres" },
  about: { uz: "ℹ️ Sayt haqida", ru: "ℹ️ О сайте", en: "ℹ️ About" },
  lang: { uz: "🌐 Til", ru: "🌐 Язык", en: "🌐 Language" },
  admin: { uz: "⚙️ Admin Panel", ru: "⚙️ Админ панель", en: "⚙️ Admin Panel" },
  backMenu: { uz: "🔙 Bosh menyu", ru: "🔙 Главное меню", en: "🔙 Main menu" },
  cancel: { uz: "❌ Bekor qilish", ru: "❌ Отмена", en: "❌ Cancel" },
  cancelled: { uz: "Bekor qilindi.", ru: "Отменено.", en: "Cancelled." },
  trendTitle: { uz: "🔥 Trendlar — Top 10", ru: "🔥 Тренды — Топ 10", en: "🔥 Trending — Top 10" },
  searchPrompt: {
    uz: "🔍 Qidirish turini tanlang:",
    ru: "🔍 Выберите тип поиска:",
    en: "🔍 Choose search type:",
  },
  searchByName: { uz: "🎬 Kino nomi bo'yicha", ru: "🎬 По названию", en: "🎬 By movie name" },
  searchByCode: { uz: "🔐 Kod bo'yicha", ru: "🔐 По коду", en: "🔐 By code" },
  searchNamePrompt: {
    uz: "🔍 Qidirmoqchi bo'lgan kino nomini yozing:",
    ru: "🔍 Напишите название фильма для поиска:",
    en: "🔍 Type the movie name to search:",
  },
  searchCodePrompt: {
    uz: "🔐 Kino kodini kiriting:",
    ru: "🔐 Введите код фильма:",
    en: "🔐 Enter the movie code:",
  },
  noResults: {
    uz: '❌ <b>"%q%"</b> bo\'yicha natija topilmadi.\n\nBoshqa nom bilan urinib ko\'ring.',
    ru: '❌ По запросу <b>"%q%"</b> ничего не найдено.\n\nПопробуйте другое название.',
    en: '❌ No results found for <b>"%q%"</b>.\n\nTry a different name.',
  },
  searchResult: {
    uz: '🔍 <b>"%q%"</b> — %total% ta kino (%page%/%pages%)',
    ru: '🔍 <b>"%q%"</b> — %total% фильмов (%page%/%pages%)',
    en: '🔍 <b>"%q%"</b> — %total% movies (%page%/%pages%)',
  },
  prev: { uz: "⬅️ Oldingi", ru: "⬅️ Назад", en: "⬅️ Previous" },
  next: { uz: "Keyingi ➡️", ru: "Далее ➡️", en: "Next ➡️" },
  page: { uz: "%p% / %t% sahifa", ru: "%p% / %t% стр.", en: "%p% / %t% page" },
  selectGenre: { uz: "🎬 <b>Janrni tanlang:</b>", ru: "🎬 <b>Выберите жанр:</b>", en: "🎬 <b>Select a genre:</b>" },
  genreResult: {
    uz: "🎭 <b>%name%</b> — %total% ta kino (%page%/%pages%)",
    ru: "🎭 <b>%name%</b> — %total% фильмов (%page%/%pages%)",
    en: "🎭 <b>%name%</b> — %total% movies (%page%/%pages%)",
  },
  noGenreMovies: { uz: "Bu janrda kino topilmadi.", ru: "В этом жанре фильмов нет.", en: "No movies in this genre." },
  watchBtn: { uz: "▶️ Tomosha qilish", ru: "▶️ Смотреть", en: "▶️ Watch" },
  downloadBtn: { uz: "📥 Yuklab olish", ru: "📥 Скачать", en: "📥 Download" },
  shareBtn: { uz: "📤 Ulashish", ru: "📤 Поделиться", en: "📤 Share" },
  error: {
    uz: "Xatolik yuz berdi. Keyinroq urinib ko'ring.",
    ru: "Произошла ошибка. Попробуйте позже.",
    en: "An error occurred. Please try again later.",
  },
  genreError: { uz: "Janrlarni yuklashda xatolik.", ru: "Ошибка загрузки жанров.", en: "Error loading genres." },
  aboutText: {
    uz: "ℹ️ <b>PlayKinoUz haqida</b>\n\n🎬 5500+ O'zbek tilida kinolar\n📱 Barcha qurilmalar uchun\n🆓 Bepul va reklamasiz\n\nBot orqali istagan kinoingizni toping va tomosha qiling!",
    ru: "ℹ️ <b>О PlayKinoUz</b>\n\n🎬 5500+ фильмов на узбекском языке\n📱 Для всех устройств\n🆓 Бесплатно и без рекламы\n\nИщите и смотрите фильмы прямо через бот!",
    en: "ℹ️ <b>About PlayKinoUz</b>\n\n🎬 5500+ movies in Uzbek language\n📱 For all devices\n🆓 Free and ad-free\n\nFind and watch movies right from this bot!",
  },
  langSelect: {
    uz: "🌐 Tilni tanlang:",
    ru: "🌐 Выберите язык:",
    en: "🌐 Select language:",
  },
  langSet: {
    uz: "✅ Til o'zbek tiliga o'zgartirildi.",
    ru: "✅ Язык изменён на русский.",
    en: "✅ Language changed to English.",
  },
  stats: { uz: "📊 Statistika", ru: "📊 Статистика", en: "📊 Statistics" },
  broadcast: { uz: "📢 Xabar yuborish", ru: "📢 Рассылка", en: "📢 Broadcast" },
  profilePic: { uz: "🖼 Profil rasmi", ru: "🖼 Фото профиля", en: "🖼 Profile photo" },
  changeBio: { uz: "📝 Bio o'zgartirish", ru: "📝 Изменить bio", en: "📝 Change bio" },
  shortBio: { uz: "📋 Qisqa bio", ru: "📋 Короткое bio", en: "📋 Short bio" },
  statsText: {
    uz: "📊 <b>Bot Statistikasi</b>\n\n🎬 Jami kinolar: <b>%movies%</b>\n🎭 Janrlar: <b>%genres%</b>\n👥 Bot foydalanuvchilari: <b>%users%</b>\n🕐 Vaqt: <b>%time%</b>",
    ru: "📊 <b>Статистика бота</b>\n\n🎬 Всего фильмов: <b>%movies%</b>\n🎭 Жанров: <b>%genres%</b>\n👥 Пользователей: <b>%users%</b>\n🕐 Время: <b>%time%</b>",
    en: "📊 <b>Bot Statistics</b>\n\n🎬 Total movies: <b>%movies%</b>\n🎭 Genres: <b>%genres%</b>\n👥 Users: <b>%users%</b>\n🕐 Time: <b>%time%</b>",
  },
  broadcastPrompt: {
    uz: "📢 Barcha %n% foydalanuvchiga yuboriladigan xabar matnini kiriting:",
    ru: "📢 Введите текст для рассылки %n% пользователям:",
    en: "📢 Enter broadcast message for %n% users:",
  },
  broadcastDone: {
    uz: "✅ Xabar yuborildi!\n📤 Yuborildi: %sent%\n❌ Xato: %fail%",
    ru: "✅ Рассылка завершена!\n📤 Отправлено: %sent%\n❌ Ошибки: %fail%",
    en: "✅ Broadcast done!\n📤 Sent: %sent%\n❌ Failed: %fail%",
  },
  photoPrompt: {
    uz: "🖼 Bot uchun yangi profil rasmini yuboring (rasm sifatida):",
    ru: "🖼 Отправьте новое фото профиля бота (как фото):",
    en: "🖼 Send a new profile photo for the bot (as photo):",
  },
  bioPrompt: {
    uz: "📝 Yangi bio matnini yozing (max 512 belgi):",
    ru: "📝 Напишите новый текст bio (макс. 512 символов):",
    en: "📝 Enter new bio text (max 512 chars):",
  },
  shortBioPrompt: {
    uz: "📋 Qisqa bio matnini yozing (max 120 belgi):",
    ru: "📋 Напишите короткое bio (макс. 120 символов):",
    en: "📋 Enter short bio text (max 120 chars):",
  },
  bioUpdated: { uz: "✅ Bot bio muvaffaqiyatli yangilandi!", ru: "✅ Bio бота обновлено!", en: "✅ Bot bio updated!" },
  shortBioUpdated: { uz: "✅ Qisqa bio muvaffaqiyatli yangilandi!", ru: "✅ Короткое bio обновлено!", en: "✅ Short bio updated!" },
  photoUpdated: { uz: "✅ Bot profil rasmi muvaffaqiyatli o'zgartirildi!", ru: "✅ Фото профиля бота обновлено!", en: "✅ Bot profile photo updated!" },
  statsError: { uz: "Statistikani olishda xatolik.", ru: "Ошибка получения статистики.", en: "Error fetching statistics." },
  addAdmin: { uz: "➕ Admin qo'shish", ru: "➕ Добавить админа", en: "➕ Add admin" },
  addAdminPrompt: {
    uz: "👤 Yangi admin qo'shish uchun foydalanuvchi ID sini yuboring yoki u yuborgan xabarni forward qiling:",
    ru: "👤 Отправьте ID пользователя или перешлите его сообщение:",
    en: "👤 Send user ID or forward a message from the user:",
  },
  adminAdded: { uz: "✅ Admin muvaffaqiyatli qo'shildi! ID: <b>%id%</b>", ru: "✅ Админ добавлен! ID: <b>%id%</b>", en: "✅ Admin added! ID: <b>%id%</b>" },
  adminExists: { uz: "⚠️ Bu foydalanuvchi allaqachon admin.", ru: "⚠️ Этот пользователь уже админ.", en: "⚠️ This user is already an admin." },
  adminRemoved: { uz: "✅ Admin o'chirildi! ID: <b>%id%</b>", ru: "✅ Админ удалён! ID: <b>%id%</b>", en: "✅ Admin removed! ID: <b>%id%</b>" },
  adminNotFound: { uz: "⚠️ Bu foydalanuvchi adminlar ro'yxatida yo'q.", ru: "⚠️ Этот пользователь не в списке админов.", en: "⚠️ This user is not an admin." },
  invalidId: { uz: "❌ Noto'g'ri ID. Raqam yuboring yoki xabar forward qiling.", ru: "❌ Неверный ID. Отправьте число или перешлите сообщение.", en: "❌ Invalid ID. Send a number or forward a message." },
  adminList: { uz: "👥 Adminlar ro'yxati", ru: "👥 Список админов", en: "👥 Admin list" },
  setCode: { uz: "🔐 Kod qo'yish", ru: "🔐 Установить код", en: "🔐 Set code" },
  r2Settings: { uz: "☁️ R2 Xotira sozlash", ru: "☁️ Настройка R2", en: "☁️ R2 Storage settings" },
  r2Status: { uz: "📡 R2 Holati", ru: "📡 Статус R2", en: "📡 R2 Status" },
  setCodeSearchPrompt: {
    uz: "🔍 Kod qo'ymoqchi bo'lgan kino nomini yozing:",
    ru: "🔍 Напишите название фильма для установки кода:",
    en: "🔍 Enter the movie name to set a code for:",
  },
  setCodePrompt: {
    uz: "🔐 <b>%title%</b> uchun kodni kiriting.\n\nHozirgi kod: %current%\n\nKodni o'chirish uchun <code>0</code> yuboring:",
    ru: "🔐 Введите код для <b>%title%</b>.\n\nТекущий код: %current%\n\nДля удаления кода отправьте <code>0</code>:",
    en: "🔐 Enter code for <b>%title%</b>.\n\nCurrent code: %current%\n\nSend <code>0</code> to remove code:",
  },
  codeSet: { uz: "✅ <b>%title%</b> uchun kod o'rnatildi: <code>%code%</code>", ru: "✅ Код для <b>%title%</b> установлен: <code>%code%</code>", en: "✅ Code set for <b>%title%</b>: <code>%code%</code>" },
  codeRemoved: { uz: "✅ <b>%title%</b> dan kod o'chirildi.", ru: "✅ Код удалён для <b>%title%</b>.", en: "✅ Code removed from <b>%title%</b>." },
};

function i(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  let text = t[key]?.[lang] ?? t[key]?.uz ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`%${k}%`, String(v));
    }
  }
  return text;
}

// ─── User state tracking ───────────────────────────────────────────────────

type UserState =
  | "idle"
  | "searching"
  | "searching_code"
  | "admin_photo"
  | "admin_broadcast"
  | "admin_set_bio"
  | "admin_set_short_bio"
  | "admin_add_admin"
  | "admin_code_search"
  | "admin_code_enter"
  | "admin_r2_endpoint"
  | "admin_r2_access_key"
  | "admin_r2_secret_key"
  | "admin_r2_bucket";

const userStates = new Map<number, UserState>();
const userLangs = new Map<number, Lang>();
const knownUsers = new Set<number>();
const codeTargetSlug = new Map<number, string>();

// Persist knownUsers to disk so they survive restarts
const USERS_FILE = new URL("../../data/users.json", import.meta.url).pathname;

function loadUsers() {
  try {
    const data = require("fs").readFileSync(USERS_FILE, "utf-8");
    const ids: number[] = JSON.parse(data);
    for (const id of ids) knownUsers.add(id);
  } catch {}
}

function saveUsers() {
  try {
    const dir = require("path").dirname(USERS_FILE);
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(USERS_FILE, JSON.stringify([...knownUsers]));
  } catch {}
}

function trackUser(uid: number) {
  const had = knownUsers.has(uid);
  knownUsers.add(uid);
  if (!had) saveUsers();
}

loadUsers();

function getState(uid: number): UserState {
  return userStates.get(uid) ?? "idle";
}
function setState(uid: number, state: UserState) {
  userStates.set(uid, state);
}
function getLang(uid: number): Lang {
  return userLangs.get(uid) ?? "uz";
}
function setLang(uid: number, lang: Lang) {
  userLangs.set(uid, lang);
}
function isAdmin(uid: number): boolean {
  return ADMIN_IDS.includes(uid);
}
function isSuperAdmin(uid: number): boolean {
  return SUPER_ADMIN_IDS.includes(uid);
}

// ─── Keyboards ─────────────────────────────────────────────────────────────

function mainKeyboard(uid: number) {
  const lang = getLang(uid);
  const rows = [
    [Markup.button.text(i("trending", lang)), Markup.button.text(i("search", lang))],
    [Markup.button.text(i("genres", lang)), Markup.button.text(i("about", lang))],
    [Markup.button.text(i("lang", lang))],
  ];
  if (isAdmin(uid)) rows.push([Markup.button.text(i("admin", lang))]);
  return Markup.keyboard(rows).resize();
}

function adminKeyboard(uid: number) {
  const lang = getLang(uid);
  const rows = [
    [Markup.button.text(i("stats", lang)), Markup.button.text(i("broadcast", lang))],
    [Markup.button.text(i("profilePic", lang)), Markup.button.text(i("changeBio", lang))],
    [Markup.button.text(i("shortBio", lang)), Markup.button.text(i("setCode", lang))],
  ];
  if (isSuperAdmin(uid)) {
    rows.push([Markup.button.text(i("addAdmin", lang)), Markup.button.text(i("r2Settings", lang))]);
    rows.push([Markup.button.text(i("r2Status", lang))]);
  }
  rows.push([Markup.button.text(i("backMenu", lang))]);
  return Markup.keyboard(rows).resize();
}

function cancelKeyboard(uid: number) {
  const lang = getLang(uid);
  return Markup.keyboard([[Markup.button.text(i("cancel", lang))]]).resize();
}

function searchKeyboard(uid: number) {
  const lang = getLang(uid);
  return Markup.keyboard([
    [Markup.button.text(i("searchByName", lang)), Markup.button.text(i("searchByCode", lang))],
    [Markup.button.text(i("cancel", lang))],
  ]).resize();
}

// Helper to match button text against all languages
function matchBtn(text: string, key: string): boolean {
  return text === t[key]?.uz || text === t[key]?.ru || text === t[key]?.en;
}

// ─── /myid ─────────────────────────────────────────────────────────────────

bot.command("myid", (ctx) =>
  ctx.reply(`Your Telegram ID: <code>${ctx.from.id}</code>`, { parse_mode: "HTML" })
);

// ─── /start ────────────────────────────────────────────────────────────────

bot.start(async (ctx) => {
  const uid = ctx.from.id;
  trackUser(uid);
  setState(uid, "idle");
  const lang = getLang(uid);
  await ctx.reply(
    i("welcome", lang, { name: escHtml(ctx.from.first_name) }),
    { parse_mode: "HTML", ...mainKeyboard(uid) }
  );
});

// ─── /lang command ─────────────────────────────────────────────────────────

bot.command("lang", async (ctx) => {
  await showLangPicker(ctx);
});

// ─── Text messages ─────────────────────────────────────────────────────────

bot.on(message("text"), async (ctx) => {
  const uid = ctx.from.id;
  const text = ctx.message.text.trim();
  trackUser(uid);
  const state = getState(uid);
  const lang = getLang(uid);

  // ── Cancel from any state ──
  if (matchBtn(text, "cancel")) {
    setState(uid, "idle");
    await ctx.reply(i("cancelled", lang), mainKeyboard(uid));
    return;
  }

  // ── Admin state handlers ──
  if (state === "admin_set_bio" && isAdmin(uid)) {
    setState(uid, "idle");
    try {
      await (ctx.telegram as any).setMyDescription({ description: text });
      await ctx.reply(i("bioUpdated", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
    } catch (e) {
      await ctx.reply(`❌ ${escHtml(String(e))}`, { parse_mode: "HTML", ...adminKeyboard(uid) });
    }
    return;
  }

  if (state === "admin_set_short_bio" && isAdmin(uid)) {
    setState(uid, "idle");
    try {
      await (ctx.telegram as any).setMyShortDescription({ short_description: text });
      await ctx.reply(i("shortBioUpdated", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
    } catch (e) {
      await ctx.reply(`❌ ${escHtml(String(e))}`, { parse_mode: "HTML", ...adminKeyboard(uid) });
    }
    return;
  }

  if (state === "admin_add_admin" && isAdmin(uid)) {
    setState(uid, "idle");
    const newId = parseInt(text.trim());
    if (!newId || isNaN(newId)) {
      await ctx.reply(i("invalidId", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
      return;
    }
    if (ADMIN_IDS.includes(newId)) {
      await ctx.reply(i("adminExists", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
      return;
    }
    ADMIN_IDS.push(newId);
    await ctx.reply(i("adminAdded", lang, { id: newId }), { parse_mode: "HTML", ...adminKeyboard(uid) });
    return;
  }

  if (state === "admin_code_search" && isAdmin(uid)) {
    setState(uid, "idle");
    try {
      const { movies } = await searchMovies(text, 1);
      if (movies.length === 0) {
        await ctx.reply(i("noResults", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
        return;
      }
      const buttons = movies.map((m) => [
        Markup.button.callback(
          `${m.title} (${m.year})`,
          `setcode:${m.slug}`
        ),
      ]);
      buttons.push([Markup.button.callback(i("cancel", lang), "setcode:cancel")]);
      await ctx.reply(
        `🔍 <b>${escHtml(text)}</b> — kinoni tanlang:`,
        { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) }
      );
    } catch {
      await ctx.reply("❌ Qidirishda xatolik.", { ...adminKeyboard(uid) });
    }
    return;
  }

  if (state === "admin_code_enter" && isAdmin(uid)) {
    setState(uid, "idle");
    const slug = codeTargetSlug.get(uid);
    codeTargetSlug.delete(uid);
    if (!slug) {
      await ctx.reply("❌ Kino tanlanmagan.", { ...adminKeyboard(uid) });
      return;
    }
    try {
      const code = text.trim();
      if (code === "0") {
        const movie = await setMovieCode(slug, null);
        await ctx.reply(i("codeRemoved", lang, { title: movie.title }), { parse_mode: "HTML", ...adminKeyboard(uid) });
      } else {
        const movie = await setMovieCode(slug, code);
        await ctx.reply(i("codeSet", lang, { title: movie.title, code }), { parse_mode: "HTML", ...adminKeyboard(uid) });
      }
    } catch (e) {
      await ctx.reply(`❌ ${escHtml(String(e))}`, { parse_mode: "HTML", ...adminKeyboard(uid) });
    }
    return;
  }

  if (state === "admin_broadcast" && isAdmin(uid)) {
    setState(uid, "idle");
    let sent = 0;
    let failed = 0;
    for (const targetUid of knownUsers) {
      if (targetUid === uid) continue;
      try {
        await ctx.telegram.sendMessage(targetUid, `📢 <b>PlayKinoUz:</b>\n\n${escHtml(text)}`, {
          parse_mode: "HTML",
        });
        sent++;
      } catch {
        failed++;
      }
    }
    await ctx.reply(i("broadcastDone", lang, { sent, fail: failed }), { parse_mode: "HTML", ...adminKeyboard(uid) });
    return;
  }

  // ── R2 state handlers (super admin only) ──
  if (state === "admin_r2_endpoint" && isSuperAdmin(uid)) {
    setState(uid, "admin_r2_access_key");
    await ctx.reply(
      `✅ Endpoint saqlandi.\n\n🔑 <b>Access Key ID</b> ni yuboring:`,
      { parse_mode: "HTML", ...cancelKeyboard(uid) }
    );
    // Store endpoint temporarily
    (ctx as any).session_r2 = (ctx as any).session_r2 || {};
    (global as any)[`r2_${uid}_endpoint`] = text.trim();
    return;
  }

  if (state === "admin_r2_access_key" && isSuperAdmin(uid)) {
    setState(uid, "admin_r2_secret_key");
    (global as any)[`r2_${uid}_accessKey`] = text.trim();
    await ctx.reply(
      `✅ Access Key ID saqlandi.\n\n🔒 <b>Secret Access Key</b> ni yuboring:`,
      { parse_mode: "HTML", ...cancelKeyboard(uid) }
    );
    return;
  }

  if (state === "admin_r2_secret_key" && isSuperAdmin(uid)) {
    setState(uid, "admin_r2_bucket");
    (global as any)[`r2_${uid}_secretKey`] = text.trim();
    await ctx.reply(
      `✅ Secret Key saqlandi.\n\n🪣 <b>Bucket nomi</b> ni yuboring (default: kinosayt):`,
      { parse_mode: "HTML", ...cancelKeyboard(uid) }
    );
    return;
  }

  if (state === "admin_r2_bucket" && isSuperAdmin(uid)) {
    setState(uid, "idle");
    const endpoint   = (global as any)[`r2_${uid}_endpoint`];
    const accessKeyId = (global as any)[`r2_${uid}_accessKey`];
    const secretAccessKey = (global as any)[`r2_${uid}_secretKey`];
    const bucketName = text.trim() || "kinosayt";
    // Clean up
    delete (global as any)[`r2_${uid}_endpoint`];
    delete (global as any)[`r2_${uid}_accessKey`];
    delete (global as any)[`r2_${uid}_secretKey`];
    try {
      await setR2Config({ endpoint, accessKeyId, secretAccessKey, bucketName });
      await ctx.reply(
        `✅ <b>Cloudflare R2 konfiguratsiyasi muvaffaqiyatli saqlandi!</b>\n\n` +
        `📦 Bucket: <code>${escHtml(bucketName)}</code>\n` +
        `🌐 Endpoint: <code>${escHtml(endpoint.slice(0, 30))}...</code>\n\n` +
        `Keyingi so'rovdan boshlab yangi sozlamalar ishga tushadi.`,
        { parse_mode: "HTML", ...adminKeyboard(uid) }
      );
    } catch (e) {
      await ctx.reply(`❌ Xatolik: ${escHtml(String(e))}`, { parse_mode: "HTML", ...adminKeyboard(uid) });
    }
    return;
  }

  // ── Search state ──
  if (state === "searching") {
    setState(uid, "idle");
    await handleSearch(ctx, text, 1);
    return;
  }

  if (state === "searching_code") {
    setState(uid, "idle");
    await handleCodeSearch(ctx, text, 1);
    return;
  }

  // ── Menu buttons (match all languages) ──
  if (matchBtn(text, "trending")) {
    await handleTrending(ctx);
    return;
  }
  if (matchBtn(text, "search")) {
    await ctx.reply(i("searchPrompt", lang), searchKeyboard(uid));
    return;
  }
  if (matchBtn(text, "searchByName")) {
    setState(uid, "searching");
    await ctx.reply(i("searchNamePrompt", lang), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "searchByCode")) {
    setState(uid, "searching_code");
    await ctx.reply(i("searchCodePrompt", lang), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "genres")) {
    await handleGenresMenu(ctx);
    return;
  }
  if (matchBtn(text, "about")) {
    await ctx.reply(i("aboutText", lang), { parse_mode: "HTML", ...mainKeyboard(uid) });
    return;
  }
  if (matchBtn(text, "lang")) {
    await showLangPicker(ctx);
    return;
  }
  if (matchBtn(text, "admin") && isAdmin(uid)) {
    await ctx.reply(`⚙️ <b>Admin Panel</b>`, { parse_mode: "HTML", ...adminKeyboard(uid) });
    return;
  }
  if (matchBtn(text, "stats") && isAdmin(uid)) {
    await handleStats(ctx);
    return;
  }
  if (matchBtn(text, "broadcast") && isAdmin(uid)) {
    setState(uid, "admin_broadcast");
    await ctx.reply(i("broadcastPrompt", lang, { n: knownUsers.size }), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "profilePic") && isAdmin(uid)) {
    setState(uid, "admin_photo");
    await ctx.reply(i("photoPrompt", lang), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "changeBio") && isAdmin(uid)) {
    setState(uid, "admin_set_bio");
    await ctx.reply(i("bioPrompt", lang), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "shortBio") && isAdmin(uid)) {
    setState(uid, "admin_set_short_bio");
    await ctx.reply(i("shortBioPrompt", lang), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "setCode") && isAdmin(uid)) {
    setState(uid, "admin_code_search");
    await ctx.reply(i("setCodeSearchPrompt", lang), cancelKeyboard(uid));
    return;
  }
  if (matchBtn(text, "addAdmin") && isSuperAdmin(uid)) {
    setState(uid, "admin_add_admin");
    // Show current admins list
    const list = ADMIN_IDS.map((id) => `${SUPER_ADMIN_IDS.includes(id) ? "👑" : "•"} <code>${id}</code>`).join("\n");
    await ctx.reply(
      `${i("adminList", lang)}:\n${list}\n\n${i("addAdminPrompt", lang)}`,
      { parse_mode: "HTML", ...cancelKeyboard(uid) }
    );
    return;
  }
  if (matchBtn(text, "r2Settings") && isSuperAdmin(uid)) {
    setState(uid, "admin_r2_endpoint");
    await ctx.reply(
      `☁️ <b>Cloudflare R2 sozlash</b>\n\nQuyidagi ma'lumotlarni ketma-ket kiritasiz:\n1. Endpoint URL\n2. Access Key ID\n3. Secret Access Key\n4. Bucket nomi\n\n🌐 <b>Endpoint URL</b> ni yuboring:\n<i>(masalan: https://abc123.r2.cloudflarestorage.com)</i>`,
      { parse_mode: "HTML", ...cancelKeyboard(uid) }
    );
    return;
  }
  if (matchBtn(text, "r2Status") && isSuperAdmin(uid)) {
    try {
      const [status, config] = await Promise.all([getStorageStatus(), getR2Config()]);
      const configuredText = status.configured
        ? "✅ <b>Faol (ishlayapti)</b>"
        : "❌ <b>Sozlanmagan</b>";
      const endpointText = config.endpoint ? `\n🌐 Endpoint: <code>${escHtml(config.endpoint)}</code>` : "";
      const bucketText = config.bucketName ? `\n🪣 Bucket: <code>${escHtml(config.bucketName)}</code>` : "";
      const keyText = config.accessKeyId ? `\n🔑 Access Key: <code>${escHtml(config.accessKeyId)}</code>` : "";
      await ctx.reply(
        `📡 <b>Cloudflare R2 holati</b>\n\n${configuredText}${endpointText}${bucketText}${keyText}`,
        { parse_mode: "HTML", ...adminKeyboard(uid) }
      );
    } catch (e) {
      await ctx.reply(`❌ Holat tekshirishda xatolik: ${escHtml(String(e))}`, { parse_mode: "HTML", ...adminKeyboard(uid) });
    }
    return;
  }
  if (matchBtn(text, "backMenu")) {
    setState(uid, "idle");
    await ctx.reply("🏠", mainKeyboard(uid));
    return;
  }

  // Any other text → search
  await handleSearch(ctx, text, 1);
});

// ─── Photo handler (admin profile photo) ───────────────────────────────────

bot.on(message("photo"), async (ctx) => {
  const uid = ctx.from.id;
  const lang = getLang(uid);
  trackUser(uid);
  if (!isAdmin(uid) || getState(uid) !== "admin_photo") return;
  setState(uid, "idle");

  try {
    const photo = ctx.message.photo.at(-1)!;
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    await ctx.telegram.callApi("setMyPhoto" as any, {
      photo: { source: buffer, filename: "photo.jpg" },
    } as any);
    await ctx.reply(i("photoUpdated", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
  } catch (e) {
    await ctx.reply(`❌ ${escHtml(String(e))}`, { parse_mode: "HTML", ...adminKeyboard(uid) });
  }
});

// ─── Callback queries (inline keyboards) ───────────────────────────────────

bot.on("callback_query", async (ctx) => {
  const data = (ctx.callbackQuery as { data?: string }).data;
  if (!data) return;
  await ctx.answerCbQuery();

  // language selection: lang:uz / lang:ru / lang:en
  const langMatch = data.match(/^lang:(uz|ru|en)$/);
  if (langMatch) {
    const uid = ctx.from.id;
    const newLang = langMatch[1] as Lang;
    setLang(uid, newLang);
    await ctx.reply(i("langSet", newLang), { parse_mode: "HTML", ...mainKeyboard(uid) });
    return;
  }

  // search pagination: search:<query>:<page>
  const searchMatch = data.match(/^search:(.+):(\d+)$/);
  if (searchMatch) {
    await handleSearch(ctx, searchMatch[1], parseInt(searchMatch[2]));
    return;
  }

  // code search pagination: codesearch:<code>:<page>
  const codeSearchMatch = data.match(/^codesearch:(.+):(\d+)$/);
  if (codeSearchMatch) {
    await handleCodeSearch(ctx, codeSearchMatch[1], parseInt(codeSearchMatch[2]));
    return;
  }

  // genre: genre:<slug>:<page>
  const genreMatch = data.match(/^genre:([^:]+):(\d+)$/);
  if (genreMatch) {
    await handleGenreMovies(ctx, genreMatch[1], parseInt(genreMatch[2]));
    return;
  }

  // genre list page: genres:<page>
  const genrePageMatch = data.match(/^genres:(\d+)$/);
  if (genrePageMatch) {
    await handleGenresMenu(ctx, parseInt(genrePageMatch[1]));
    return;
  }

  // set code for movie: setcode:<slug>
  const codeMatch = data.match(/^setcode:(.+)$/);
  if (codeMatch) {
    const uid = ctx.from.id;
    const lang = getLang(uid);
    if (!isAdmin(uid)) return;

    if (codeMatch[1] === "cancel") {
      setState(uid, "idle");
      await ctx.reply(i("cancelled", lang), { ...adminKeyboard(uid) });
      return;
    }

    const slug = codeMatch[1];
    codeTargetSlug.set(uid, slug);
    setState(uid, "admin_code_enter");

    try {
      const { movies } = await searchMovies(slug, 1);
      const movie = movies.find((m) => m.slug === slug);
      const title = movie?.title ?? slug;
      await ctx.reply(
        i("setCodePrompt", lang, { title, current: "—" }),
        { parse_mode: "HTML", ...cancelKeyboard(uid) }
      );
    } catch {
      await ctx.reply(
        i("setCodePrompt", lang, { title: slug, current: "❌ yo'q" }),
        { parse_mode: "HTML", ...cancelKeyboard(uid) }
      );
    }
    return;
  }
});

// ─── Inline query ───────────────────────────────────────────────────────────

bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query.trim();
  if (!query || query.length < 2) {
    return ctx.answerInlineQuery([], { cache_time: 5 });
  }
  try {
    const { movies } = await searchMovies(query, 1);
    const results = movies.map((movie) => ({
      type: "photo" as const,
      id: String(movie.id),
      photo_url: movie.posterUrl,
      thumbnail_url: movie.posterUrl,
      title: movie.title,
      description: `${movie.year} | ${movie.genres.map((g) => g.name).join(", ")}`,
      caption: buildMovieCaption(movie, "uz"),
      parse_mode: "HTML" as const,
      reply_markup: {
        inline_keyboard: [
          [{ text: "▶️ Tomosha qilish", url: watchUrl(movie.slug) }],
          [{ text: "📥 Yuklab olish", url: downloadUrl(movie.slug) }],
        ],
      },
    }));
    await ctx.answerInlineQuery(results, { cache_time: 30 });
  } catch {
    await ctx.answerInlineQuery([], { cache_time: 5 });
  }
});

// ─── Handlers ──────────────────────────────────────────────────────────────

async function showLangPicker(ctx: Context) {
  await ctx.reply("🌐", {
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇿 O'zbek", "lang:uz"),
        Markup.button.callback("🇷🇺 Русский", "lang:ru"),
        Markup.button.callback("🇬🇧 English", "lang:en"),
      ],
    ]),
  });
}

async function handleTrending(ctx: Context) {
  const uid = ctx.from!.id;
  const lang = getLang(uid);
  try {
    const movies = await getTrending();
    await ctx.reply(i("trendTitle", lang), { parse_mode: "HTML" });
    for (const movie of movies.slice(0, 10)) {
      await sendMovieCard(ctx, movie, lang);
    }
  } catch (e) {
    console.error("Trending error:", e);
    await ctx.reply(i("error", lang));
  }
}

async function handleSearch(ctx: Context, query: string, page: number) {
  const uid = (ctx.from ?? (ctx as any).callbackQuery?.from)?.id;
  const lang = getLang(uid);
  try {
    const { movies, total } = await searchMovies(query, page);
    const totalPages = Math.ceil(total / 5);

    if (movies.length === 0) {
      await ctx.reply(i("noResults", lang, { q: escHtml(query) }), { parse_mode: "HTML" });
      return;
    }

    await ctx.reply(
      i("searchResult", lang, { q: escHtml(query), total, page, pages: totalPages }),
      { parse_mode: "HTML" }
    );

    for (const movie of movies) {
      await sendMovieCard(ctx, movie, lang);
    }

    if (totalPages > 1) {
      const nav = [];
      if (page > 1) nav.push(Markup.button.callback(i("prev", lang), `search:${query}:${page - 1}`));
      if (page < totalPages) nav.push(Markup.button.callback(i("next", lang), `search:${query}:${page + 1}`));
      if (nav.length) {
        await ctx.reply(
          i("page", lang, { p: page, t: totalPages }),
          Markup.inlineKeyboard([nav])
        );
      }
    }
  } catch (e) {
    console.error("Search error:", e);
    await ctx.reply(i("error", lang));
  }
}

async function handleCodeSearch(ctx: Context, code: string, page: number) {
  const uid = (ctx.from ?? (ctx as any).callbackQuery?.from)?.id;
  const lang = getLang(uid);
  try {
    const { movies, total } = await searchByCode(code, page);
    const totalPages = Math.ceil(total / 5);

    if (movies.length === 0) {
      const noCodeResults: Record<Lang, string> = {
        uz: `❌ <b>"${escHtml(code)}"</b> kodiga mos kino topilmadi.`,
        ru: `❌ Фильмы с кодом <b>"${escHtml(code)}"</b> не найдены.`,
        en: `❌ No movies found with code <b>"${escHtml(code)}"</b>.`,
      };
      await ctx.reply(noCodeResults[lang], { parse_mode: "HTML", ...mainKeyboard(uid) });
      return;
    }

    const codeResultText: Record<Lang, string> = {
      uz: `🔐 <b>"${escHtml(code)}"</b> kodi — ${total} ta kino (${page}/${totalPages})`,
      ru: `🔐 Код <b>"${escHtml(code)}"</b> — ${total} фильмов (${page}/${totalPages})`,
      en: `🔐 Code <b>"${escHtml(code)}"</b> — ${total} movies (${page}/${totalPages})`,
    };

    await ctx.reply(codeResultText[lang], { parse_mode: "HTML" });

    for (const movie of movies) {
      await sendMovieCard(ctx, movie, lang);
    }

    if (totalPages > 1) {
      const nav = [];
      if (page > 1) nav.push(Markup.button.callback(i("prev", lang), `codesearch:${code}:${page - 1}`));
      if (page < totalPages) nav.push(Markup.button.callback(i("next", lang), `codesearch:${code}:${page + 1}`));
      if (nav.length) {
        await ctx.reply(
          i("page", lang, { p: page, t: totalPages }),
          Markup.inlineKeyboard([nav])
        );
      }
    }
  } catch (e) {
    console.error("Code search error:", e);
    await ctx.reply(i("error", lang));
  }
}

async function handleGenresMenu(ctx: Context, page = 1) {
  const uid = ctx.from!.id;
  const lang = getLang(uid);
  try {
    const genres = await getGenres();
    const perPage = 8;
    const totalPages = Math.ceil(genres.length / perPage);
    const slice = genres.slice((page - 1) * perPage, page * perPage);

    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < slice.length; i += 2) {
      const row = [Markup.button.callback(`🎭 ${slice[i].name}`, `genre:${slice[i].slug}:1`)];
      if (slice[i + 1]) row.push(Markup.button.callback(`🎭 ${slice[i + 1].name}`, `genre:${slice[i + 1].slug}:1`));
      rows.push(row);
    }
    const nav: ReturnType<typeof Markup.button.callback>[] = [];
    if (page > 1) nav.push(Markup.button.callback("⬅️", `genres:${page - 1}`));
    if (page < totalPages) nav.push(Markup.button.callback("➡️", `genres:${page + 1}`));
    if (nav.length) rows.push(nav);

    await ctx.reply(i("selectGenre", lang), {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(rows),
    });
  } catch (e) {
    console.error("Genres error:", e);
    await ctx.reply(i("genreError", lang));
  }
}

async function handleGenreMovies(ctx: Context, genreSlug: string, page: number) {
  const uid = ctx.from!.id;
  const lang = getLang(uid);
  try {
    const { movies, total, name } = await getMoviesByGenre(genreSlug, page);
    const totalPages = Math.ceil(total / 5);

    if (movies.length === 0) {
      await ctx.reply(i("noGenreMovies", lang));
      return;
    }

    await ctx.reply(
      i("genreResult", lang, { name: escHtml(name), total, page, pages: totalPages }),
      { parse_mode: "HTML" }
    );

    for (const movie of movies) {
      await sendMovieCard(ctx, movie, lang);
    }

    if (totalPages > 1) {
      const nav = [];
      if (page > 1) nav.push(Markup.button.callback(i("prev", lang), `genre:${genreSlug}:${page - 1}`));
      if (page < totalPages) nav.push(Markup.button.callback(i("next", lang), `genre:${genreSlug}:${page + 1}`));
      if (nav.length) {
        await ctx.reply(
          i("page", lang, { p: page, t: totalPages }),
          Markup.inlineKeyboard([nav])
        );
      }
    }
  } catch (e) {
    console.error("Genre movies error:", e);
    await ctx.reply(i("error", lang));
  }
}

async function handleStats(ctx: Context) {
  const uid = ctx.from!.id;
  const lang = getLang(uid);
  try {
    const stats = await getMovieStats();
    await ctx.reply(
      i("statsText", lang, {
        movies: stats.totalMovies,
        genres: stats.totalGenres,
        users: knownUsers.size,
        time: new Date().toLocaleString("uz-UZ"),
      }),
      { parse_mode: "HTML", ...adminKeyboard(uid) }
    );
  } catch {
    await ctx.reply(i("statsError", lang), { parse_mode: "HTML", ...adminKeyboard(uid) });
  }
}

async function sendMovieCard(ctx: Context, movie: MovieDto, lang: Lang) {
  const caption = buildMovieCaption(movie, lang);

  const siteUrl = watchUrl(movie.slug);
  const buttons: ReturnType<typeof Markup.button.url>[][] = [
    [Markup.button.url(i("watchBtn", lang), siteUrl)],
    [Markup.button.url(i("downloadBtn", lang), downloadUrl(movie.slug))],
  ];
  const keyboard = Markup.inlineKeyboard(buttons);

  try {
    await ctx.replyWithPhoto(movie.posterUrl, {
      caption,
      parse_mode: "HTML",
      ...keyboard,
    });
  } catch (e) {
    // Fallback: text message with video link
    console.error("Photo send error for", movie.slug, e);
    try {
      await ctx.reply(
        caption + `\n\n<a href="${escHtml(siteUrl)}">${i("watchBtn", lang)}</a>`,
        { parse_mode: "HTML" }
      );
    } catch (e2) {
      console.error("Text fallback also failed:", e2);
    }
  }
}

export { bot };

