import CONSTANTS from '../util/Constants';
import './Keyboard.css';

import { getClassNameByStatus } from '../util/Util';

const Keyboard = (props) => {
  const { available, onClick } = props;

  
  const handleClick = (event) => {
    event.preventDefault();
    const key = event.touches?.[0]?.target.id || event.target.id;
    if(onClick) onClick({ key });
  }

  const constructRow = (index, prepend, append) => {
    const row = CONSTANTS.KEYS['ROW_' + index];
    return (
      <div className="flex keyboard-row">
        {prepend}
        {row.map((letter) => <Key letter={letter} status={4} key={letter} id={letter}/>)}
        {append}
      </div>
    )
  }

  return (
    <div className="keyboard flex-col" onTouchEnd={handleClick} onClick={handleClick}>
      {constructRow(0)}
      {constructRow(1)}
      {constructRow(2, <Key letter={'ENTER'} status={4} id="enter"/>, <Key letter={<>&#171;</>} status={4} id="backspace"/>)}
    </div>
  )
}

const Key = ({ letter, status, className, id }) => {
  let keyStyle = ['flex keyboard-key', getClassNameByStatus(status), (className || '')].join(' ');
  return <button className={keyStyle} id={id}> {letter} </button>
}

export default Keyboard;