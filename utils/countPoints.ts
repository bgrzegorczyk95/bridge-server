import { pointsValues } from "./dict";

export const countPoints = (game: any) => {
  const bestBidValue = parseInt(game.bestBid.value, 10);
  const bestBidPair = (game.bestBid.place === 'N' || game.bestBid.place === 'S') ? 'NS' : 'EW';
  const oppositePair = (game.bestBid.place === 'N' || game.bestBid.place === 'S') ? 'EW' : 'NS';
  const isAfterPart = game.gamePoints.afterPart.includes(bestBidPair);
  const isOpositeAfterPart = game.gamePoints.afterPart.includes(oppositePair);
  const gameNumber = game.gamePoints.games;
  let pointsUnder = game.gamePoints[bestBidPair].under[gameNumber];
  let pointsAbove = game.gamePoints[bestBidPair].above;

  if (game.gamePoints[bestBidPair].round >= bestBidValue + 6) {
    const surplus = game.gamePoints[bestBidPair].round - (bestBidValue + 6);

    if (!game.bestBid.doubled && !game.bestBid.redoubled && (!isAfterPart || isAfterPart)) {
      if (game.bestBid.colorName !== 'NT') {
        pointsUnder += bestBidValue * pointsValues.normal[game.bestBid.colorName];
      } else {
        pointsUnder += (bestBidValue * pointsValues.normal.NT) + 10;
      }
      pointsAbove += surplus * pointsValues.normal[game.bestBid.colorName];
    } else if (game.bestBid.doubled && !game.bestBid.redoubled && !isAfterPart) {
      if (game.bestBid.colorName !== 'NT') {
        pointsUnder += bestBidValue * pointsValues.doubled[game.bestBid.colorName];
      } else {
        pointsUnder += (bestBidValue * pointsValues.doubled.NT) + 20;
      }
      pointsAbove += surplus * 100;
    } else if (!game.bestBid.doubled && game.bestBid.redoubled && !isAfterPart) {
      if (game.bestBid.colorName !== 'NT') {
        pointsUnder += bestBidValue * pointsValues.redoubled[game.bestBid.colorName];
      } else {
        pointsUnder += (bestBidValue * pointsValues.redoubled.NT) + 40;
      }
      pointsAbove += surplus * 200;
    } else if (game.bestBid.doubled && !game.bestBid.redoubled && isAfterPart) {
      if (game.bestBid.colorName !== 'NT') {
        pointsUnder += bestBidValue * pointsValues.doubled[game.bestBid.colorName];
      } else {
        pointsUnder += (bestBidValue * pointsValues.doubled.NT) + 20;
      }
      pointsAbove += surplus * 200;
    } else if (!game.bestBid.doubled && game.bestBid.redoubled && isAfterPart) {
      if (game.bestBid.colorName !== 'NT') {
        pointsUnder += bestBidValue * pointsValues.redoubled[game.bestBid.colorName];
      } else {
        pointsUnder += (bestBidValue * pointsValues.redoubled.NT) + 40;
      }
      pointsAbove += surplus * 400;
    }

    if (game.gamePoints[bestBidPair].round === 12 && !isAfterPart) {
      pointsAbove += 500;
    } else if (game.gamePoints[bestBidPair].round === 12 && isAfterPart) {
      pointsAbove += 750;
    }

    if (game.gamePoints[bestBidPair].round === 13 && !isAfterPart) {
      pointsAbove += 1000;
    } else if (game.gamePoints[bestBidPair].round === 13 && isAfterPart) {
      pointsAbove += 1500;
    }

    if (pointsUnder >= 100) {
      if (!isAfterPart) {
        game.gamePoints.afterPart.push(bestBidPair);
      }

      game.gamePoints[bestBidPair].games += 1;
      game.gamePoints.games += 1;
      game.gamePoints.EW.under.push(0);
      game.gamePoints.NS.under.push(0);

      if (game.gamePoints[bestBidPair].games === 2 && isOpositeAfterPart) {
        pointsAbove += 500;
      } else if (game.gamePoints[bestBidPair].games === 2 && !isOpositeAfterPart) {
        pointsAbove += 700;
      }
    }

  } else {
    const setbackCount = (bestBidValue + 6) - game.gamePoints[bestBidPair].round;

    if (!game.bestBid.doubled && !game.bestBid.redoubled && !isAfterPart) {
      pointsAbove += setbackCount * 50;
    } else if (!game.bestBid.doubled && !game.bestBid.redoubled && isAfterPart) {
      pointsAbove += setbackCount * 100;
    } else if (game.bestBid.doubled && !game.bestBid.redoubled && !isAfterPart) {
      pointsAbove += 100;
      if (setbackCount <= 3 && setbackCount > 1) {
        pointsAbove += 400;
      } else if (setbackCount > 3) {
        pointsAbove += ((setbackCount - 3) * 300) + 400;
      }
    } else if (game.bestBid.doubled && !game.bestBid.redoubled && isAfterPart) {
      pointsAbove += 200;
      if (setbackCount > 1) {
        pointsAbove += (setbackCount - 1) * 300;
      }
    } else if (!game.bestBid.doubled && game.bestBid.redoubled && !isAfterPart) {
      pointsAbove += 200;
      if (setbackCount <= 3 && setbackCount > 1) {
        pointsAbove += 800;
      } else if (setbackCount > 3) {
        pointsAbove += ((setbackCount - 3) * 600) + 800;
      }
    } else if (!game.bestBid.doubled && game.bestBid.redoubled && isAfterPart) {
      pointsAbove += 400;
      if (setbackCount > 1) {
        pointsAbove += (setbackCount - 1) * 600;
      }
    }
  }

  game.gamePoints[bestBidPair].under[gameNumber] = pointsUnder;
  game.gamePoints[bestBidPair].above = pointsAbove;
};