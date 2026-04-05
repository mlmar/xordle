import { useContext } from "react";
import { SocketClient } from '../util/SocketClient';
import { SocketContext } from "@/providers/SocketContext";

export const useSocketClient = (): SocketClient => {
    const client = useContext(SocketContext);
    if (!client) {
        throw new Error('useSocketClient must be used within a SocketProvider');
    }
    return client;
};