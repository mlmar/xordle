
const guesses = [
  'snipe',
  'swell',
  'spish',
  'spire',
  'trash',
  'panda',
  'arose',
  'azure',
  'spire',
  'spend'
]

const word = 'spend';

const constructTestDataHistory = (guesses, word) => {
  const comp = word.split('');

  const getStatus = (l, i) => {
    if(comp[i] === l) {
      return 1;
    } else if(comp.includes(l)) {
      return 2;
    } else {
      return 0;
    }
  }

  const keys = new Object();

  const history = guesses.map(g => {
    return g.split('').map((letter, i) => {
      const status = getStatus(letter, i);

      keys[letter] = keys[letter] ? Math.max(keys[letter], status) : 0;

      return {
        letter: letter.toUpperCase(),
        status: status,
      }
    })
  });

  return { keys, history };
}

const DATA = {
  ...constructTestDataHistory(guesses, word),
  current: word.toUpperCase().split(''),
}

export default DATA;