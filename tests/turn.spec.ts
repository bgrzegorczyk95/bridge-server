import 'mocha';
import { expect } from 'chai';
import { setTurn } from '../app';
import { turnMock } from './mocks';

describe('Turn', () => {
  it ('should return player name when current turn is N', () => {
    const turn = setTurn('N', turnMock);

    expect(turn.name).to.equal('Test 1');
  });
});
