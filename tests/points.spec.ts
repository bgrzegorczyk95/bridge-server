import 'mocha';
import { expect } from 'chai';

import { countPoints } from '../utils/countPoints';
import { setScore } from '../app';
import { mockEndGame, mockGameWhenNotPerform, mockGameWhenPerform } from './mocks';

describe('Points counting', () => {
  it ('should return points and pair name after game when pair will perform contract', () => {
    const { pairPoints, pointsAbove, pointsUnder } = countPoints(mockGameWhenPerform);

    expect(pairPoints).to.equal('EW');
    expect(pointsAbove).to.equal(30);
    expect(pointsUnder).to.equal(120);
  });

  it ('should return points and pair name after game when pair will not perform contract', () => {
    const { pairPoints, pointsAbove, pointsUnder } = countPoints(mockGameWhenNotPerform);

    expect(pairPoints).to.equal('NS');
    expect(pointsAbove).to.equal(150);
    expect(pointsUnder).to.equal(0);
  });

  it ('should count all points when game finished', () => {
    const { scoreEw, scoreNs } = setScore(mockEndGame);

    expect(scoreEw).to.equal(1460);
    expect(scoreNs).to.equal(1720);
  });
});
