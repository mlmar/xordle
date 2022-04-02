import { useEffect, useRef } from 'react';
import './GameBoard.css';
import CONSTANTS from '../util/Constants';
import { getClassNameByStatus } from '../util/Util';
import Keyboard from './Keyboard';

const GameBoard = (props) => {
  const { keys, history, inProgress, keyboardDisabled, onKeyPress, current } = props;
  const gameBoardRef = useRef(null);
  const lastWordRef = useRef(null);

  useEffect(() => {
    gameBoardRef?.current?.focus();
  }, [gameBoardRef])

  useEffect(() => {
    lastWordRef.current.scrollIntoView();
  }, [current]);

  const handleKeyDown = (event) => {
    if(keyboardDisabled) return;

    switch(event.key.toUpperCase()) {
      case 'ENTER':
        if(onKeyPress) onKeyPress('ENTER');
        break;
      case 'BACKSPACE':
        if(onKeyPress) onKeyPress(null);
        break;
      default:
        if((/^[a-zA-Z]$/.test(event.key))) {
          if(onKeyPress) onKeyPress(event.key);
        }
        break;
    }
  }

  const getCurrent = () => {
    const result = [];
    for(let i = 0; i < 5; i++) {
      result.push(<Letter letter={current[i]} status={current[i] ? 4 : 5} key={(current[i] || '') + i}/>);
    }
    return result;
  }

  return (
    <div className="game-board flex-col flex-fill " onKeyDown={handleKeyDown} tabIndex="0" ref={gameBoardRef}>
      <div className="flex-col flex-fill overflow game-board-list">
        {
          history?.map((word, i) => {
            return (
              <div className={'flex ' + (i === history.length - 1 ? 'game-board-last' : '') } key={word + i}>
                {
                  word?.map((letter, i) => <Letter {...letter} key={letter + i}/>)
                }
              </div>
            )
          })
        }
        <div className="flex game-board-current" ref={lastWordRef} key={history?.length}>
          {inProgress && getCurrent()}
        </div>
      </div>
      <Keyboard keys={keys} disabled={keyboardDisabled} onClick={handleKeyDown}/>
    </div>
  )
}

const Letter = ({ letter, status }) => {
  const letterStlye = ['flex game-board-letter', getClassNameByStatus(status)].join(' ');
  return (
    <div className="game-board-letter-wrapper">
      <span className={letterStlye}> {letter || CONSTANTS.BLANK} </span>
    </div>
  )
}

export default GameBoard;