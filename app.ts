import { response } from 'express';
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

// // App setup
const PORT = 5000;
const clients = {};
const wss = new WebSocket.Server({ server: server });

let turn = { name: undefined, place: undefined };
let points = [];
let passCount = 0;
let bestBid = { userName: undefined, colorName: undefined, value: undefined, place: undefined };
let auctionHistory = [];
let thrownCards = [];

const turnPlaces = {
  N: 'E',
  W: 'N',
  S: 'W',
  E: 'S',
};

const initialUser = { place: undefined, takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false };

let activeUsers: Player[] = [
  { place: 'N', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'S', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'E', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'W', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
];

const dummyPlace = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

const openedPlaceType = {
  N: 'E',
  E: 'S',
  S: 'W',
  W: 'N',
};

export const cardWeights = {
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
  '10': 9,
  'J': 10,
  'Q': 11,
  'K': 12,
  'A': 13,
}

const setTurnPlace = (turn: string) => {
  const player = activeUsers.filter((place: Player) => place.place === turn);
  return player[0].name;
};

wss.on('connection', function connection(ws, request, client) {
  //generate a new clientId
  const clientId = uuid.v4();
  clients[clientId] = {
      connection:  ws,
  };

  const payLoad = {
      method: "connect",
      clientId: clientId,
      users: preparePlayersToSend(),
  };

  //send back the client connect
  ws.send(JSON.stringify(payLoad))

  ws.on("message", (message) => {
    const result = JSON.parse(message);

    if (result.method === 'join') {
      const { clientId, place, userName } = result;
      const userAlreadyExists = activeUsers.filter(activeUser => activeUser.uuid === clientId);

      activeUsers = activeUsers.map(user => {
        if (user.place === place && !userAlreadyExists.length && !user.takenPlace) {
          const cardsList = setCards();
          return {
            ...user,
            cards: cardsList,
            name: userName,
            takenPlace: true,
            uuid: clientId,
            cardsAmount: cardsList.length,
          }
        }
        return user;
      });

      updateGameState();
    }

    if (result.method === 'ready') {
      const { clientId } = result;

      activeUsers = activeUsers.map((user) => user.uuid === clientId ? { ...user, isReady: !user.isReady } : user);
      updateGameState();
    }

    if (result.method === 'turn') {
      if (!turn.name) {
        const player = activeUsers[getRandomInt(0, 3)];
        turn = setTurn(player.place);
        setPlayerTurn(turn);
      }
    }

    if (result.method === 'bid') {
      let isAuctionFinished = false;
      let turn = setTurn(turnPlaces[result.turn.place]);

      passCount = setPassCount(result.bid, passCount);
      bestBid = setBestBid(result.bid, bestBid);
      auctionHistory = [...auctionHistory, result.bid];

      if ((auctionHistory.length === 4 && passCount === 4) || (auctionHistory.length >= 4 && passCount === 3)) {
        turn = setTurn(openedPlaceType[bestBid.place]);
        isAuctionFinished = true;
      }

      const payload = {
        method: 'bid',
        turn,
        bid: result.bid,
        trump: bestBid,
        history: auctionHistory,
        isAuctionFinished,
      };

      activeUsers.forEach(usr => {
        if (usr.uuid) {
          clients[usr.uuid].connection.send(JSON.stringify(payload));
        }
      })
    };

    if (result.method === 'setDummy') {
      const payload = {
        method: 'setDummy',
        dummy: result.dummy,
      };

      activeUsers.forEach(usr => {
        if (usr.uuid) {
          clients[usr.uuid].connection.send(JSON.stringify(payload));
        }
      });
    };

    if (result.method === 'setPlayer') {
      const payload = {
        method: 'setPlayer',
        player: result.player,
      };

      activeUsers.forEach(usr => {
        if (usr.uuid && usr.place === dummyPlace[result.player.place]) {
          clients[usr.uuid].connection.send(JSON.stringify(payload));
        }
      });
    };

    if (result.method === 'throw') {
      const turn = setTurn(turnPlaces[result.turn.place]);
      const { card } = result;

      thrownCards = [...thrownCards, card];

      activeUsers = activeUsers.map((user: Player) => user.place === card.place ? {
        ...user,
        cardsAmount: user.cardsAmount - 1,
        cards: filterCards(user.cards, card),
      } : user);

      const payload = {
        method: 'throw',
        turn,
        thrownCards,
        users: activeUsers,
      };

      updateThrow(payload);
    };

    if (result.method === 'bestThrow' && thrownCards.length === 4) {
      let bestThrow = setBestThrow(thrownCards);
      points = [...points, bestThrow];
      thrownCards = [];

      const payload = {
        method: 'bestThrow',
        turn: setTurn(bestThrow.place),
        thrownCards,
      };

      activeUsers.forEach(usr => {
        if (usr.uuid) {
          clients[usr.uuid].connection.send(JSON.stringify(payload));
        }
      });
    };

    if (result.method === 'clean') {
      const { clientId } = result;

      activeUsers = activeUsers.map((user) => user.uuid === clientId ? { ...initialUser, place: user.place } : user);

      const cleanPayload = {
        method: 'clean',
        clientId,
        users: activeUsers,
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(cleanPayload));
    }
  })
});

app.get('/', (req, res) => res.send('SIEMA'));

server.listen(PORT, () => console.log(`No odpaliłem, port ${PORT}`));

const setBestThrow = (cards) => {
  let best = { name: undefined, place: undefined, value: undefined, color: undefined };
  cards.forEach((card: any) => {
    if (!best.name) {
      best = card;
      return;
    }

    if (card.color === best.color && cardWeights[card.value] > cardWeights[best.value]) {
      best = card;
    } else if (card.color !== best.color && card.color === bestBid.colorName && best.color !== bestBid.colorName) {
      best = card;
    }
  });
  return best;
};

const setTurn = (place) => ({
  place: place,
  name: setTurnPlace(place),
});

const setBestBid = (bid, best) => {
  let bestBid = { ...best };

  if (bid.colorName !== bestBid.colorName || bid.value !== bestBid.value) {
    bestBid = { ...bid };
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

const checkIsDummy = (dummyPlayer, player) => dummyPlayer && player.place === dummyPlace[bestBid.place];
const checkIsBestBid = (uuid, dummyPlayer, player) => dummyPlayer && dummyPlace[dummyPlayer.place] === player.place && uuid === dummyPlayer.uuid;

const preparePlayersToSend = (uuid?: string, dummyPlayer?: any) => {
  let preparedPlayers = [...activeUsers];

  preparedPlayers = preparedPlayers.map((player) => {
    const isDummy = checkIsDummy(dummyPlayer, player);
    const isBestBid = checkIsBestBid(uuid, dummyPlayer, player);

    if (uuid === player.uuid || (dummyPlayer && (isDummy || isBestBid))) {
      return player;
    }

    return { ...player, cards: [], uuid: undefined };
  });

  return preparedPlayers;
};

const updateThrow = (payload) => {
  const dummyPlayer = activeUsers.filter((player) => player.place === dummyPlace[bestBid.place]);

  activeUsers.forEach(usr => {
    if (usr.uuid) {
      const preparedPlayers = preparePlayersToSend(usr.uuid, dummyPlayer[0]);
      clients[usr.uuid].connection.send(JSON.stringify({ ...payload, users: preparedPlayers }));
    }
  });
};

const updateGameState = () => {
  activeUsers.forEach(usr => {
    const preparedPlayers = preparePlayersToSend(usr.uuid);
    if (usr.uuid) {
      clients[usr.uuid].connection.send(JSON.stringify({ method: 'updatePlaces', users: preparedPlayers }));
    }
  });
};

const setPlayerTurn = (turn) => {
  activeUsers.forEach(usr => {
    if (usr.uuid) {
      clients[usr.uuid].connection.send(JSON.stringify({ method: 'turn', turn }));
    }
  })
};
