import { useEffect } from 'react';
import CONSTANTS from '../util/Constants';
import { SERVER_URL } from '../util/SystemUtil';
import socketUtil from '../util/SocketUtil';

const SocketWrapper = ({ children }) => {
  useEffect(() => {
    const pingServer = () => {
      fetch(SERVER_URL + '/ping').then(res => res.json()).then(() => console.log('Pinged Server'));
    }

    socketUtil.init();

    pingServer();
    setInterval(pingServer, CONSTANTS.PING_DELAY)
  }, [])

  return (
    <>
      {children}
    </>
  )
}

export default SocketWrapper;