import { Player, Game, Bid, Turn, Throw, Card, Trump } from './@types/types';
import * as WebSocket from 'ws';
import { countPoints } from './utils/countPoints';
import { cardWeights, dummyPlace, openedPlaceType, turnPlaces } from './utils/dict';
import { games, initialPlayer, initialTrump, setWaitingPlayers, waitingPlayers } from './utils/initialValues';
import { setNewGame } from './utils/newGame';
import { getRandomInt } from './utils/randomInt';
import { setCards } from './utils/setCards';

const uuid = require('uuid');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('It works!'));

server.listen(PORT, () => console.log(`Started, port ${PORT}`));

const wss = new WebSocket.Server({ server: server });

const clients = {};

for (let i = 0; i < 10; i++) {
  const game = setNewGame(i);
  games.push({ ...game });

  const waiting = { ...waitingPlayers, [i]: [] };
  setWaitingPlayers(waiting);
};

const setTurnPlayerName = (turn: string, game: Game) => {
  const player = game.players.filter((player: Player) => player.place === turn);
  return player[0].name;
};

export const setTurn = (place: string, game: Game) => {
  const turn = { place: place, name: setTurnPlayerName(place, game) };
  game.turn = turn;

  return turn;
};

const checkIfPlayerAlreadyInGame = (game: Game, clientId: string) => {
  const filteredPlayers = game.players.filter(player => player.uuid === clientId);
  return filteredPlayers.length;
};

const choosePlace = (game: Game, clientId: string, place: string, userName: string) => {
  const userAlreadyExists = checkIfPlayerAlreadyInGame(game, clientId);

  game.players = game.players.map(player => {
    if (player.place === place && !userAlreadyExists && !player.takenPlace) {
      return {
        ...player,
        name: userName,
        takenPlace: true,
        uuid: clientId,
      }
    }
    return player;
  });
};

const setPlayerReady = (game: Game, clientId: string) => {
  game.players = game.players.map((player) => {
    if (player.uuid === clientId) {
      return { ...player, isReady: !player.isReady };
    }
    return player;
  });
};

export const setInitialCards = (game: Game) => {
  game.statuses.auctionStarted = true;
  
  const players = game.players.map(player => {
    const cards = setCards(game);
    return ({ ...player, cards, cardsAmount: 13 })
  });

  game.players = players;

  return players;
}

const setInitialTurn = (game: Game, gameId: number) => {
  const player = game.players[getRandomInt(0, 3)];
  setTurn(player.place, game);
  setInitialCards(game)
  updateGameState(gameId, 'update');
};

const checkIfTurnEmpty = (game: Game, gameId: number) => {
  if (!game.turn.name) {
    setInitialTurn(game, gameId);
  }
};

const updateBidValues = (game: Game, bid: Bid) => {
  game.passCount = setPassCount(bid, game.passCount);
  game.trump = setTrump(bid, game);
  game.biddingHistory = [...game.biddingHistory, bid];
};

const checkIfBiddingFinished = (game: Game) => {
  if (game.biddingHistory.length >= 4 && game.passCount === 3) {
    setTurn(openedPlaceType[game.trump.place], game);
    game.statuses.auctionStarted = false;
    game.statuses.gameStarted = true;
  }
}

const updateBid = (game: Game, gameId: number, bid: Bid, turn: Turn) => {
  setTurn(turnPlaces[turn.place], game);
  updateBidValues(game, bid);

  if (game.biddingHistory.length === 4 && game.passCount === 4) {
    setNewDeal(game, gameId);
    return;
  }

  checkIfBiddingFinished(game);
  updateGameState(gameId, 'update');
};

const filterCards = (cards: Card[], card: Card) => {
  let filteredCards = [...cards];
  filteredCards = filteredCards.filter((c: any) => `${c.value}${c.color}` !== `${card.value}${card.color}`);

  return filteredCards;
};

const updatePlayerCardsAmount = (game: Game, card: Throw, turn: Turn) => {
  game.thrownCards = [...game.thrownCards, card];
  const updatedCards = game.players.map((player: Player) => player.place === turn.place ? {
    ...player,
    cardsAmount: player.cardsAmount - 1,
    cards: filterCards(player.cards, card),
  } : player);

  game.players = updatedCards;
};

const checkIfWaiting = (gameId: number, clientId: string) => {
  if (gameId || gameId === 0) {
    const isPlayerInWaitingList = waitingPlayers[gameId].includes(clientId);

    if (isPlayerInWaitingList) {
      const playerIndex = waitingPlayers[gameId].indexOf(clientId);
      waitingPlayers[gameId].splice(playerIndex, 1);

      if (!waitingPlayers[gameId].length) {
        const game: Game = games[gameId];
        game.statuses.waitingForPlayers = false;
        updateGameState(gameId, 'update');
      }
    }
  }
};

