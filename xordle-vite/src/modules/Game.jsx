import { useState, useEffect } from 'react';
import './Game.css';
import socketUtil, { client } from '../util/SocketUtil';
import GameBoard from './GameBoard';

const Game = (props) => {
  const { room, children } = props;
  
  const [gameData, setGameData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [current, setCurrent] = useState([]);

  const isHost = () => gameData?.host === client.id;

  useEffect(() => {
    client.room = room;
    client.emit('JOIN', { room });
    socketUtil.listen('JOIN', setGameData);
    socketUtil.listen('UPDATE', setGameData);
    socketUtil.listen('PLAYER_UPDATE', setPlayerData);
  }, []);

  useEffect(() => {
    if(playerData?.correct === false || playerData?.correct === true) {
      setCurrent([]);
    }
  }, [playerData])

  const handleStartClick = () => {
    if(isHost()) client.emit('START');
  }

  const handleRestartClick = () => {
    if(isHost()) client.emit('END');
  }

  const handleKeyPress = (letter) => {
    if(letter === 'ENTER') {
      if(current.length === 5) {
        client.emit('ENTER_WORD', { current });        
      }
      setCurrent([]);
    } else if(letter) {
      setCurrent(prev => {
        const res = prev.length < 5 ? [...prev, letter] : prev;
        return res;
      });
    } else {
      setCurrent(prev => {
        if(prev.length === 0) return [];
        const res = [...prev];
        res.pop();
        return res;
      });
    }
  }

  return (
    <div className="flex-col flex-fill game">
      {!gameData?.status > 0 && children}

      { gameData?.status === 2 &&
        <div className="flex-col flex-fill game-end">
          <label className="game-end-word"> WORD: {gameData?.word} </label>
          { gameData?.winOrder.map((name, i) => {
              return i < 4 ? <label className="game-end-word" key={i+name}> {i+1}. {name} </label> : null
            })
          }
          <button className={!isHost() ? 'hidden' : ''} onClick={handleRestartClick}> RESTART </button>
        </div>
      }

      { gameData?.status > 0 && 
        <GameBoard 
          keys={playerData?.keys}
          history={playerData?.history} 
          current={current}
          onKeyPress={handleKeyPress}
          inProgress={playerData?.inProgress}
          timeRemaining={playerData?.timeRemaining}
          keyboardDisabled={!playerData?.inProgress}
          name={playerData?.name || client.name}
          room={room}
        /> 
      }
      
      { gameData?.status === 0 && (
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