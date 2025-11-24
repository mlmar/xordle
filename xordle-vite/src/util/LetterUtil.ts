export const LetterStatus = {
    CORRECT: 1,
    EXISTS: 2,
    NOTHING: 3,
    PLACEHOLDER: 4,
    EMPTY: 5,
} as const;

export const getClassNameByStatus = (status: number) => {
    switch (status) {
        case LetterStatus.CORRECT:
            return 'bg-green';
        case LetterStatus.EXISTS:
            return 'bg-yellow';
        case LetterStatus.NOTHING:
            return 'bg-neutral';
        case LetterStatus.PLACEHOLDER:
            return 'bg-placeholder active';
        case LetterStatus.EMPTY:
            return 'bg-placeholder';
        default:
            return 'bg-gray';
    }
};

export const getColorByStatus = (status: number) => {
    switch (status) {
        case LetterStatus.CORRECT:
            return 'var(--green)';
        case LetterStatus.EXISTS:
            return 'var(--yellow)';
        case LetterStatus.NOTHING:
            return 'var(--neutral)';
        case LetterStatus.PLACEHOLDER:
            return 'transparent';
        case LetterStatus.EMPTY:
            return 'transparent';
        default:
            return 'var(--gray)';
    }
};

export const getClassNameByProgress = (progress: number) => {
    if (progress < 33) {
        return 'bg-red';
    } else if (progress < 66) {
        return 'bg-yellow';
    } else {
        return 'bg-green';
    }
};

export const isValidLetter = (letter: string) => /^[a-zA-Z]$/.test(letter);
export const isValidWord = (word: string) => /^[a-zA-Z]+$/.test(word);
