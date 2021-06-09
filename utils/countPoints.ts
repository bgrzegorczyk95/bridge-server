import { Game } from "../@types/types";
import { pointsValues } from "./dict";
import { updateGamePoints } from "./initialValues";

export const countPoints = (game: Game) => {
  const trumpValue: number = parseInt(game.trump.value, 10);
  const trumpPair: string = (game.trump.place === 'N' || game.trump.place === 'S') ? 'NS' : 'EW';
  const oppositePair: string = (game.trump.place === 'N' || game.trump.place === 'S') ? 'EW' : 'NS';
  const isAfterPart: boolean = game.gamePoints.afterPart.includes(trumpPair);
  const isOpositeAfterPart: boolean = game.gamePoints.afterPart.includes(oppositePair);
  const gameNumber: number = game.gamePoints.games;
  const isDoubled = game.trump.doubled;
  const isRedoubled = game.trump.redoubled;

  let pointsUnder: number = game.gamePoints[trumpPair].under[gameNumber] || 0;
  let pointsAbove: number = game.gamePoints[trumpPair].above || 0;

  const bestPairRounds = game.gamePoints[trumpPair].round;
  const pairPoints: string = bestPairRounds >= trumpValue + 6 ? trumpPair : oppositePair;

  if (bestPairRounds >= trumpValue + 6) {
    const surplus = bestPairRounds - (trumpValue + 6);
    const colorName = game.trump.colorName;
    const isColorNT = colorName === 'NT';

    if (!isDoubled && !isRedoubled && (!isAfterPart || isAfterPart)) {
      pointsUnder += (trumpValue * pointsValues.normal[colorName]) + (isColorNT ? 10 : 0);
      pointsAbove += surplus * pointsValues.normal[colorName];
    } else if (isDoubled && !isRedoubled && !isAfterPart) {
      pointsUnder += (trumpValue * pointsValues.doubled[colorName]) + (isColorNT ? 20 : 0);
      pointsAbove += surplus * 100;
    } else if (!isDoubled && isRedoubled && !isAfterPart) {
      pointsUnder += (trumpValue * pointsValues.redoubled[colorName]) + (isColorNT ? 40 : 0);
      pointsAbove += surplus * 200;
    } else if (isDoubled && !isRedoubled && isAfterPart) {
      pointsUnder += (trumpValue * pointsValues.doubled[colorName]) + (isColorNT ? 20 : 0);
      pointsAbove += surplus * 200;
    } else if (!isDoubled && isRedoubled && isAfterPart) {
      pointsUnder += (trumpValue * pointsValues.redoubled[colorName]) + (isColorNT ? 40 : 0);
      pointsAbove += surplus * 400;
    }

    if (bestPairRounds === 12 && !isAfterPart) {
      pointsAbove += 500;
    } else if (bestPairRounds === 12 && isAfterPart) {
      pointsAbove += 750;
    }

    if (bestPairRounds === 13 && !isAfterPart) {
      pointsAbove += 1000;
    } else if (bestPairRounds === 13 && isAfterPart) {
      pointsAbove += 1500;
    }

    if (pointsUnder >= 100) {
      if (!isAfterPart) {
        game.gamePoints.afterPart.push(trumpPair);
      }

      game.gamePoints[trumpPair].games += 1;
      game.gamePoints.games += 1;
      game.gamePoints.EW.under.push(0);
      game.gamePoints.NS.under.push(0);

      const bestPairGames = game.gamePoints[trumpPair].games;

      if (bestPairGames === 2 && isOpositeAfterPart) {
        pointsAbove += 500;
      } else if (bestPairGames === 2 && !isOpositeAfterPart) {
        pointsAbove += 700;
      }
    }
  } else {
    const oppositePairRounds = (trumpValue + 6) - bestPairRounds;

    if (!isDoubled && !isRedoubled && !isAfterPart) {
      pointsAbove += oppositePairRounds * 50;
    } else if (!isDoubled && !isRedoubled && isAfterPart) {
      pointsAbove += oppositePairRounds * 100;
    } else if (isDoubled && !isRedoubled && !isAfterPart) {
      pointsAbove += 100;
      if (oppositePairRounds <= 3 && oppositePairRounds > 1) {
        pointsAbove += 400;
      } else if (oppositePairRounds > 3) {
        pointsAbove += ((oppositePairRounds - 3) * 300) + 400;
      }
    } else if (isDoubled && !isRedoubled && isAfterPart) {
      pointsAbove += 200;
      if (oppositePairRounds > 1) {
        pointsAbove += (oppositePairRounds - 1) * 300;
      }
    } else if (!isDoubled && isRedoubled && !isAfterPart) {
      pointsAbove += 200;
      if (oppositePairRounds <= 3 && oppositePairRounds > 1) {
        pointsAbove += 800;
      } else if (oppositePairRounds > 3) {
        pointsAbove += ((oppositePairRounds - 3) * 600) + 800;
      }
    } else if (!isDoubled && isRedoubled && isAfterPart) {
      pointsAbove += 400;
      if (oppositePairRounds > 1) {
        pointsAbove += (oppositePairRounds - 1) * 600;
      }
    }
  }

  updateGamePoints(game, gameNumber, pointsUnder, pointsAbove, pairPoints);

  return {
    pairPoints,
    pointsUnder,
    pointsAbove,
  }
};
