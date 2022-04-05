import { useEffect } from 'react';
import socketUtil from '../util/SocketUtil';

const SocketWrapper = (props) => {
  const { children, onDisconnect } = props;

  useEffect(() => {
    socketUtil.init(onDisconnect);
  }, [])

  return (
    <>
      {children}
    </>
  )
}

export default SocketWrapper;