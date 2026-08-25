// Dummy data for now — nothing is persisted. Every session starts fresh
// from this list. Once there's a real database, `Card` is the shape to
// store, and `timesCompleted` / `lastCompleted` are what the not-yet-built
// scheduling/archiving logic will read and update.

export type Card = {
  id: string;
  name: string;
  group: string; // category — the Learning tab's category list is derived
  // from the distinct values here, same idea as `SELECT DISTINCT group`.
  languageOne: string;
  languageTwo: string;
  timesCompleted: number;
  lastCompleted: string | null; // ISO timestamp, or null if never reviewed
};

export const languageOneLabel = 'Swedish';
export const languageTwoLabel = 'Lithuanian';

const GROUP = 'Swedish ↔ Lithuanian';

// English gloss -> [Swedish, Lithuanian]
const pairs: [string, string, string][] = [
  ['hello', 'hej', 'labas'],
  ['goodbye', 'hej då', 'viso gero'],
  ['yes', 'ja', 'taip'],
  ['no', 'nej', 'ne'],
  ['please', 'snälla', 'prašau'],
  ['thank you', 'tack', 'ačiū'],
  ['sorry', 'förlåt', 'atsiprašau'],
  ['water', 'vatten', 'vanduo'],
  ['bread', 'bröd', 'duona'],
  ['milk', 'mjölk', 'pienas'],
  ['house', 'hus', 'namas'],
  ['dog', 'hund', 'šuo'],
  ['cat', 'katt', 'katė'],
  ['friend', 'vän', 'draugas'],
  ['family', 'familj', 'šeima'],
  ['mother', 'mor', 'mama'],
  ['father', 'far', 'tėtis'],
  ['sister', 'syster', 'sesuo'],
  ['brother', 'bror', 'brolis'],
  ['child', 'barn', 'vaikas'],
  ['man', 'man', 'vyras'],
  ['woman', 'kvinna', 'moteris'],
  ['love', 'kärlek', 'meilė'],
  ['good', 'bra', 'geras'],
  ['bad', 'dålig', 'blogas'],
  ['big', 'stor', 'didelis'],
  ['small', 'liten', 'mažas'],
  ['hot', 'varm', 'karštas'],
  ['cold', 'kall', 'šaltas'],
  ['day', 'dag', 'diena'],
  ['night', 'natt', 'naktis'],
  ['morning', 'morgon', 'rytas'],
  ['evening', 'kväll', 'vakaras'],
  ['week', 'vecka', 'savaitė'],
  ['month', 'månad', 'mėnuo'],
  ['year', 'år', 'metai'],
  ['today', 'idag', 'šiandien'],
  ['tomorrow', 'imorgon', 'rytoj'],
  ['yesterday', 'igår', 'vakar'],
  ['one', 'ett', 'vienas'],
  ['two', 'två', 'du'],
  ['three', 'tre', 'trys'],
  ['four', 'fyra', 'keturi'],
  ['five', 'fem', 'penki'],
  ['six', 'sex', 'šeši'],
  ['seven', 'sju', 'septyni'],
  ['eight', 'åtta', 'aštuoni'],
  ['nine', 'nio', 'devyni'],
  ['ten', 'tio', 'dešimt'],
  ['red', 'röd', 'raudona'],
  ['blue', 'blå', 'mėlyna'],
  ['green', 'grön', 'žalia'],
  ['yellow', 'gul', 'geltona'],
  ['black', 'svart', 'juoda'],
  ['white', 'vit', 'balta'],
  ['sun', 'sol', 'saulė'],
  ['moon', 'måne', 'mėnulis'],
  ['star', 'stjärna', 'žvaigždė'],
  ['sky', 'himmel', 'dangus'],
  ['sea', 'hav', 'jūra'],
  ['river', 'flod', 'upė'],
  ['mountain', 'berg', 'kalnas'],
  ['forest', 'skog', 'miškas'],
  ['tree', 'träd', 'medis'],
  ['flower', 'blomma', 'gėlė'],
  ['bird', 'fågel', 'paukštis'],
  ['fish', 'fisk', 'žuvis'],
  ['horse', 'häst', 'arklys'],
  ['book', 'bok', 'knyga'],
  ['table', 'bord', 'stalas'],
  ['chair', 'stol', 'kėdė'],
  ['door', 'dörr', 'durys'],
  ['window', 'fönster', 'langas'],
  ['street', 'gata', 'gatvė'],
  ['city', 'stad', 'miestas'],
  ['country', 'land', 'šalis'],
  ['food', 'mat', 'maistas'],
  ['coffee', 'kaffe', 'kava'],
  ['tea', 'te', 'arbata'],
  ['wine', 'vin', 'vynas'],
  ['beer', 'öl', 'alus'],
  ['apple', 'äpple', 'obuolys'],
  ['eye', 'öga', 'akis'],
  ['hand', 'hand', 'ranka'],
  ['head', 'huvud', 'galva'],
  ['heart', 'hjärta', 'širdis'],
  ['to eat', 'äta', 'valgyti'],
  ['to drink', 'dricka', 'gerti'],
  ['to sleep', 'sova', 'miegoti'],
  ['to see', 'se', 'matyti'],
  ['to speak', 'tala', 'kalbėti'],
  ['to read', 'läsa', 'skaityti'],
  ['to write', 'skriva', 'rašyti'],
  ['to go', 'gå', 'eiti'],
  ['to come', 'komma', 'ateiti'],
  ['to work', 'arbeta', 'dirbti'],
  ['to play', 'leka', 'žaisti'],
  ['time', 'tid', 'laikas'],
  ['money', 'pengar', 'pinigai'],
  ['name', 'namn', 'vardas'],
];

export const initialCards: Card[] = pairs.map(([name, languageOne, languageTwo], i) => ({
  id: String(i + 1),
  name,
  group: GROUP,
  languageOne,
  languageTwo,
  timesCompleted: 0,
  lastCompleted: null,
}));

// Distinct groups, in the order they first appear — the category list on
// the Learning tab's selection screen.
export function listGroups(cards: Card[]): string[] {
  return [...new Set(cards.map((c) => c.group))];
}
