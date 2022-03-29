import { useReducer, useEffect, useRef } from 'react';
import './App.css';
import CONSTANTS from './util/Constants';
import SocketWrapper from './modules/SocketWrapper';
import socketUtil, { client } from './util/SocketUtil';
import Menu from './modules/Menu';
import Game from './modules/Game';

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const sending = useRef(false);

  useEffect(() => {
    socketUtil.listen('CREATE', (room) => {
        dispatch({ 
          type: 'join',
          payload: {
            room: room,
            host: true
          }
        });
        sending.current = false;
      });
  }, []);

  const handleMenuClick = (id) => {
    if(sending.current) return;
    sending.current = true;

    switch(id) {
      case CONSTANTS.CREATE:
        client.emit('CREATE');
        break;
      default:
        return;
    }
  }

  const getView = () => {
    switch(state.view) {
      case 'game':
        return <Game host={true} room={state.room}/>
      default:
        return (
          <div className="main-screen flex-col flex-fill">
            <label className="flex title-label"> XORDLE </label>
            <Menu options={CONSTANTS.MENU_OPTIONS} onClick={handleMenuClick}/>
          </div>
        );
    }
  }

  return (
    <div className="app">
      <SocketWrapper>
        {getView()}
      </SocketWrapper>
    </div>
  )
}


const reducer = (state, action) => {
  const { type, payload } = action;
  switch(type) {
    case 'join':
      return { ...state, view: 'game', room: payload.room, host: payload.host};
    default:
      return { ...state };
  }
}

const initialState = {
  view: CONSTANTS.VIEW,
  room: null
}


export default App