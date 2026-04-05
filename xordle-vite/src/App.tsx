import { useReducer, useRef } from 'react';
import './App.css';
import CONSTANTS from './util/Constants';
import Menu from './modules/Menu';
import Game from './modules/Game';
import { useSocketClient } from '@/hooks/useSocketClient.ts';
import { useSocketClientEvent } from '@/hooks/useSocketClientEvent.ts';

const App = () => {
    const client = useSocketClient();
    const [state, dispatch] = useReducer(reducer, initialState);

    const sending = useRef(false);

    useSocketClientEvent('CREATE', (room: string) => {
        client.setRoom(room);
        client.emit('JOIN', { room });
        dispatch({ type: 'viewJoin', payload: room });
        sending.current = false;
    });

    useSocketClientEvent('VERIFY', (room: string) => {
        sending.current = false;
        if (!room) {
            dispatch({ type: 'viewMain' });
        } else {
            client.setRoom(room);
            client.emit('JOIN', { room });
            dispatch({ type: 'viewJoin', payload: room });
        }
    });

    useSocketClientEvent('RECONNECT', (success) => {
        if (!success) dispatch({ type: 'viewMain' });
    });

    const handleMenuClick = (id: string) => {
        if (sending.current) return;

        switch (id) {
            case CONSTANTS.CREATE:
                sending.current = true;
                client.emit('CREATE');
                break;
            case CONSTANTS.JOIN:
                dispatch({ type: 'viewCodeInput' });
                break;
            case CONSTANTS.PLAY:
                sending.current = true;
                client.emit('VERIFY', { room: state.room });
                break;
            default:
                console.log(id);
                return;
        }
    };

    const handleBack = () => {
        client.emit('LEAVE');
        dispatch({ type: 'viewMain' });
    };

    const handleCodeInput = (event: React.ChangeEvent) => {
        dispatch({
            type: 'setCodeInput',
            payload: (event.target as HTMLInputElement).value
                .replace(/[^a-z]/gi, '')
                .substring(0, 5)
                .toUpperCase(),
        });
    };

    const handleSubmit = (event: React.SubmitEvent) => {
        event.preventDefault();
        handleMenuClick(CONSTANTS.PLAY);
    };

    const getCodeInput = () => {
        return (
            <form className='flex-col' onSubmit={handleSubmit}>
                <input
                    className='input'
                    type='text'
                    placeholder='ROOM CODE'
                    value={state.room || ''}
                    onChange={handleCodeInput}
                    spellCheck='false'
                    autoComplete='false'
                    autoFocus
                />
                <button
                    className={'flex play-btn ' + (state.room?.length === 5 ? '' : 'hidden')}
                    onClick={() => handleMenuClick(CONSTANTS.PLAY)}
                >
                    <img src={CONSTANTS.TRIANGLE_RIGHT} alt='Play Button' />
                </button>
            </form>
        );
    };

    const handleNameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value
            .replace(/[^a-z]/gi, '')
            .substring(0, 5)
            .toUpperCase();

        dispatch({
            type: 'setNameInput',
            payload: val,
        });

        client.name = val;
        client.setName(val);
    };

    const getNameInput = () => {
        return (
            <div className='flex-col'>
                <input
                    className='input'
                    type='text'
                    placeholder='PLAYER NAME'
                    value={state.name || ''}
                    onChange={handleNameInput}
                    spellCheck='false'
                    autoComplete='false'
                    autoFocus
                />
            </div>
        );
    };

    const getView = () => {
        const backBtn = state.view && (
            <button className='back-btn' onClick={handleBack}>
                BACK
            </button>
        );
        switch (state.view) {
            case 'game':
                return <Game room={state.room ?? ''}>{backBtn}</Game>;
            case 'codeInput':
                return (
                    <section className='main-screen flex-col flex-fill'>
                        {backBtn}
                        <h1 className='flex title-label'> XORDLE </h1>
                        {getCodeInput()}
                    </section>
                );
            default:
                return (
                    <section className='main-screen flex-col flex-fill'>
                        {backBtn}
                        <h1 className='flex title-label'> XORDLE </h1>
                        {getNameInput()}
                        <Menu options={CONSTANTS.MENU_OPTIONS} onClick={handleMenuClick} />
                    </section>
                );
        }
    };

    return <main className='app'>{getView()}</main>;
};

type XordleState = {
    view: string | null;
    room: string | undefined | null;
    name: string | undefined | null;
};

const reducer = (state: XordleState, action: { type: string; payload?: string | null | undefined }) => {
    const { type, payload } = action;

    switch (type) {
        case 'viewMain':
            return { ...state, view: null, room: null };
        case 'viewJoin':
            return { ...state, view: 'game', room: payload };
        case 'viewCodeInput':
            return { ...state, view: 'codeInput' };
        case 'setCodeInput':
            return { ...state, room: payload };
        case 'setNameInput':
            return { ...state, name: payload };
        default:
            return { ...state };
    }
};

const initialState = {
    view: null,
    room: null,
    name: localStorage.getItem('xordle_name'),
};

export default App;
