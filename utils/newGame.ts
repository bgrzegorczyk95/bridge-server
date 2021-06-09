import { initialTrump, initialStatuses, players } from "./initialValues";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const setNewGame = (gameId: number) => ({
  gameId: gameId,
  passCount: 0,
  playersCount: 0,
  throws: [],
  thrownCards: [],
  selectedCards: [],
  biddingHistory: [],
  turn: { name: undefined, place: undefined },
  trump: { ...initialTrump },
  players: [...players],
  gamePoints: {
    NS: { score: 0, under: [0], above: 0, round: 0, games: 0 },
    EW: { score: 0, under: [0], above: 0, round: 0, games: 0 },
    afterPart: [],
    games: 0,
  },
  statuses: { ...initialStatuses },
});
