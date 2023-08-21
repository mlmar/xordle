import { useState } from 'react';
import './Menu.css';

// UI components
function MenuButton(props) {
  return <button className="flex flex-middle flex-center menu-btn" {...props}></button>
}

function MenuInput(props) {
  return <input className="flex menu-input" {...props}/>
}

/**
 * Menu for name, room code and room
 * @param {function} onClick -- called with object { name, roomCode, roomName } as argument
 */
export default function Menu(props) {
  const { name, roomCode, roomName, onChange, onClick } = props;

  function handleInputChange(event) {
    const id = event.target.id;
    const val = event.target.value.replace(/[^a-z]/gi,'').substring(0,5).toUpperCase();
    if(onChange) {
      onChange({
        name, 
        roomCode, 
        roomName,
        [id]: val
      });
    }
  }

  function handleButtonClick() {
    if(onClick) {
      onClick({
        name,
        roomCode,
        roomName
      })
    }
  }

  return (
    <div className="flex-col flex-middle menu">
      <MenuInput id="name" placeholder="name" value={name} onChange={handleInputChange} autoFocus/>
      <section className="flex-col">
        <MenuInput id="roomCode" placeholder="room code" value={roomCode} onChange={handleInputChange} disabled={!name}/>
        <MenuButton onClick={handleButtonClick} disabled={!roomCode || !name}> join </MenuButton>
      </section>
      <h1> or </h1>
      <section className="flex-col">
        <MenuInput id="roomName" placeholder="room name" value={roomName} onChange={handleInputChange} disabled={!name}/>
        <MenuButton onClick={handleButtonClick} disabled={!roomName || !name}> create </MenuButton>
      </section>
    </div>
  )
}

export const useMenu = function() {
  const [menuProps, setMenuProps] = useState({
    name: '',
    roomCode: '',
    roomName: ''
  });

  function setData(data) {
    setMenuProps(prev => ({...prev, ...data}));
  }

  return [menuProps, setData]
}