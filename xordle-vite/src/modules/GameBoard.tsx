import { useEffect, useRef } from 'react';
import type { LetterData, PlayerData } from '@xordle/common';

import './GameBoard.less';
import {
    LetterStatus,
    getClassNameByStatus,
    getClassNameByProgress,
    isValidLetter,
    getColorByStatus,
} from '../util/LetterUtil';
import Keyboard from './Keyboard';

interface GameBoardProps {
    keys: PlayerData['keys'] | undefined; // Keyboard key colors/states
    history: PlayerData['history'] | undefined; // Used words
    inProgress: boolean; // Game is in progress
    timeRemaining: number; // Remaining game time
    showTimeRemaining: boolean; // Toggles time remaining visibility
    keyboardDisabled: boolean; // Toggles keyboard functionality
    onKeyPress?: (key: string | null) => void; // Handles keyboard press
    current: string[]; // Current word input
    room: string; // Room number
    message: string; // Server message
}

/**
 * Component which displays remaining time, entered words, current word and keyboard
 */
const GameBoard = (props: GameBoardProps) => {
    const {
        keys, // Keyboard key colors/states
        history, // Used words
        inProgress, // Game is in progress
        timeRemaining, // Remaining game time
        showTimeRemaining, // Toggles time remaining visibility
        keyboardDisabled, // Toggles keyboard functionality
        onKeyPress, // Handles keyboard press
        current, // Current word input
        room, // Room number
        message, // Server message
    } = props;

    const gameBoardRef = useRef<HTMLDivElement>(null);
    const lastWordRef = useRef<HTMLDivElement>(null);

    // Auto focus keyboard
    useEffect(() => {
        if (gameBoardRef.current) {
            gameBoardRef.current.focus();
        }
    }, [gameBoardRef]);

    // Scroll last word into view
    useEffect(() => {
        if (lastWordRef.current) {
            lastWordRef.current.scrollIntoView();
        }
    }, [current]);

    // Handle key events
    const handleKeyDown = ({ key }: { key: string }) => {
        if (keyboardDisabled) return;
        switch (key.toUpperCase()) {
            case 'ENTER':
                if (onKeyPress) onKeyPress('ENTER');
                break;
            case 'BACKSPACE':
                if (onKeyPress) onKeyPress(null);
                break;
            default:
                if (isValidLetter(key) && onKeyPress) onKeyPress(key.toUpperCase());
                break;
        }
    };

    // Render word history
    const renderHistory = () => {
        return history?.map((word: LetterData[], i: number) => {
            if (history.length - 1 === i) {
                return (
                    <div className='flex game-board-last' key={wordToString(word) + i}>
                        {word?.map((letterData: LetterData, i: number) => (
                            <Letter {...letterData} key={letterData.letter + i} delay={i * 0.1} />
                        ))}
                    </div>
                );
            } else {
                return (
                    <div className='flex' key={wordToString(word) + i}>
                        {word?.map((letterData: LetterData, i: number) => (
                            <Letter {...letterData} key={letterData.letter + i} />
                        ))}
                    </div>
                );
            }
        });
    };

    // Render current word input
    const renderCurrent = () => {
        const result = [];
        for (let i = 0; i < 5; i++) {
            result.push(
                <Letter
                    letter={current[i]}
                    status={current[i] ? LetterStatus.PLACEHOLDER : LetterStatus.EMPTY}
                    key={(current[i] || '') + i}
                />,
            );
        }
        return result;
    };

    return (
        <div className='game-board flex-col flex-fill ' onKeyDown={handleKeyDown} tabIndex={0} ref={gameBoardRef}>
            <label className='floating-purple-text float-left'> {message} </label>
            <label className='floating-purple-text float-right'> {room} </label>
            <div className='flex-col flex-fill overflow game-board-list'>
                {renderHistory()}
                <div className='flex game-board-current' ref={lastWordRef} key={history?.length}>
                    {inProgress && renderCurrent()}
                </div>
            </div>
            {showTimeRemaining && <Progress className='game-board-progress' progress={timeRemaining} />}
            <Keyboard keys={keys} disabled={keyboardDisabled} onClick={handleKeyDown} />
        </div>
    );
};

function wordToString(word: LetterData[]): string {
    return word.reduce((result: string, letterData: LetterData) => result + letterData, '');
}

interface ProgressProps {
    className: string;
    progress: number;
}

// Progress bar to display remaining time for in game timer
const Progress = ({ className, progress }: ProgressProps) => {
    const calculatedProgress = progress * 100;
    const progressClassName = [className || '', 'flex progress'].join(' ');
    const barClassName = ['flex progress-bar', getClassNameByProgress(calculatedProgress)].join(' ');
    const style = { width: calculatedProgress + '%' };
    return (
        <div className={progressClassName}>
            <div className={barClassName} style={style}></div>
        </div>
    );
};

interface LetterProps extends LetterData {
    delay?: number;
}

// Letter that is rendered in history list
const Letter = ({ letter, status = LetterStatus.PLACEHOLDER, delay = 0 }: LetterProps) => {
    const letterClassNames =
        'flex game-board-letter ' + (status >= LetterStatus.PLACEHOLDER ? getClassNameByStatus(status) : '');
    return (
        <div
            className='game-board-letter-wrapper'
            style={
                {
                    '--bg-delay': `${delay}s`,
                    '--bg-letter': getColorByStatus(status),
                } as React.CSSProperties
            }
        >
            <span className={letterClassNames}> {letter || <>&nbsp;</>} </span>
        </div>
    );
};

export default GameBoard;
