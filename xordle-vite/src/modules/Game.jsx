import { useState, useEffect } from 'react';
import './Game.css';
import socketUtil, { client } from '../util/SocketUtil';
import DATA from '../util/TestData';
import GameBoard from './GameBoard';

const Game = (props) => {
  const { host, room } = props;

  const [inProgress, setInProgress] = useState(false);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    client.emit('JOIN', { room });
    socketUtil.listen('JOIN', setGameData);
  }, [])

  const handleStartClick = () => {
    setInProgress(true);
  }

  return (
    <div className="flex-col flex-fill game">
      { inProgress && <GameBoard history={DATA.history} current={DATA.current} inProgress={inProgress}/> }
      { !inProgress && (
          <div className="flex-col flex-fill game-lobby">
            <label className="flex room-code"> {gameData?.id} </label>
            <p className="flex-col"> {gameData?.playerCount} PLAYER{gameData?.playerCount > 1 ? 'S' : ''} </p>
            {host && <button className="start-btn" onClick={handleStartClick}> START </button>}
          </div>
        )
      }
    </div>
  )
}

export default Game;