import { useEffect } from 'react';
import socketUtil from '../util/SocketUtil';

const SocketWrapper = ({ children }) => {
  useEffect(() => {
    socketUtil.init();
  }, [])

  return (
    <>
      {children}
    </>
  )
}

export default SocketWrapper;