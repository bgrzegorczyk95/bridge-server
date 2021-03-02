const express = require("express");
const socket = require("socket.io");

// App setup
const PORT = 5000;
const app = express();

const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.json());

// Socket setup
const io = socket(server, { upgrade: false });

let activeUsers = [
  { place: 'N', takenPlace: false, user: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'S', takenPlace: false, user: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'E', takenPlace: false, user: undefined, cards: [], cardsAmount: 0, isReady: false },
  { place: 'W', takenPlace: false, user: undefined, cards: [], cardsAmount: 0, isReady: false },
];

let cards = [
  '2C', '2D', '2H', '2S', '3C', '3D', '3H', '3S',
  '4C', '4D', '4H', '4S', '5C', '5D', '5H', '5S',
  '6C', '6D', '6H', '6S', '7C', '7D', '7H', '7S',
  '8C', '8D', '8H', '8S', '9C', '9D', '9H', '9S',
  '10C', '10D', '10H', '10S', 'JC', 'JD', 'JH', 'JS',
  'QC', 'QD', 'QH', 'QS', 'KC', 'KD', 'KH', 'KS',
  'AC', 'AD', 'AH', 'AS'
];

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const checkIfCardAlreadyExists = (card) => {
  let cardAlreadyExists = false;

  for (let user of activeUsers) {
    if (user.cards.includes(card)) {
      cardAlreadyExists = true;
    }
  }

  return cardAlreadyExists;
}

const setCards = () => {
  const playerCards = [];
  let cardsCount = 0;

  while (cardsCount < 13) {
    const cardIndexNumber = getRandomInt(0, cards.length - 1);
    const cardAlreadyExists = checkIfCardAlreadyExists(cards[cardIndexNumber]);

    if (!cardAlreadyExists && !playerCards.includes(cards[cardIndexNumber])) {
      playerCards.push(cards[cardIndexNumber]);
      cardsCount += 1;
    }
  }

  return playerCards;
}

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("disconnect", () => {
    const usr = socket.userId;
    activeUsers = activeUsers.map(activeUsers => (activeUsers.user === usr ? { ...activeUsers, takenPlace: false, user: undefined, cards: [] } : activeUsers));

    io.emit("places", activeUsers);
  });

  socket.on("places", (user) => {
    io.emit("places", activeUsers);
  });

  socket.on("clean place", (userName) => {
    activeUsers = activeUsers.map(activeUsers => (activeUsers.user === userName ? { ...activeUsers, takenPlace: false, user: undefined, cards: [] } : activeUsers));

    io.emit("places", activeUsers);
  });

  socket.on("set place", (data) => {
    const userAlreadyExists = activeUsers.filter(activeUsers => activeUsers.user === data.user);
    socket.userId = data.user;

    activeUsers = activeUsers.map(user => {
      if (user.place === data.place && !userAlreadyExists.length && !user.takenPlace) {
        return {
          cards: [],
          place: user.place,
          takenPlace: true,
          user: data.user,
        }
      }
      return { ...user };
    });

    io.emit("places", activeUsers);
  });
});
