import { useEffect } from 'react';
import socketUtil from '../util/SocketUtil';

const SocketWrapper = (props) => {
  const { children, onDisconnect } = props;

  useEffect(() => {
    try {
      socketUtil.init();
    } catch (error) {
      handleDisconenct(error);
    }
  }, [])

  return (
    <>
      {children}
    </>
  )
}

export default SocketWrapper;