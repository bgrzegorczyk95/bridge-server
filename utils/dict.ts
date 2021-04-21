export const turnPlaces = {
  N: 'E',
  W: 'N',
  S: 'W',
  E: 'S',
};

export const dummyPlace = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

export const openedPlaceType = {
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

export const pointsValues = {
  normal: {
    S: 30,
    H: 30,
    C: 20,
    D: 20,
    NT: 30,
  },
  doubled: {
    S: 60,
    H: 60,
    C: 40,
    D: 40,
    NT: 60,
  },
  redoubled: {
    S: 120,
    H: 120,
    C: 80,
    D: 80,
    NT: 120,
  },
};