const clearWaitingPlayers = (gameId: number) => {
  const waiting = waitingPlayers[gameId] = [];
  setWaitingPlayers(waiting);
};

const checkIfEndGame = (game: Game, gameId: number) => {
  const isEndGame = game.gamePoints.EW.games === 2 || game.gamePoints.NS.games === 2;
  if (isEndGame) {
    setEndGame(game, gameId);
  } else {
    setNewDeal(game, gameId);
  }
};

const updateRoundPoints = (game: Game, bestThrow: Throw) => {
  if (bestThrow.place === 'N' || bestThrow.place === 'S') {
    game.gamePoints.NS.round += 1; 
  } else {
    game.gamePoints.EW.round += 1;
  }

  game.throws = [...game.throws, bestThrow];
  game.thrownCards = [];
};

const checkBestThrow = (game: Game, gameId: number) => {
  let bestThrow = setBestThrow(game);
  setTurn(bestThrow.place, game);
  updateRoundPoints(game, bestThrow);

  if (game.throws.length === 13) {
    countPoints(game);
    checkIfEndGame(game, gameId);
    return;
  }

  setTimeout(() => updateGameState(gameId, 'update'), 1000);
};

const cleanGamePlace = (game: Game, gameId: number, clientId: string) => {
  game.players = game.players.map((player) => player.uuid === clientId ? { ...initialPlayer, place: player.place } : player);
  updateGameState(gameId, 'update');
};

const checkIfPlayerIsInGame = (game: Game, clientId: string) => {
  return game.players.some((player: Player) => player.uuid === clientId);
}

wss.on('connection', function connection(ws: WebSocket) {
  let clientId = uuid.v4();

  ws.on("message", (message: string) => {
    const result = JSON.parse(message);
    const game: Game = games[result.gameId];

    if (result.method === 'connect') {
      if (result.clientId) {
        clientId = result.clientId;
        checkIfWaiting(result.gameId, clientId);
      }

      clients[clientId] = {
        connection: ws,
      };

      const payLoad = {
          method: "connect",
          clientId: clientId,
          games: prepareGames(clientId),
      };

      //send back the client connect
      ws.send(JSON.stringify(payLoad));
    }

    if (result.method === 'join') {
      const { clientId, gameId, place, userName } = result;

      choosePlace(game, clientId, place, userName);
      updateGameState(gameId, 'update');
    }

    if (result.method === 'ready') {
      const { clientId, gameId } = result;
      setPlayerReady(game, clientId);
      updateGameState(gameId, 'update');
    }

    if (result.method === 'startBidding') {
      const { gameId } = result;
      checkIfTurnEmpty(game, gameId);
    }

    if (result.method === 'bid') {
      const { gameId, bid, turn } = result;
      updateBid(game, gameId, bid, turn);
    };

    if (result.method === 'throw') {
      const { card, gameId, turn } = result;

      if (!game.statuses.isDummyVisible) {
        game.statuses.isDummyVisible = true;
      }

      setTurn(turnPlaces[turn.place], game);
      updatePlayerCardsAmount(game, card, turn);
      updateGameState(gameId, 'update');

      if (game.thrownCards.length === 4) {
        checkBestThrow(game, gameId);
      }
    };

    if (result.method === 'resetGame') {
      const { gameId } = result;
      const newGame = setNewGame(gameId);

      games[gameId] = { ...newGame };
      clearWaitingPlayers(gameId);
      updateGameState(gameId, 'resetGame');
    }

    if (result.method === 'clean') {
      const { clientId, gameId } = result;
      cleanGamePlace(game, gameId, clientId);
    }

    if (result.method === 'disconnect') {
      const { clientId, gameId } = result;
      const isPlayerInGame = checkIfPlayerIsInGame(game, clientId);

      if (isPlayerInGame && clientId && (gameId || gameId === 0) && (game.statuses.gameStarted || game.statuses.auctionStarted)) {
        waitingPlayers[gameId] = [...waitingPlayers[gameId], clientId];

        if (!game.statuses.waitingForPlayers) {
          game.statuses.waitingForPlayers = true;
          updateGameState(gameId, 'update');
        }

        const playersLeft = waitingPlayers[gameId].length;

        if (playersLeft === 4) {
          const newGame = setNewGame(gameId);
          games[gameId] = { ...newGame };
          updateGameState(gameId, 'reset');
        }
      }
    }
  })
});

const updateGamePoints = (game: Game, scoreNs: number, scoreEw: number) => {
  game.gamePoints.NS.score = scoreNs;
  game.gamePoints.EW.score = scoreEw;
}

