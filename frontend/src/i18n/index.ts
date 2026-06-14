export type Locale = 'en' | 'uk';

interface Translations {
  [key: string]: string;
}

const en: Translations = {
  'app.title': 'Chess Battle',
  'lobby.newGame': 'New Game',
  'lobby.yourName': 'Your name',
  'lobby.namePlaceholder': 'e.g. Magnus',
  'lobby.gameMode': 'Game mode',
  'lobby.vsAI': 'vs AI',
  'lobby.vsAIDesc': 'Play against computer',
  'lobby.hotseat': 'Hotseat',
  'lobby.hotseatDesc': 'Two players, same device',
  'lobby.playAs': 'Play as',
  'lobby.white': 'White',
  'lobby.black': 'Black',
  'lobby.startGame': 'Start game',
  'lobby.starting': 'Starting…',
  'game.whiteToMove': 'White to move',
  'game.blackToMove': 'Black to move',
  'game.thinking': 'AI thinking…',
  'game.result': 'Result',
  'game.backToLobby': 'Back to lobby',
  'game.offerDraw': 'Offer draw',
  'game.resign': 'Resign',
  'game.undo': '↩ Undo',
  'game.confirm': '✓ Confirm',
  'game.cancel': '✕ Cancel',
  'game.flipBoard': '🔄 Flip board',
  'game.noMoves': 'No moves yet.',
  'game.moves': 'Moves',
  'game.captured': 'Captured',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.battleMode': 'Battle mode',
  'settings.classic': 'Classic',
  'settings.battleChess': 'Battle Chess',
  'settings.difficulty': 'Difficulty',
  'settings.save': 'Save settings',
};

const uk: Translations = {
  'app.title': 'Шаховий Бій',
  'lobby.newGame': 'Нова гра',
  'lobby.yourName': 'Ваше ім\'я',
  'lobby.namePlaceholder': 'напр. Магнус',
  'lobby.gameMode': 'Режим гри',
  'lobby.vsAI': 'Проти ИІ',
  'lobby.vsAIDesc': 'Грати проти комп\'ютера',
  'lobby.hotseat': 'Hotseat',
  'lobby.hotseatDesc': 'Два гравці, одне пристрій',
  'lobby.playAs': 'Грати за',
  'lobby.white': 'Білі',
  'lobby.black': 'Чорні',
  'lobby.startGame': 'Почати гру',
  'lobby.starting': 'Запуск…',
  'game.whiteToMove': 'Хід білих',
  'game.blackToMove': 'Хід чорних',
  'game.thinking': 'ИІ думає…',
  'game.result': 'Результат',
  'game.backToLobby': 'Назад до лобі',
  'game.offerDraw': 'Пропонувати нічию',
  'game.resign': 'Здатися',
  'game.undo': '↩ Відмінити',
  'game.confirm': '✓ Підтвердити',
  'game.cancel': '✕ Скасувати',
  'game.flipBoard': '🔄 Перевернути дошку',
  'game.noMoves': 'Ще немає ходів.',
  'game.moves': 'Ходи',
  'game.captured': 'Взяті',
  'settings.title': 'Налаштування',
  'settings.language': 'Мова',
  'settings.theme': 'Тема',
  'settings.battleMode': 'Режим бою',
  'settings.classic': 'Класичний',
  'settings.battleChess': 'Шаховий Бій',
  'settings.difficulty': 'Складність',
  'settings.save': 'Зберегти налаштування',
};

const translations: Record<Locale, Translations> = { en, uk };

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem('chess-locale', locale);
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
}

export function initLocale(): void {
  const saved = localStorage.getItem('chess-locale') as Locale | null;
  if (saved && (saved === 'en' || saved === 'uk')) {
    currentLocale = saved;
  }
}
