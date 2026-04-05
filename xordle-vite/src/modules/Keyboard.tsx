import CONSTANTS from '../util/Constants';
import './Keyboard.css';

import { getClassNameByStatus } from '../util/LetterUtil';
import type { LetterData, PlayerData } from '@xordle/common';

interface KeyboardProps {
    keys: PlayerData['keys'] | undefined;
    onClick?: ({ key }: { key: string }) => void;
    disabled: boolean;
}

/**
 * On Scren Keyboard that handles both click and touch events
 */
const Keyboard = (props: KeyboardProps) => {
    const { keys, onClick, disabled } = props;

    const handleClick = (event: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;

        const touches = Array.from((event as React.TouchEvent)?.touches);
        if (touches?.length) {
            const touch = touches.findLast((t) => t);
            const target = touch?.target as HTMLElement;
            if (target?.id && onClick) onClick({ key: target.id });
        } else {
            const target = event?.target as HTMLElement;
            if (target.id && onClick) onClick({ key: target.id });
        }
    };

    const constructRow = (row: string[], prepend?: React.ReactElement, append?: React.ReactElement) => {
        return (
            <div className='flex keyboard-row'>
                {prepend}
                {row.map((letter: LetterData['letter']) => (
                    <Key
                        letter={letter}
                        status={keys && keys[letter] >= 0 ? keys[letter] : 3}
                        key={letter}
                        id={letter}
                    />
                ))}
                {append}
            </div>
        );
    };

    return (
        <div
            className={'keyboard flex-col ' + (disabled ? 'disabled' : '')}
            onTouchEnd={(e) => e.preventDefault}
            onTouchStart={handleClick}
            onMouseUp={handleClick}
        >
            {constructRow(CONSTANTS.KEYS[0])}
            {constructRow(CONSTANTS.KEYS[1])}
            {constructRow(
                CONSTANTS.KEYS[2],
                <Key letter={'ENTER'} status={3} id='enter' />,
                <Key letter={<>&#171;</>} status={3} id='backspace' />,
            )}
        </div>
    );
};

interface KeyProps {
    letter: LetterData['letter'] | React.ReactElement;
    status: LetterData['status'];
    className?: string;
    id: string;
}

const Key = ({ letter, status, className, id }: KeyProps) => {
    let keyStyle = ['flex keyboard-key', getClassNameByStatus(status), className ?? ''].join(' ');
    return (
        <span className='flex keyboard-key-container' id={id}>
            <button className={keyStyle} id={id}>
                {letter}
            </button>
        </span>
    );
};

export default Keyboard;
