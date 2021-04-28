import { response } from 'express';
import { countPoints } from './utils/countPoints';
import { cardWeights, dummyPlace, openedPlaceType, pointsValues, turnPlaces } from './utils/dict';
import { games, initialBestBid, initialGamePoints, initialPlayer, initialStatuses, players, setWaitingPlayers, waitingPlayers } from './utils/initialValues';
import { setNewGame } from './utils/newGame';
import { getRandomInt } from './utils/randomInt';
import { setCards } from './utils/setCards';

const uuid = require('uuid');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

interface Player {
  place: string;
  takenPlace: boolean;
  uuid?: string;
  name?: string;
  cards: any[];
  cardsAmount: number;
  isReady: boolean;
}

// App setup
const PORT = 5000;
const clients = {};
const wss = new WebSocket.Server({ server: server });

for (let i = 0; i < 10; i++) {
  const game = setNewGame(i);
  games.push({ ...game });
};

const setTurnPlace = (turn: string, gameId: number) => {
  const player = games[gameId].players.filter((player: Player) => player.place === turn);
  return player[0].name;
};

const checkIfPlayerAlreadyInGame = (gameId: number, clientId: string) => {
  const filteredPlayers = games[gameId].players.filter(player => player.uuid === clientId);
  return filteredPlayers.length;
};

