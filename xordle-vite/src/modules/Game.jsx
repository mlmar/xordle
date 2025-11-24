import { useState, useEffect } from 'react';
import './Game.css';
import socketUtil, { client } from '../util/SocketUtil';
import GameBoard from './GameBoard';

/**
 * Game component which subscribes to room events and controls state for current game
 */
const Game = (props) => {
    const { room, children } = props;

    const [gameData, setGameData] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [current, setCurrent] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState(null);

    const isHost = () => gameData?.host === client.id;

    const setServerData = (serverData) => {
        setGameData(serverData.room);
        setPlayerData(serverData.player);
    };

    useEffect(() => {
        client.room = room;
        client.emit('JOIN', { room });

        function updateGame(gameData) {
            setGameData(gameData);
            if (gameData?.status === 0) {
                setCurrent([]);
            }
        }

        function updatePlayerData(playerData) {
            setPlayerData(playerData);
            if (playerData?.correct === false || playerData?.correct === true) {
                setCurrent([]);
            }
        }

        socketUtil.listen('JOIN UPDATE', updateGame);
        socketUtil.listen('PLAYER_UPDATE', updatePlayerData);
        socketUtil.listen('SERVER_UPDATE', setServerData);
        socketUtil.listen('SETTINGS_UPDATE', setSettings);

        return () => {
            socketUtil.removeListener('JOIN UPDATE', updateGame);
            socketUtil.removeListener('PLAYER_UPDATE', updatePlayerData);
            socketUtil.removeListener('SERVER_UPDATE', setServerData);
            socketUtil.removeListener('SETTINGS_UPDATE', setSettings);
        };
    }, []);

    const handleShowSettingsClick = () => {
        setShowSettings((prev) => !prev);
    };

    const handleCheckboxChange = (event) => {
        const newSettings = { ...settings, [event.target.id]: event.target.checked };
        client.emit('SETTINGS_UPDATE', { settings: newSettings });
    };

    const getSettingsPanel = () => {
        return (
            <div className='flex flex-col flex-fill settings-panel'>
                <button className='back-btn' onClick={handleShowSettingsClick}>
                    BACK
                </button>
                {settings &&
                    Object.keys(settings).map((setting) => {
                        return (
                            <div className='flex flex-middle' key={setting}>
                                <input
                                    type='checkbox'
                                    className='flex'
                                    checked={settings[setting]}
                                    id={setting}
                                    onChange={handleCheckboxChange}
                                />
                                <label className='flex flex-middle' htmlFor={setting}>
                                    {setting}
                                </label>
                            </div>
                        );
                    })}
            </div>
        );
    };

    const handleStartClick = () => {
        client.emit('START');
    };

    const handleRestartClick = () => {
        client.emit('END');
    };

    // Handle key event
    const handleKeyPress = (letter) => {
        if (letter === 'ENTER') {
            // Submit and clear word
            if (current.length === 5) {
                client.emit('ENTER_WORD', { current });
            }
            setCurrent([]);
        } else if (letter) {
            // Append letter to current word
            setCurrent((prev) => {
                const res = prev.length < 5 ? [...prev, letter] : prev;
                return res;
            });
        } else {
            // Backspace
            // Remove last letter form word
            setCurrent((prev) => {
                if (prev.length === 0) return [];
                const res = [...prev];
                res.pop();
                return res;
            });
        }
    };

    return (
        <div className='flex-col flex-fill game'>
            {!gameData?.status > 0 && !showSettings && children}

            {gameData?.status === 2 && (
                <div className='flex-col flex-fill game-end'>
                    <label className='game-end-word underline'> {gameData?.word} </label>
                    {gameData?.winOrder.map(({ name, attempts }, i) => {
                        const tryStr = attempts > 0 ? 'TRIES' : 'TRY';
                        return i < 4 ? (
                            <label className='game-end-word' key={i + name}>
                                #{i + 1} - {name} ({attempts} {tryStr})
                            </label>
                        ) : null;
                    })}
                    <button className={!isHost() ? 'hidden' : ''} onClick={handleRestartClick}>
                        RESTART
                    </button>
                </div>
            )}

            {gameData?.status > 0 && (
                <GameBoard
                    keys={playerData?.keys}
                    history={playerData?.history}
                    current={current}
                    onKeyPress={handleKeyPress}
                    inProgress={playerData?.inProgress}
                    timeRemaining={playerData?.timeRemaining}
                    showTimeRemaining={settings?.['GUESS TIMER']}
                    keyboardDisabled={!playerData?.inProgress}
                    name={playerData?.name || client.name}
                    room={room}
                    message={(settings?.['GAME TIMER'] ? '[' + gameData?.timeRemaining + '] ' : '') + gameData?.message}
                />
            )}

            {gameData?.status === 0 && (
                <div className='flex-col flex-fill game-lobby'>
                    <button
                        className='settings-btn flex floating-purple-text float-right'
                        onClick={handleShowSettingsClick}
                    >
                        SETTINGS
                    </button>
                    <label className='flex room-code'> {gameData?.id} </label>
                    {!showSettings ? (
                        <>
                            <p className='flex-col flex-fill'>
                                {gameData?.playerCount} PLAYER{gameData?.playerCount > 1 ? 'S' : ''}
                            </p>
                            <button className='start-btn' onClick={handleStartClick}>
                                {isHost() ? 'START' : 'WAITING FOR HOST'}
                            </button>
                        </>
                    ) : (
                        getSettingsPanel()
                    )}
                </div>
            )}
        </div>
    );
};

export default Game;
