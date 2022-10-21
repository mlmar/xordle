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
        payload: { room: room }
      });
      sending.current = false;
    });

    socketUtil.listen('VERIFY', (room) => {
      sending.current = false;
      if(!room) {
        dispatch({  type: 'viewMain' });
      } else {
        dispatch({ 
          type: 'viewJoin',
          payload: { room: room }
        });
      };
    });

    socketUtil.listen('RECONNECT', (success) => {
      if(!success) dispatch({ type: 'viewMain'});
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

  const handleBack = () => {
    client.emit('LEAVE');
    dispatch({ type: 'viewMain' });
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

  const handleNameInput = (event) => {
    const val = event.target.value.replace(/[^a-z]/gi,'').substring(0,5).toUpperCase();
    
    dispatch({ 
      type: 'setNameInput', 
      payload: val
    });

    client.name = val;
    client.setName(val);
  }

  const getNameInput = () => {
    return (
      <div className="flex-col">
        <input 
          className="input" 
          type="text" 
          placeholder="PLAYER NAME" 
          value={state.name || ''} 
          onChange={handleNameInput} 
          spellCheck="false" 
          autoComplete="false" 
          autoFocus
        />
      </div>
    )
  }

  const getView = () => {
    const backBtn = state.view && <button className="back-btn" onClick={handleBack}> BACK </button>
    switch(state.view) {
      case 'game':
        return (
          <Game room={state.room}>
            {backBtn}
          </Game>
        );
      case 'codeInput':
        return (
          <div className="main-screen flex-col flex-fill">
            {backBtn}
            <label className="flex title-label"> XORDLE </label>
            {getCodeInput()}
          </div>
        );
      default:
        return (
          <div className="main-screen flex-col flex-fill">
            {backBtn}
            <label className="flex title-label"> XORDLE </label>
            {getNameInput()}
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
    case 'viewMain':
      return { ...state, view: null, room: null };
    case 'viewJoin':
      return { ...state, view: 'game', room: payload.room };
    case 'viewCodeInput':
      return { ...state, view: 'codeInput' }
    case 'setCodeInput':
      return { ...state, room: payload }
    case 'setNameInput':
      return { ...state, name: payload }
    default:
      return { ...state };
  }
}

const initialState = {
  view: CONSTANTS.VIEW,
  room: null,
  name: localStorage.getItem('xordle_name')
}


export default App