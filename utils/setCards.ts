import { Card, Game } from '../@types/types';
import { getRandomInt } from './randomInt'; 

let selectedCards = [];
let cards = [
  { color: 'C', value: '2' }, { color: 'D', value: '2' }, { color: 'H', value: '2' }, { color: 'S', value: '2' },
  { color: 'C', value: '3' }, { color: 'D', value: '3' }, { color: 'H', value: '3' }, { color: 'S', value: '3' },
  { color: 'C', value: '4' }, { color: 'D', value: '4' }, { color: 'H', value: '4' }, { color: 'S', value: '4' },
  { color: 'C', value: '5' }, { color: 'D', value: '5' }, { color: 'H', value: '5' }, { color: 'S', value: '5' },
  { color: 'C', value: '6' }, { color: 'D', value: '6' }, { color: 'H', value: '6' }, { color: 'S', value: '6' },
  { color: 'C', value: '7' }, { color: 'D', value: '7' }, { color: 'H', value: '7' }, { color: 'S', value: '7' },
  { color: 'C', value: '8' }, { color: 'D', value: '8' }, { color: 'H', value: '8' }, { color: 'S', value: '8' },
  { color: 'C', value: '9' }, { color: 'D', value: '9' }, { color: 'H', value: '9' }, { color: 'S', value: '9' },
  { color: 'C', value: '10' }, { color: 'D', value: '10' }, { color: 'H', value: '10' }, { color: 'S', value: '10' },
  { color: 'C', value: 'J' }, { color: 'D', value: 'J' }, { color: 'H', value: 'J' }, { color: 'S', value: 'J' },
  { color: 'C', value: 'Q' }, { color: 'D', value: 'Q' }, { color: 'H', value: 'Q' }, { color: 'S', value: 'Q' },
  { color: 'C', value: 'K' }, { color: 'D', value: 'K' }, { color: 'H', value: 'K' }, { color: 'S', value: 'K' },
  { color: 'C', value: 'A' }, { color: 'D', value: 'A' }, { color: 'H', value: 'A' }, { color: 'S', value: 'A' },
];
const cardValuesWeights = {
  '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12, 'A': 13,
};

const cardColorWeight = { S: 1, H: 0.75, D: 0.5, C: 0.25 };

export const resetSelectedCards = () => {
  selectedCards = [];
};

export const sortCards = (cards) => {
  let changes = 0;
  const sortedCards = [...cards];

  do {
    changes = 0;
    for (let i = 0; i < sortedCards.length - 1; i += 1) {
      if (cardColorWeight[sortedCards[i + 1].color] > cardColorWeight[sortedCards[i].color] ||
        (cardColorWeight[sortedCards[i + 1].color] === cardColorWeight[sortedCards[i].color] && cardValuesWeights[sortedCards[i + 1].value] > cardValuesWeights[sortedCards[i].value])) {
          const card = sortedCards[i];
          sortedCards[i] = sortedCards[i + 1];
          sortedCards[i + 1] = card;
          changes += 1;
        }
    }
  } while(changes !== 0);

  return sortedCards;
};

export const setCards = (game: Game) => {
  const playerCards: Card[] = [];
  let cardsCount: number = 0;

  while (cardsCount < 13) {
    const cardIndexNumber = getRandomInt(0, cards.length - 1);

    if (!game.selectedCards.includes(cards[cardIndexNumber]) && !playerCards.includes(cards[cardIndexNumber])) {
      playerCards.push(cards[cardIndexNumber]);
      game.selectedCards.push(cards[cardIndexNumber]);
      cardsCount += 1;
    }
  }

  return sortCards(playerCards);
}
