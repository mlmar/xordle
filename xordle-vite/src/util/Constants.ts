const TEXT = {
    MENU: 'menu',
    CREATE: 'create',
    JOIN: 'join',
    EXIT: 'exit',
    PLAY: 'play',
}

const CONSTANTS = {
    ...TEXT,
    MENU_OPTIONS: [
        { id: TEXT.CREATE, text: 'CREATE' },
        { id: TEXT.JOIN, text: 'JOIN' },
        // { id: TEXT.EXIT, text: 'Exit' }
    ],

    KEYS: [ // Keyboard keys
        'qwertyuiop'.toUpperCase().split(''),
        'asdfghjkl'.toUpperCase().split(''),
        'zxcvbnm'.toUpperCase().split(''),
    ],

    TRIANGLE_RIGHT: '/TriangleRight.png',
    PING_DELAY: 25000,
}

export default CONSTANTS;