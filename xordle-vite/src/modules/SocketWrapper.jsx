import { useEffect } from 'react';
import socketUtil from '../util/SocketUtil';

/**
 * Wrapper component to initialize WebSocket client singleton connection
 */
const SocketWrapper = (props) => {
    const { children } = props;

    useEffect(() => {
        socketUtil.init();
        return () => void socketUtil.destroy();
    }, []);

    return <>{children}</>;
};

export default SocketWrapper;