export const setScore = (game: Game) => {
  let scoreNs = 0;
  let scoreEw = 0;

  const pointsNsAbove = game.gamePoints.NS.above;
  const pointsNsUnder = game.gamePoints.NS.under
  const pointsEwAbove = game.gamePoints.EW.above;
  const pointsEwUnder = game.gamePoints.EW.under;

  scoreNs += pointsNsAbove;
  scoreNs += pointsNsUnder.reduce((val, sum) => val + sum);

  scoreEw += pointsEwAbove;
  scoreEw += pointsEwUnder.reduce((val, sum) => val + sum);

  updateGamePoints(game, scoreNs, scoreEw)

  return { scoreEw, scoreNs }
};

const setEndGame = (game: Game, gameId: number) => {
  game.statuses.endGame = true;
  setScore(game);
  updateGameState(gameId, 'update');
};

const resetGameState = (game: Game) => {
  game.biddingHistory = [];
  game.throws = [];
  game.gamePoints.NS.round = 0;
  game.gamePoints.EW.round = 0;
  game.passCount = 0;
  game.selectedCards = [];
  game.statuses.gameStarted = false;
  game.statuses.auctionStarted = true;
  game.statuses.isDummyVisible = false;
  game.trump = { ...initialTrump };
};

const setNewDeal = (game: Game, gameId: number) => {
  resetGameState(game);
  game.players = game.players.map((player) => ({ ...player, cards: setCards(game), cardsAmount: 13 }));
  updateGameState(gameId, 'update');
};

const checkIfBidGreaterThanTrump = (game: Game, card: Throw, best: Throw) => {
  let bestThrow = { ...best };
  const isCardValueGreater = card.color === best.color && cardWeights[card.value] > cardWeights[best.value];
  const isColorGreater = card.color !== best.color && card.color === game.trump.colorName && best.color !== game.trump.colorName;

  if (isCardValueGreater) {
    bestThrow = card;
  } else if (isColorGreater) {
    bestThrow = card;
  }

  return bestThrow;
};

const setBestThrow = (game: Game) => {
  let bestThrow = { name: undefined, place: undefined, value: undefined, color: undefined };
  game.thrownCards.forEach((card) => {
    if (!bestThrow.name) {
      bestThrow = card;
      return;
    }
    bestThrow = checkIfBidGreaterThanTrump(game, card, bestThrow);
  });

  return bestThrow;
};

const setTrump = (bid: Bid, game: Game) => {
  let trump: Trump = { ...game.trump };

  if (!bid.pass) {
    trump = { ...trump, doubled: bid.doubled, redoubled: bid.redoubled };

    if ((bid.colorName && bid.colorName !== trump.colorName) || (bid.value && bid.value !== trump.value)) {
      let trumpPlayer;
  
      game.biddingHistory.forEach((biddingBid) => {
        if (!trumpPlayer && dummyPlace[bid.place] === biddingBid.place && bid.colorName === biddingBid.colorName) {
          trumpPlayer = biddingBid.place;
        }
      });
  
      trump = { ...bid, place: trumpPlayer || bid.place };
    }
  }

  return trump;
};

const setPassCount = (bid: Bid, count: number) => {
  let passCount = count;

  if (bid.pass) {
    passCount += 1;
  } else {
    passCount = 0;
  }

  return passCount;
};

const checkIsDummy = (dummyPlayer: Player, player: Player, trumpPlace: string) => {
  let isDummy = false;

  if (dummyPlayer && player.place === trumpPlace) {
    isDummy = true;
  }

  return isDummy;
};

const checkIsTrumpPlayer = (uuid: string, dummyPlayer: Player, player: Player) => {
  let isTrumpPlayer = false;

  if (dummyPlayer && dummyPlace[dummyPlayer.place] === player.place && uuid === dummyPlayer.uuid) {
    isTrumpPlayer = true;
  }

  return isTrumpPlayer;
}

const preparePlayersToSend = (game: Game, uuid?: string, dummyPlayer?: Player) => {
  let preparedPlayers = [...game.players];

  preparedPlayers = preparedPlayers.map((player) => {
    const isDummy = checkIsDummy(dummyPlayer, player, dummyPlace[game.trump.place]);
    const isTrump = checkIsTrumpPlayer(uuid, dummyPlayer, player);
    const isDummyVisible = game.statuses.isDummyVisible;

    if (uuid === player.uuid || (dummyPlayer && (isDummy || isTrump) && isDummyVisible)) {
      return player;
    }

    return { ...player, cards: [], uuid: undefined };
  });

  return preparedPlayers;
};

const prepareGames = (uuid: string) => {
  let preparedGames = games.map((game: Game) => {
    const dummyPlayer = game.players.filter((player) => player.place === dummyPlace[game.trump.place]);
    const players = preparePlayersToSend(game, uuid, dummyPlayer[0] || undefined);

    return { ...game, players };
  });

  return preparedGames;
};

const updateGameState = (gameId: number, method: string) => {
  Object.keys(clients).forEach((client) => {
    const preparedGames = prepareGames(client);
    clients[client].connection.send(JSON.stringify({ method, gameId, games: preparedGames }));
  });
};
