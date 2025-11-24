import { useState, useEffect, useRef } from 'react';
import './GameBoard.less';
import CONSTANTS from '../util/Constants';
import {
    LetterStatus,
    getClassNameByStatus,
    getClassNameByProgress,
    isValidLetter,
    getColorByStatus,
} from '../util/LetterUtil';
import Keyboard from './Keyboard';

/**
 * Component which displays remaining time, entered words, current word and keyboard
 */
const GameBoard = (props) => {
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
        name, // Player name
        message, // Server message
    } = props;

    const gameBoardRef = useRef(null);
    const lastWordRef = useRef(null);

    // Auto focus keyboard
    useEffect(() => {
        gameBoardRef?.current?.focus();
    }, [gameBoardRef]);

    // Scroll last word into view
    useEffect(() => {
        lastWordRef.current.scrollIntoView();
    }, [current]);

    // Handle key events
    const handleKeyDown = (event) => {
        if (keyboardDisabled) return;
        switch (event.key.toUpperCase()) {
            case 'ENTER':
                if (onKeyPress) onKeyPress('ENTER');
                break;
            case 'BACKSPACE':
                if (onKeyPress) onKeyPress(null);
                break;
            default:
                if (isValidLetter(event.key) && onKeyPress) onKeyPress(event.key.toUpperCase());
                break;
        }
    };

    // Render word history
    const renderHistory = () => {
        return history?.map((word, i) => {
            if (history.length - 1 === i) {
                return (
                    <div className='flex game-board-last' key={word + i}>
                        {word?.map((letter, i) => (
                            <Letter {...letter} key={letter + i} delay={i * 0.5} />
                        ))}
                    </div>
                );
            } else {
                return (
                    <div className='flex' key={word + i}>
                        {word?.map((letter, i) => (
                            <Letter {...letter} key={letter + i} />
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
                />
            );
        }
        return result;
    };

    return (
        <div className='game-board flex-col flex-fill ' onKeyDown={handleKeyDown} tabIndex='0' ref={gameBoardRef}>
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

// Progress bar to display remaining time for in game timer
const Progress = ({ className, progress }) => {
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

// Letter that is rendered in history list
const Letter = ({ letter, status = LetterStatus.PLACEHOLDER, delay = 0 }) => {
    const letterClassNames =
        'flex game-board-letter ' + (status >= LetterStatus.PLACEHOLDER ? getClassNameByStatus(status) : '');
    return (
        <div
            className='game-board-letter-wrapper'
            style={{
                '--bg-delay': `${delay}s`,
                '--bg-letter': getColorByStatus(status),
            }}
        >
            <span className={letterClassNames}> {letter || <>&nbsp;</>} </span>
        </div>
    );
};

export default GameBoard;
