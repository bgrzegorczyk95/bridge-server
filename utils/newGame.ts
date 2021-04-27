import { initialBestBid, initialGamePoints, initialStatuses, players } from "./initialValues";

export const setNewGame = (gameId: number) => ({
  gameId: gameId,
  name: undefined,
  passCount: 0,
  playersCount: 0,
  throws: [],
  thrownCards: [],
  selectedCards: [],
  biddingHistory: [],
  turn: { name: undefined, place: undefined },
  bestBid: { ...initialBestBid },
  players: [...players],
  gamePoints: { ...initialGamePoints },
  statuses: { ...initialStatuses },
})