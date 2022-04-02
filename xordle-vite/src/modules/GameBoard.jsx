import { useEffect, useRef } from 'react';
import './GameBoard.css';
import CONSTANTS from '../util/Constants';
import { getClassNameByStatus, uuidv4 } from '../util/Util';
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
      result.push(<Letter letter={current[i] || CONSTANTS.BLANK} status={5} key={uuidv4()}/>);
    }
    return result;
  }

  return (
    <div className="game-board flex-col flex-fill " onKeyDown={handleKeyDown} tabIndex="0" ref={gameBoardRef}>
      <div className="flex-col flex-fill overflow game-board-list">
        {
          history?.map((word, i) => {
            return (
              <div className="flex" key={word + i}>
                {
                  word?.map((letter, i) => <Letter {...letter} key={letter + i}/>)
                }
              </div>
            )
          })
        }
        <div className="flex" ref={lastWordRef}>
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
      <span className={letterStlye}> {letter} </span>
    </div>
  )
}

export default GameBoard;