const choosePlace = (gameId: number, clientId: string, place: string, userName: string) => {
  const userAlreadyExists = checkIfPlayerAlreadyInGame(gameId, clientId);

  games[gameId].players = games[gameId].players.map(player => {
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

const setPlayerReady = (gameId: number, clientId: string) => {
  games[gameId].players = games[gameId].players.map((player) => {
    if (player.uuid === clientId) {
      return { ...player, isReady: !player.isReady };
    }
    return player;
  });
};

const setInitialCards = (game: any) => {
  game.statuses.auctionStarted = true;
  game.players = game.players.map((player: any) => {
    const cards = setCards(game);
    return ({ ...player, cards, cardsAmount: 13 })
  });
}

const setInitialTurn = (game: any, gameId: number) => {
  const player = game.players[getRandomInt(0, 3)];
  game.turn = setTurn(player.place, gameId);

  setInitialCards(game)

  const payload = {
    method: 'startBidding',
    turn: game.turn,
    statuses: game.statuses,
  };

  updateGameState(gameId, 'update');
  sendPayload(payload, gameId);
};

const checkIfTurnEmpty = (gameId: number) => {
  const game = games[gameId];

  if (!game.turn.name) {
    setInitialTurn(game, gameId);
  }
};

const updateBidValues = (game: any, bid: any) => {
  game.passCount = setPassCount(bid, game.passCount);
  game.bestBid = setBestBid(bid, game);
  game.biddingHistory = [...game.biddingHistory, bid];
};

const checkIfBiddingFinished = (game: any, gameId: number) => {
  let isBiddingFinished = false;

  if (game.biddingHistory.length >= 4 && game.passCount === 3) {
    game.turn = setTurn(openedPlaceType[game.bestBid.place], gameId);
    game.statuses.auctionStarted = false;
    game.statuses.gameStarted = true;
    isBiddingFinished = true;
  }

  return isBiddingFinished;
}

const updateBid = (gameId: number, bid: any, turn: any) => {
  const game = games[gameId];
  game.turn = setTurn(turnPlaces[turn.place], gameId);

  updateBidValues(game, bid);

  if (game.biddingHistory.length === 4 && game.passCount === 4) {
    setNewDeal(gameId);
    return;
  }

  const isBiddingFinished = checkIfBiddingFinished(game, gameId);

  const payload = {
    method: 'bid',
    bid,
    turn: game.turn,
    bestBid: game.bestBid,
    biddingHistory: game.biddingHistory,
    statuses: game.statuses,
    isBiddingFinished,
  };

  sendPayload(payload, gameId);
};

const updateGamePoints = (game, bestThrow) => {
  if (bestThrow.place === 'N' || bestThrow.place === 'S') {
    game.gamePoints.NS.round += 1; 
  } else {
    game.gamePoints.EW.round += 1;
  }

  game.throws = [...game.throws, bestThrow];
  game.thrownCards = [];
};

const updatePlayerCardsAmount = (game: any, card: any, turn: any) => {
  game.thrownCards = [...game.thrownCards, card];
  const updatedCards = game.players.map((player: Player) => player.place === turn.place ? {
    ...player,
    cardsAmount: player.cardsAmount - 1,
    cards: filterCards(player.cards, card),
  } : player);

  game.players = updatedCards;
};

const checkIfWaiting = (clientId: string) => {
  let index;

  waitingPlayers.forEach((item: any, i: number) => {
    if (item.clientId === clientId) {
      games[item.gameId].statuses.waitingForPlayers = false;
      updateGameState(item.gameId, 'update');
      index = i;
    }
  });

  if (index) waitingPlayers.splice(index, 1);
};

const clearWaitingPlayers = (gameId: number) => {
  const waiting = waitingPlayers.filter((item: any) => item.gameId !== gameId);
  setWaitingPlayers(waiting);
};

const checkPlayersLeft = (gameId) => {
  let playersLeft = 0;

  waitingPlayers.forEach((item: any) => {
    if (item.gameId === gameId) {
      playersLeft += 1;
    }
  });

  return playersLeft;
};

wss.on('connection', function connection(ws, request, client) {
  //generate a new clientId
  let clientId = uuid.v4();

  ws.on("message", (message) => {
    const result = JSON.parse(message);

    if (result.method === 'connect') {
      if (result.clientId) {
        clientId = result.clientId;
        checkIfWaiting(clientId);
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

      choosePlace(gameId, clientId, place, userName);
      updateGameState(gameId, 'update');
    }

    if (result.method === 'ready') {
      const { clientId, gameId } = result;
      setPlayerReady(gameId, clientId);
      updateGameState(gameId, 'update');
    }

    if (result.method === 'startBidding') {
      const { gameId } = result;

      checkIfTurnEmpty(gameId);
    }

    if (result.method === 'bid') {
      const { gameId, bid, turn } = result;

      updateBid(gameId, bid, turn);
    };

    if (result.method === 'throw') {
      const { card, gameId, turn } = result;
      const game = games[gameId];
      game.turn = setTurn(turnPlaces[turn.place], gameId);

      updatePlayerCardsAmount(game, card, turn);

      const payload = {
        method: 'throw',
        turn: game.turn,
        thrownCards: game.thrownCards,
      };

      updateThrow(payload, gameId);
    };

    if (result.method === 'bestThrow' && games[result.gameId].thrownCards.length === 4) {
      const game = games[result.gameId];
      let bestThrow = setBestThrow(game);
      game.turn = setTurn(bestThrow.place, result.gameId);

      updateGamePoints(game, bestThrow);

      if (game.throws.length === 13) {
        countPoints(game);
        const isEndGame = game.gamePoints.EW.games === 2 || game.gamePoints.NS.games === 2;

        if (isEndGame) {
          setEndGame(game, result.gameId);
        } else {
          setNewDeal(result.gameId);
        }
        return;
      }

      const payload = {
        method: 'bestThrow',
        turn: game.turn,
        thrownCards: game.thrownCards,
        throws: game.throws,
        gamePoints: game.gamePoints,
      };

      setTimeout(() => sendPayload(payload, result.gameId), 1000);
    };

    if (result.method === 'resetGame') {
      const { gameId } = result;
      const game = setNewGame(gameId);

      games[gameId] = { ...game };
      clearWaitingPlayers(gameId);
      updateGameState(gameId, 'resetGame');
    }

    if (result.method === 'clean') {
      const { clientId, gameId } = result;

      games[gameId].players = games[gameId].players.map((player) => player.uuid === clientId ? { ...initialPlayer, place: player.place } : player);

      updateGameState(gameId, 'update');
    }

    if (result.method === 'disconnect') {
      const { clientId, gameId } = result;

      if (clientId && (gameId || gameId === 0)) {
        waitingPlayers.push({ clientId, gameId });
        games[gameId].statuses.waitingForPlayers = true;

        const playersLeft = checkPlayersLeft(gameId);
        if (playersLeft === 4) {
          const game = setNewGame(gameId);
          games[gameId] = { ...game };
          updateGameState(gameId, 'reset');
        } else {
          updateGameState(gameId, 'update');
        }
      }
    }
  })
});

const setScore = (game: any) => {
  let scoreNs = 0;
  let scoreEw = 0;

  scoreNs += game.gamePoints.NS.above;
  scoreNs += game.gamePoints.NS.under.reduce((val, sum) => val + sum);

  scoreEw += game.gamePoints.EW.above;
  scoreEw += game.gamePoints.EW.under.reduce((val, sum) => val + sum);

  game.gamePoints.NS.score = scoreNs;
  game.gamePoints.EW.score = scoreEw;
}

const setEndGame = (game: any, gameId: number) => {
  setScore(game);
  game.statuses.endGame = true;

  const payload = {
    method: 'endGame',
    gamePoints: game.gamePoints,
    statuses: game.statuses,
  };

  sendPayload(payload, gameId);
};

const resetGameState = (game: any) => {
  game.biddingHistory = [];
  game.throws = [];
  game.gamePoints.NS.round = 0;
  game.gamePoints.EW.round = 0;
  game.passCount = 0;
  game.selectedCards = [];
  game.statuses.gameStarted = false;
  game.statuses.auctionStarted = true;
  game.bestBid = { ...initialBestBid };
};

const setNewDeal = (gameId: number) => {
  const game = games[gameId];
  resetGameState(game);

  game.players = game.players.map((player) => ({ ...player, cards: setCards(game), cardsAmount: 13 }));
  updateGameState(gameId, 'update');
};

const setBestThrow = (game) => {
  let best = { name: undefined, place: undefined, value: undefined, color: undefined };

  game.thrownCards.forEach((card: any) => {
    if (!best.name) {
      best = card;
      return;
    }

    if (card.color === best.color && cardWeights[card.value] > cardWeights[best.value]) {
      best = card;
    } else if (card.color !== best.color && card.color === game.bestBid.colorName && best.color !== game.bestBid.colorName) {
      best = card;
    }
  });

  return best;
};

const setTurn = (place, gameId: number) => ({
  place: place,
  name: setTurnPlace(place, gameId),
});

const setBestBid = (bid, game) => {
  let bestBid = { ...game.bestBid };

  if (!bid.pass) {
    bestBid = { ...bestBid, doubled: bid.doubled, redoubled: bid.redoubled };

    if ((bid.colorName && bid.colorName !== bestBid.colorName) || (bid.value && bid.value !== bestBid.value)) {
      let bestBidPlayer;
  
      game.biddingHistory.forEach((biddingBid) => {
        if (!bestBidPlayer && dummyPlace[bid.place] === biddingBid.place && bid.colorName === biddingBid.colorName) {
          bestBidPlayer = biddingBid.place;
        }
      });
  
      bestBid = { ...bid, place: bestBidPlayer || bid.place };
    }
  }

  return bestBid;
};

const setPassCount = (bid, count) => {
  let passCount = count;

  if (bid.pass) {
    passCount += 1;
  } else {
    passCount = 0;
  }

  return passCount;
};

const filterCards = (cards, card) => {
  let filteredCards = [...cards];
  filteredCards = filteredCards.filter((c: any) => `${c.value}${c.color}` !== `${card.value}${card.color}`);

  return filteredCards;
};

const checkIsDummy = (dummyPlayer, player, bestBidPlace) => dummyPlayer && player.place === bestBidPlace;
const checkIsBestBid = (uuid, dummyPlayer, player) => dummyPlayer && dummyPlace[dummyPlayer.place] === player.place && uuid === dummyPlayer.uuid;

const preparePlayersToSend = (game: any, uuid?: string, dummyPlayer?: any) => {
  let preparedPlayers = [...game.players];

  preparedPlayers = preparedPlayers.map((player) => {
    const isDummy = checkIsDummy(dummyPlayer, player, dummyPlace[game.bestBid.place]);
    const isBestBid = checkIsBestBid(uuid, dummyPlayer, player);

    if (uuid === player.uuid || (dummyPlayer && (isDummy || isBestBid))) {
      return player;
    }

    return { ...player, cards: [], uuid: undefined };
  });

  return preparedPlayers;
};

const updateThrow = (payload, gameId: number) => {
  const game = games[gameId];
  const dummyPlayer = game.players.filter((player) => player.place === dummyPlace[game.bestBid.place]);

  game.players.forEach(player => {
    if (player.uuid) {
      const preparedPlayers = preparePlayersToSend(game, player.uuid, dummyPlayer[0]);
      clients[player.uuid].connection.send(JSON.stringify({ ...payload, players: preparedPlayers }));
    }
  });
};

const sendPayload = (payload, gameId: number) => {
  games[gameId].players.forEach(player => {
    if (player.uuid) {
      clients[player.uuid].connection.send(JSON.stringify(payload));
    }
  })
};

const prepareGames = (uuid: string) => {
  let preparedGames = games.map((game: any) => {
    const players = preparePlayersToSend(game, uuid);
    return { ...game, players };
  });

  return preparedGames;
};

const updateGameState = (gameId: number, method: string) => {
  Object.keys(clients).forEach((client: any) => {
    const preparedGames = prepareGames(client);
    clients[client].connection.send(JSON.stringify({ method, gameId, games: preparedGames }));
  });
};

app.get('/', (req, res) => res.send('SIEMA'));

server.listen(PORT, () => console.log(`No odpaliłem, port ${PORT}`));
