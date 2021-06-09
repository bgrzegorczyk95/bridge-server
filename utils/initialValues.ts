import { Game } from "../@types/types";

export const initialPlayer = { takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false };
export const initialTrump = { userName: undefined, colorName: undefined, value: undefined, place: undefined, doubled: false, redoubled: false };
export const initialStatuses = {
  isDummyVisible: false,
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

export const updateGamePoints = (game: Game, gameNumber: number, pointsUnder: number, pointsAbove: number, pair: string) => {
  game.gamePoints[pair].under[gameNumber] = pointsUnder;
  game.gamePoints[pair].above = pointsAbove;
};

export let waitingPlayers = {};
export const games = [];