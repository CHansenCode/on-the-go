// Dummy data for now — nothing is persisted. Every session starts fresh
// from this list. Once there's a real database, `Card` is the shape to
// store, and `timesCompleted` / `lastCompleted` are what the not-yet-built
// scheduling/archiving logic will read and update.

export type Card = {
  id: string;
  name: string;
  languageOne: string;
  languageTwo: string;
  timesCompleted: number;
  lastCompleted: string | null; // ISO timestamp, or null if never reviewed
};

export const languageOneLabel = 'English';
export const languageTwoLabel = 'Spanish';

export const initialCards: Card[] = [
  { id: '1', name: 'hello', languageOne: 'hello', languageTwo: 'hola', timesCompleted: 0, lastCompleted: null },
  { id: '2', name: 'goodbye', languageOne: 'goodbye', languageTwo: 'adiós', timesCompleted: 3, lastCompleted: null },
  { id: '3', name: 'please', languageOne: 'please', languageTwo: 'por favor', timesCompleted: 0, lastCompleted: null },
  { id: '4', name: 'thank you', languageOne: 'thank you', languageTwo: 'gracias', timesCompleted: 5, lastCompleted: null },
  { id: '5', name: 'water', languageOne: 'water', languageTwo: 'agua', timesCompleted: 1, lastCompleted: null },
  { id: '6', name: 'friend', languageOne: 'friend', languageTwo: 'amigo', timesCompleted: 0, lastCompleted: null },
  { id: '7', name: 'to eat', languageOne: 'to eat', languageTwo: 'comer', timesCompleted: 2, lastCompleted: null },
  { id: '8', name: 'house', languageOne: 'house', languageTwo: 'casa', timesCompleted: 0, lastCompleted: null },
];
