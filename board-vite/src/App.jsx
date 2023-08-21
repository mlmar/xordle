import { useState } from 'react';
import './App.css';
import Menu, { useMenu } from './modules/menu/Menu.jsx';
import Lobby from './modules/lobby/Lobby.jsx';
import Game from './modules/game/Game';

function App() {
  const [menuProps, setMenuProps] = useMenu();
  const [roomData, setRoomData] = useState(null);

  function handleLobbyStart() {
    setRoomData({
      inProgress: true
    })
  }

  function handleMenuClick(data) {
    setRoomData({
      roomName: 'TEST',
      inProgress: false
    });
  }

  const showMenu = !roomData;
  const showLobby = roomData && !roomData?.inProgress;
  const showGame = roomData && roomData?.inProgress;

  return (
    <main className="flex-col flex-fill flex-center flex-middle">
      { showMenu && <Menu {...menuProps} onChange={setMenuProps} onClick={handleMenuClick}/> }
      { showLobby && <Lobby roomName={roomData?.roomName} onStart={handleLobbyStart}/> }
      { showGame && <Game/> }
    </main>
  )
}

export default App
