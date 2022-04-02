import { useState, useEffect } from 'react';
import './Game.css';
import socketUtil, { client } from '../util/SocketUtil';
import GameBoard from './GameBoard';

const Game = (props) => {
  const { host, room } = props;
  
  const [gameData, setGameData] = useState(null);
  const [current, setCurrent] = useState([]);

  useEffect(() => {
    client.emit('JOIN', { room });
    socketUtil.listen('JOIN', setGameData);
    socketUtil.listen('UPDATE', (data) => {
      setGameData(data);
    });
  }, []);

  useEffect(() => {
    if(current !== gameData?.current) {
      setCurrent(gameData?.current);
    }
  }, [current, gameData]);

  const handleStartClick = () => {
    if(host) client.emit('START');
  }

  const handleRestartClick = () => {
    if(host) client.emit('END');
  }

  const handleKeyPress = (letter) => {
    if(letter === 'ENTER') {
      setCurrent([]);
      client.emit('ENTER_WORD');
    } else if(letter) {
      setCurrent(prev => prev.length < 5 ? [...prev, letter] : prev);
      client.emit('PRESS_LETTER', { letter });
    } else {
      setCurrent(prev => {
        let temp = [...prev];
        temp.pop();
        return temp;
      })
      client.emit('REMOVE_LETTER');
    }
  }


  return (
    <div className="flex-col flex-fill game">
      { (gameData?.inProgress && !gameData?.turn) &&
        <div className="flex-col flex-fill game-end">
          <label className="game-end-label"> Word: </label>
          <label className="game-end-word"> {gameData?.word}  </label>
          <button className={!host ? 'hidden' : ''} onClick={handleRestartClick}> RESTART </button>
        </div>
      }

      { gameData?.inProgress && 
        <GameBoard 
          keys={gameData?.keys}
          history={gameData?.history} 
          current={current} 
          onKeyPress={handleKeyPress} 
          inProgress={gameData?.turn} 
          keyboardDisabled={gameData?.turn !== client?.id}
        /> 
      }
      { !gameData?.inProgress && (
          <div className="flex-col flex-fill game-lobby">
            <label className="flex room-code"> {gameData?.id} </label>
            <p className="flex-col flex-fill"> {gameData?.playerCount} PLAYER{gameData?.playerCount > 1 ? 'S' : ''} </p>
            <button className="start-btn" onClick={handleStartClick}> 
              {host ? 'START' : 'WAITING FOR HOST'} 
            </button>
          </div>
        )
      }

    </div>
  )
}

export default Game;