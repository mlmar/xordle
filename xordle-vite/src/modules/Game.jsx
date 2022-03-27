import { useState } from 'react';

import DATA from '../util/TestData';
import GameBoard from './GameBoard';

const Game = () => {
  const [inProgress, setInProgress] = useState(false);

  const handleStartClick = () => {
    setInProgress(true);
  }

  return (
    <div className="flex-col flex-fill">
      { !inProgress && <button onClick={handleStartClick}> Start </button> }
      { inProgress && <GameBoard history={DATA.history} current={DATA.current} inProgress={inProgress}/> }
    </div>
  )
}

export default Game;