const TEXT = {
  MENU: 'menu',
  CREATE: 'create',
  JOIN: 'join',
  EXIT: 'exit',
  PLAY: 'play',
}

const _CONSTANTS = {
  MENU_OPTIONS: [
    { id: TEXT.CREATE, text: 'CREATE' },
    { id: TEXT.JOIN, text: 'JOIN' },
    // { id: TEXT.EXIT, text: 'Exit' }
  ],

  KEYS: {
    ROW_0: 'qwertyuiop'.toUpperCase().split(''),
    ROW_1: 'asdfghjkl'.toUpperCase().split(''),
    ROW_2: 'zxcvbnm'.toUpperCase().split(''),
  },

  TRIANGLE_RIGHT: '/TriangleRight.png',
  PING_DELAY: 30000,

  BLANK: <>&nbsp;</>,
}

const CONSTANTS = { ...TEXT, ..._CONSTANTS }

export default CONSTANTS;