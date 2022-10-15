import { useState, useEffect, useRef } from 'react';
import './GameBoard.css';
import CONSTANTS from '../util/Constants';
import { getClassNameByStatus, getClassNameByProgress, isValidLetter } from '../util/Util';
import Keyboard from './Keyboard';

const GameBoard = (props) => {
  const { keys, history, inProgress, timeRemaining, keyboardDisabled, onKeyPress, current, room, name } = props;
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
        if(isValidLetter(event.key) && onKeyPress) onKeyPress(event.key.toUpperCase());
        break;
    }
  }

  const getHistory = () => {
    return history?.map((word, i) => {
      if(history.length - 1 === i) {
        return (
          <div className="flex game-board-last" key={word + i}>
            { word?.map((letter, i) => <Letter {...letter} key={letter + i} delay={i * 60} />) }
          </div>
        )
      } else {
        return (
          <div className="flex" key={word + i}>
            { word?.map((letter, i) => <Letter {...letter} key={letter + i}/>) }
          </div>
        )
      }
    })
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
      <label className="floating-purple-text float-left"> {name} </label>
      <label className="floating-purple-text float-right"> {room} </label>
      <div className="flex-col flex-fill overflow game-board-list">
        {getHistory()}
        <div className="flex game-board-current" ref={lastWordRef} key={history?.length}>
          {inProgress && getCurrent()}
        </div>
      </div>
      <Progress className="game-board-progress" progress={timeRemaining}/>
      <Keyboard keys={keys} disabled={keyboardDisabled} onClick={handleKeyDown}/>
    </div>
  )
}

// decimal point progress
const Progress = ({ className, progress }) => {
  const calculatedProgress = progress * 100;
  const progressClassName = [className || '', 'flex progress'].join(' ');
  const barClassName = ['flex progress-bar', getClassNameByProgress(calculatedProgress)].join(' ');
  const style = { width: calculatedProgress + '%' };
  return (
    <div className={progressClassName}>
      <div className={barClassName} style={style}></div>
    </div>
  )
}

const Letter = ({ letter, status, delay }) => {
  const [bgClass, setBgClass] = useState('bg-placeholder');
  
  useEffect(() => {
    if(delay) {
      setTimeout(() => {
        setBgClass(getClassNameByStatus(status))
      }, delay)
    }
  }, [status, delay])
  
  const letterStlye = ['flex game-board-letter', !delay ? getClassNameByStatus(status) : bgClass].join(' ');
  return (
    <div className="game-board-letter-wrapper">
      <span className={letterStlye}> {letter || CONSTANTS.BLANK} </span>
    </div>
  )
}

export default GameBoard;