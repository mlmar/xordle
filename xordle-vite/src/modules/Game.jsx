import { useState, useEffect } from 'react';
import './Game.css';
import socketUtil, { client } from '../util/SocketUtil';
import { isValidLetter } from '../util/Util';
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
      setCurrent(data?.current);
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
      if(current.length === 5) {
        client.emit('ENTER_WORD');        
      } else {
        setCurrent([]);
      }
    } else if(letter) {
      setCurrent(prev => {
        const res = prev.length < 5 ? [...prev, letter] : prev;
        client.emit('SET_CURRENT', { current: res });
        return res;
      });
    } else {
      setCurrent(prev => {
        if(prev.length === 0) return [];
        const res = [...prev];
        res.pop();
        client.emit('SET_CURRENT', { current: res });
        return res;
      });
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