export interface Game {
  gameId: number;
  passCount: number;
  playersCount: number;
  players: Player[];
  throws: Throw[];
  thrownCards: Throw[];
  selectedCards: Card[];
  biddingHistory: Bid[];
  turn: Turn;
  trump: Trump;
  statuses: Statuses;
  gamePoints: GamePoints;
}

export interface Turn {
  name?: string;
  place?: string;
}

export interface Bid {
  place: string;
  row?: number;
  col?: number;
  colorName?: string;
  value?: string;
  pass?: boolean;
  doubled: boolean;
  redoubled: boolean;
}

export interface Throw {
  name: string;
  place: string;
  value: string;
  color: string;
}

export interface Card {
  color: string;
  value: string;
}

interface Statuses {
  isDummyVisible: boolean;
  waitingForPlayers: boolean;
  gameStarted: boolean;
  auctionStarted: boolean;
  showCountDown: boolean;
  endGame: boolean;
}

interface GamePoints {
  NS: GamePairPoints;
  EW: GamePairPoints;
  afterPart: string[];
  games: number;
}

interface GamePairPoints {
  score: number;
  under: number[];
  above: number;
  round: number;
  games: number;
}

export interface Player {
  place: 'N' | 'S' | 'E' | 'W';
  takenPlace: boolean;
  uuid?: string;
  name?: string,
  cards: Card[],
  cardsAmount: number;
  isReady: boolean;
}

export interface Trump {
  userName?: string;
  colorName?: string;
  value?: string;
  place?: string;
  doubled: boolean;
  redoubled: boolean;
}

type WaitingPlayers = WaitingPlayer[];

export interface WaitingPlayer {
  clientId: string;
  gameId: number;
}

export interface Message {
  method: string;
  clientId: string;
  gameId: number;
  userName?: string;
  place?: string;
  turn?: Turn;
  bid?: Bid;
  card?: Card;
}