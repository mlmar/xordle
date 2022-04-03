import { useState, useEffect } from 'react';
import './Game.css';
import socketUtil, { client } from '../util/SocketUtil';
import GameBoard from './GameBoard';

const Game = (props) => {
  const { room } = props;
  
  const [gameData, setGameData] = useState(null);
  const [current, setCurrent] = useState([]);

  const isHost = () => gameData?.host === client.id;

  useEffect(() => {
    client.emit('JOIN', { room });
    socketUtil.listen('JOIN', setGameData);
    socketUtil.listen('UPDATE', (data) => {
      setGameData(data);
      setCurrent(prev => prev.join('') !== data?.current.join('') ? data?.current : prev);
    });
  }, []);

  const handleStartClick = () => {
    if(isHost()) client.emit('START');
  }

  const handleRestartClick = () => {
    if(isHost()) client.emit('END');
  }

  const handleKeyPress = (letter) => {
    if(letter === 'ENTER') {
      setCurrent([]);
      if(current.length === 5) client.emit('ENTER_WORD');
    } else if(letter) {
      setCurrent(prev => prev.length < 5 ? [...prev, letter.toUpperCase()] : prev);
      if(current.length < 5) client.emit('PRESS_LETTER', { letter });
    } else {
      setCurrent(prev => {
        let temp = [...prev];
        temp.pop();
        return temp;
      })
      if(current.length > 0) client.emit('REMOVE_LETTER');
    }
  }


  return (
    <div className="flex-col flex-fill game">
      { (gameData?.inProgress && !gameData?.turn) &&
        <div className="flex-col flex-fill game-end">
          <label className="game-end-label"> Word: </label>
          <label className="game-end-word"> {gameData?.word} </label>
          <button className={!isHost() ? 'hidden' : ''} onClick={handleRestartClick}> RESTART </button>
        </div>
      }

      { gameData?.inProgress && 
        <GameBoard 
          keys={gameData?.keys}
          history={gameData?.history} 
          current={current}
          onKeyPress={handleKeyPress}
          inProgress={gameData?.turn}
          timeRemaining={gameData?.timeRemaining}
          keyboardDisabled={gameData?.turn !== client?.id}
        /> 
      }
      
      { !gameData?.inProgress && (
          <div className="flex-col flex-fill game-lobby">
            <label className="flex room-code"> {gameData?.id} </label>
            <p className="flex-col flex-fill"> {gameData?.playerCount} PLAYER{gameData?.playerCount > 1 ? 'S' : ''} </p>
            <button className="start-btn" onClick={handleStartClick}> 
              {isHost() ? 'START' : 'WAITING FOR HOST'} 
            </button>
          </div>
        )
      }

    </div>
  )
}

export default Game;