import { useState } from 'react';
import './App.css';
import CONSTANTS from './util/Constants';
import Menu from './modules/Menu';
import Game from './modules/Game';

const App = () => {
  const [view, setView] = useState(CONSTANTS.VIEW);

  const getView = () => {
    switch(view) {
      case 'create':
        return <Game/>
      default:
        return (
          <div className="main-screen flex-col flex-fill">
            <label className="flex title-label"> XORDLE </label>
            <Menu options={CONSTANTS.MENU_OPTIONS} onClick={setView}/>
          </div>
        );
    }
  }

  return (
    <div className="app">
      {getView()}
    </div>
  )
}

export default App