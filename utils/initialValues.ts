export const initialPlayer = { takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false };
export const initialBestBid = { userName: undefined, colorName: undefined, value: undefined, place: undefined, doubled: false, redoubled: false };
export const initialGamePoints = { NS: { score: 0, under: [0], above: 0, round: 0, games: 0 }, EW: { score: 0, under: [0], above: 0, round: 0, games: 0 }, afterPart: [], games: 0 };
export const initialStatuses = {
  waitingForPlayers: false,
  gameStarted: false,
  auctionStarted: false,
  showCountDown: false,
  endGame: false,
};

export const players: any = [
  { place: 'N', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'S', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'E', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'W', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
];

export const setWaitingPlayers = (waiting: any) => {
  waitingPlayers = waiting;
};

export let waitingPlayers = [];
export const games = [];