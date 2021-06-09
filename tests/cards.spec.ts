import 'mocha';
import { expect } from 'chai';
import { cardsMock } from './mocks';
import { setInitialCards } from '../app';

describe('Cards', () => {
  it ('should return all players with 13 cards amount', () => {
    const players = setInitialCards(cardsMock);

    expect(players[0].cardsAmount).to.equal(13);
    expect(players[1].cardsAmount).to.equal(13);
    expect(players[2].cardsAmount).to.equal(13);
    expect(players[3].cardsAmount).to.equal(13);
  });
});
