export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

const dict = {
  // Navbar
  "nav.movies": { uz: "Kinolar", ru: "Фильмы", en: "Movies" },
  "nav.search": { uz: "Kino qidirish...", ru: "Поиск фильмов...", en: "Search movies..." },

  // Footer
  "footer.disclaimer": {
    uz: "Saytdagi barcha ma'lumotlar faqat o'rganish maqsadida. Mualliflik huquqi bilan bog'liq murojaat qilinganda har qanday film olib tashlanishi mumkin!",
    ru: "Все материалы на сайте предназначены исключительно в образовательных целях. При обращении правообладателя любой фильм может быть удалён!",
    en: "All content on this site is for educational purposes only. Upon copyright holder request, any film may be removed!",
  },
  "footer.terms": { uz: "Foydalanish shartlari", ru: "Условия использования", en: "Terms of Use" },
  "footer.privacy": { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности", en: "Privacy Policy" },
  "footer.rights": { uz: "Barcha huquqlar himoyalangan.", ru: "Все права защищены.", en: "All rights reserved." },

  // Terms page
  "terms.title": { uz: "Foydalanish shartlari", ru: "Условия использования", en: "Terms of Use" },
  "terms.content": {
    uz: `1. Ushbu sayt faqat ta'lim maqsadlarida faoliyat yuritadi.\n2. Saytdagi barcha materiallar Internet tarmog'ining ochiq manbalaridan olingan.\n3. Mualliflik huquqi egasi murojaat qilganda tegishli kontent darhol olib tashlanadi.\n4. Foydalanuvchilar kontentdan faqat shaxsiy, notijorat maqsadlarda foydalanishlari mumkin.\n5. Sayt ma'muriyati uchinchi tomon saytlar mazmuni uchun javob bermaydi.`,
    ru: `1. Данный сайт работает исключительно в образовательных целях.\n2. Все материалы на сайте получены из открытых источников сети Интернет.\n3. При обращении правообладателя соответствующий контент будет немедленно удалён.\n4. Пользователи могут использовать контент исключительно в личных, некоммерческих целях.\n5. Администрация сайта не несёт ответственности за содержание сторонних сайтов.`,
    en: `1. This site operates exclusively for educational purposes.\n2. All materials on the site are obtained from open sources on the Internet.\n3. Upon request from the copyright holder, the corresponding content will be immediately removed.\n4. Users may use the content exclusively for personal, non-commercial purposes.\n5. The site administration is not responsible for the content of third-party sites.`,
  },

  // Privacy page
  "privacy.title": { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности", en: "Privacy Policy" },
  "privacy.content": {
    uz: `1. Biz foydalanuvchilarning shaxsiy ma'lumotlarini to'plamaymiz.\n2. Sayt ishlashi uchun cookie fayllardan foydalanilishi mumkin.\n3. Ko'rish statistikasi faqat saytni yaxshilash maqsadida ishlatiladi.\n4. Uchinchi tomon xizmatlari (rasm hostingi) o'z maxfiylik siyosatiga ega.\n5. Savollar yoki murojaat uchun Telegram orqali bog'lanishingiz mumkin.`,
    ru: `1. Мы не собираем личные данные пользователей.\n2. Для работы сайта могут использоваться файлы cookie.\n3. Статистика просмотров используется исключительно для улучшения сайта.\n4. Сторонние сервисы (хостинг изображений) имеют собственную политику конфиденциальности.\n5. По вопросам и обращениям вы можете связаться через Telegram.`,
    en: `1. We do not collect personal data of users.\n2. Cookies may be used for the operation of the site.\n3. Viewing statistics are used solely to improve the site.\n4. Third-party services (image hosting) have their own privacy policies.\n5. For questions or inquiries, you can contact us via Telegram.`,
  },

  // Home
  "home.trending": { uz: "Trendda", ru: "В тренде", en: "Trending" },
  "home.hero.title": { uz: "Eng yaxshi kinolar", ru: "Лучшие фильмы", en: "Best movies" },
  "home.hero.subtitle": {
    uz: "O'zbek tilida dublyaj qilingan kinolarni tomosha qiling",
    ru: "Смотрите фильмы с узбекским дубляжом",
    en: "Watch movies dubbed in Uzbek",
  },

  // General
  "general.loading": { uz: "Yuklanmoqda...", ru: "Загрузка...", en: "Loading..." },
  "general.notFound": { uz: "Topilmadi", ru: "Не найдено", en: "Not found" },
} as const;

export type TranslationKey = keyof typeof dict;

export function t(key: TranslationKey, locale: Locale): string {
  return dict[key]?.[locale] ?? dict[key]?.["uz"] ?? key;
}
