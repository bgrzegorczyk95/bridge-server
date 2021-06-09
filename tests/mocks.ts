export const mockGameWhenPerform: any = {
  trump: {
    colorName: "S",
    place: "E",
    value: "4",
  },
  gamePoints: {
    EW: { score: 0, under: [0], above: 0, round: 11, games: 0 },
    NS: { score: 0, under: [0], above: 0, round: 0, games: 0 },
    afterPart: [],
  }
};

export const mockGameWhenNotPerform: any = {
  trump: {
    colorName: "S",
    place: "E",
    value: "4",
  },
  gamePoints: {
    EW: { score: 0, under: [0], above: 0, round: 7, games: 0 },
    NS: { score: 0, under: [0], above: 0, round: 6, games: 0 },
    afterPart: [],
  }
};

export const mockEndGame: any = {
  gamePoints: {
    EW: { score: 0, under: [100, 130], above: 1230, round: 0, games: 2 },
    NS: { score: 0, under: [120], above: 1600, round: 0, games: 1 },
  }
};

export const turnMock: any = {
  players: [
    { place: 'N', name: 'Test 1' },
    { place: 'S', name: 'Test 2' },
    { place: 'E', name: 'Test 3' },
    { place: 'W', name: 'Test 4' },
  ],
  turn: { name: undefined, place: undefined },
};

export const cardsMock: any = {
  players: [
    { place: 'N', name: 'Test 1', cards: [], cardsAmount: 0 },
    { place: 'S', name: 'Test 2', cards: [], cardsAmount: 0 },
    { place: 'E', name: 'Test 3', cards: [], cardsAmount: 0 },
    { place: 'W', name: 'Test 4', cards: [], cardsAmount: 0 },
  ],
  selectedCards: [],
  statuses: { auctionStarted: false },
};