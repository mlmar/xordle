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
        type: 'viewJoin',
        payload: { room: room, host: true }
      });
      sending.current = false;
    });
    socketUtil.listen('VERIFY', (room) => {
      sending.current = false;
      if(!room) return;
      dispatch({ 
        type: 'viewJoin',
        payload: { room: room, host: false }
      });
    });
  }, []);

  const handleMenuClick = (id) => {
    if(sending.current) return;
    
    switch(id) {
      case CONSTANTS.CREATE:
        sending.current = true;
        client.emit('CREATE');
        break;
      case CONSTANTS.JOIN:
        dispatch({ type: 'viewCodeInput'});
        break;
      case CONSTANTS.PLAY:
        sending.current = true;
        client.emit('VERIFY', { room: state.room });
        break;
      default:
        console.log(id);
        return;
      }
  }

  const handleCodeInput = (event) => {
    dispatch({ 
      type: 'setCodeInput', 
      payload: event.target.value.replace(/[^a-z]/gi,'').substring(0,5).toUpperCase()
    });
  }

  const getCodeInput = () => {
    return (
      <div className="flex-col">
        <input 
          className="input" 
          type="text" 
          placeholder="ROOM CODE" 
          value={state.room || ''} 
          onChange={handleCodeInput} 
          spellCheck="false" 
          autoComplete="false" 
          autoFocus
        />
        <button className={"flex play-btn " + (state.room?.length === 5 ? '' : 'hidden')} onClick={() => handleMenuClick(CONSTANTS.PLAY)}>
          <img src={CONSTANTS.TRIANGLE_RIGHT}/>
        </button>
      </div>
    )
  }

  const getView = () => {
    switch(state.view) {
      case 'game':
        return <Game host={state.host} room={state.room}/>
      default:
        return (
          <div className="main-screen flex-col flex-fill">
            <label className="flex title-label"> XORDLE </label>
            { state.view !== 'codeInput' ?
                <Menu options={CONSTANTS.MENU_OPTIONS} onClick={handleMenuClick}/> :
                getCodeInput()
            }
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
    case 'viewJoin':
      return { ...state, view: 'game', room: payload.room, host: payload.host };
    case 'viewCodeInput':
      return { ...state, view: 'codeInput' }
    case 'setCodeInput':
      return { ...state, room: payload }
    default:
      return { ...state };
  }
}

const initialState = {
  view: CONSTANTS.VIEW,
  room: null,
}


export default App