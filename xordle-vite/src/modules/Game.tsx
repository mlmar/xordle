import { useState } from 'react';
import './Game.css';
import { useSocketClient } from '@/hooks/useSocketClient.ts';
import { useSocketClientEvent } from '@/hooks/useSocketClientEvent.ts';
import GameBoard from './GameBoard';
import type { PlayerData, Settings, ServerUpdate, XordleRoomData } from '@xordle/common';

interface GameProps extends React.PropsWithChildren {
    room: string;
}

/**
 * Game component which subscribes to room events and controls state for current game
 */
const Game = (props: GameProps) => {
    const { room, children } = props;

    const client = useSocketClient();
    const [gameData, setGameData] = useState<XordleRoomData | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [current, setCurrent] = useState<string[]>([]);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [settings, setSettings] = useState<Settings | null>(null);

    const isHost = gameData?.host === client.id;

    useSocketClientEvent('JOIN UPDATE', (gameData: XordleRoomData) => {
        setGameData(gameData);
        if (gameData.status === 0) setCurrent([]);
    });

    useSocketClientEvent('PLAYER_UPDATE', (playerData: PlayerData) => {
        setPlayerData(playerData);
    });

    useSocketClientEvent('SERVER_UPDATE', (serverData: ServerUpdate) => {
        setGameData(serverData.room);
        setPlayerData(serverData.player);
    });

    useSocketClientEvent('SETTINGS_UPDATE', setSettings);

    const handleShowSettingsClick = () => {
        setShowSettings((prev) => !prev);
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
                                    onChange={(event) => {
                                        const newSettings = { ...settings, [event.target.id]: event.target.checked };
                                        client.emit('SETTINGS_UPDATE', { settings: newSettings });
                                    }}
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
    const handleKeyPress = (letter: string | null) => {
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
        gameData &&
        settings && (
            <div className='flex-col flex-fill game'>
                {gameData.status === 0 && !showSettings && children}

                {gameData.status === 2 && (
                    <div className='flex-col flex-fill game-end'>
                        <label className='game-end-word underline'> {gameData.word} </label>
                        {gameData.winOrder.map(({ name, attempts }, i) => {
                            const tryStr = attempts > 0 ? 'TRIES' : 'TRY';
                            return i < 4 ? (
                                <label className='game-end-word' key={i + name}>
                                    #{i + 1} - {name} ({attempts} {tryStr})
                                </label>
                            ) : null;
                        })}
                        <button className={!isHost ? 'hidden' : ''} onClick={handleRestartClick}>
                            RESTART
                        </button>
                    </div>
                )}

                {gameData.status > 0 && (
                    <GameBoard
                        keys={playerData?.keys}
                        history={playerData?.history}
                        current={current}
                        onKeyPress={handleKeyPress}
                        inProgress={playerData?.inProgress ?? false}
                        timeRemaining={playerData?.timeRemaining ?? 0}
                        showTimeRemaining={settings?.['GUESS TIMER']}
                        keyboardDisabled={!playerData?.inProgress}
                        room={room}
                        message={
                            (settings?.['GAME TIMER'] ? '[' + gameData.timeRemaining + '] ' : '') + gameData.message
                        }
                    />
                )}

                {gameData.status === 0 && (
                    <div className='flex-col flex-fill game-lobby'>
                        <button
                            className='settings-btn flex floating-purple-text float-right'
                            onClick={handleShowSettingsClick}
                        >
                            SETTINGS
                        </button>
                        <label className='flex room-code'> {gameData.id} </label>
                        {!showSettings ? (
                            <>
                                <p className='flex-col flex-fill'>
                                    {gameData.playerCount} PLAYER{gameData.playerCount > 1 ? 'S' : ''}
                                </p>
                                <button className='start-btn' onClick={handleStartClick}>
                                    {isHost ? 'START' : 'WAITING FOR HOST'}
                                </button>
                            </>
                        ) : (
                            getSettingsPanel()
                        )}
                    </div>
                )}
            </div>
        )
    );
};

export default Game;
