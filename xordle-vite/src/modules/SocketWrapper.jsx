import { useEffect } from 'react';
import socketUtil from '../util/SocketUtil';

const SocketWrapper = (props) => {
  const { children } = props;

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