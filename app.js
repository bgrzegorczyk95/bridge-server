const uuid = require('uuid');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');// const socket = require("socket.io");

// // App setup
const PORT = 5000;
const clients = {};
const wss = new WebSocket.Server({ server: server });

let selectedCards = [];
let cards = [
  '2C', '2D', '2H', '2S', '3C', '3D', '3H', '3S',
  '4C', '4D', '4H', '4S', '5C', '5D', '5H', '5S',
  '6C', '6D', '6H', '6S', '7C', '7D', '7H', '7S',
  '8C', '8D', '8H', '8S', '9C', '9D', '9H', '9S',
  '10C', '10D', '10H', '10S', 'JC', 'JD', 'JH', 'JS',
  'QC', 'QD', 'QH', 'QS', 'KC', 'KD', 'KH', 'KS',
  'AC', 'AD', 'AH', 'AS'
];

const initialUser = { place: undefined, takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false };

let activeUsers = [
  { place: 'N', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'S', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'E', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'W', takenPlace: false, uuid: undefined, name: undefined, cards: [], cardsAmount: 0, isReady: false },
];

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const setCards = () => {
  const playerCards = [];
  let cardsCount = 0;

  while (cardsCount < 13) {
    const cardIndexNumber = getRandomInt(0, cards.length - 1);

    if (!selectedCards.includes(cards[cardIndexNumber]) && !playerCards.includes(cards[cardIndexNumber])) {
      playerCards.push(cards[cardIndexNumber]);
      selectedCards.push(cards[cardIndexNumber]);
      cardsCount += 1;
    }
  }

  return playerCards;
}

wss.on('connection', function connection(ws, request, client) {
  //generate a new clientId
  const clientId = uuid.v4();
  clients[clientId] = {
      "connection":  ws,
  }

  const payLoad = {
      method: "connect",
      clientId: clientId,
      users: activeUsers,
  }

  //send back the client connect
  ws.send(JSON.stringify(payLoad))

  ws.on("message", (message) => {
    const result = JSON.parse(message);

    if (result.method === 'join') {
      const clientId = result.clientId;
      const place = result.place;
      const userName = result.userName;
      const userAlreadyExists = activeUsers.filter(activeUsers => activeUsers.name === userName);

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
        return { ...user, cards: [] };
      });

      const setCardsPayload = {
        method: 'join',
        clientId,
        users: activeUsers,
      }

      const con = clients[clientId].connection;
      con.send(JSON.stringify(setCardsPayload));
      updateGameState();
    }

    if (result.method === 'ready') {
      const clientId = result.clientId;
      const userName = result.userName;

      activeUsers = activeUsers.map((user) => user.name === userName ? { ...user, isReady: !user.isReady } : user);

      const payload = {
        method: 'ready',
        clientId,
        users: activeUsers,
      }

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payload));

      updateGameState();
    }

    if (result.method === 'clean') {
      const clientId = result.clientId;
      const userName = result.userName;

      activeUsers = activeUsers.map((user) => user.name === userName ? { ...initialUser, place: user.place } : user);

      const cleanPayload = {
        method: 'clean',
        clientId,
        users: activeUsers,
      }

      const con = clients[clientId].connection;
      con.send(JSON.stringify(cleanPayload));
    }
  })
});

app.get('/', (req, res) => res.send('SIEMA'))

server.listen(PORT, () => console.log(`No odpaliłem, port ${PORT}`));

const updateGameState = () => {
  activeUsers = activeUsers.map(user => ({ ...user, cards: [] }));
  activeUsers.forEach(usr => {
    if (usr.uuid) {
      clients[usr.uuid].connection.send(JSON.stringify({ method: 'updatePlaces', users: activeUsers }));
    }
  })
}
