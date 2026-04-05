import { SocketContext } from '@/providers/SocketContext';
import type { SocketClient } from '@/util/SocketClient';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export const SocketProvider = ({ client, children }: { client: SocketClient; children: ReactNode }) => {
    useEffect(() => {
        client.init();
        return () => void client.destroy();
    }, [client]);

    return <SocketContext.Provider value={client}>{children}</SocketContext.Provider>;
};
