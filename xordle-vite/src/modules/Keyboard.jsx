import CONSTANTS from '../util/Constants';
import './Keyboard.css';

import { getClassNameByStatus } from '../util/Util';

const Keyboard = (props) => {
  const { keys, onClick, disabled } = props;

  
  const handleClick = (event) => {
    if(disabled) return;
    if(event.target.id) {
      if(onClick) onClick({ key: event.target.id });
    }
  }

  const constructRow = (index, prepend, append) => {
    const row = CONSTANTS.KEYS['ROW_' + index];
    return (
      <div className="flex keyboard-row">
        {prepend}
        {row.map((letter) => <Key letter={letter} status={keys?.[letter] >= 0 ? keys[letter] : 3} key={letter} id={letter}/>)}
        {append}
      </div>
    )
  }

  const pvd = (e) => e.preventDefault();

  return (
    <div className={"keyboard flex-col " + (disabled ? 'disabled' : '')} onTouchEnd={pvd} onTouchStart={handleClick} onMouseUp={handleClick}>
      {constructRow(0)}
      {constructRow(1)}
      {constructRow(2, <Key letter={'ENTER'} status={3} id="enter"/>, <Key letter={<>&#171;</>} status={3} id="backspace"/>)}
    </div>
  )
}

const Key = ({ letter, status, className, id }) => {
  let keyStyle = ['flex keyboard-key', getClassNameByStatus(status), (className || '')].join(' ');
  return <button className={keyStyle} id={id}> {letter} </button>
}

export default Keyboard;