import { useEffect } from 'react';
import socketUtil from '../util/SocketUtil';

const SocketWrapper = (props) => {
  const { children, onReconnect } = props;

  useEffect(() => {
    socketUtil.init(onReconnect);
  }, [])

  return (
    <>
      {children}
    </>
  )
}

export default SocketWrapper;