import { useSocketClient } from "@/hooks/useSocketClient";
import { useEffect, useRef } from "react";

export const useSocketClientEvent = (event: string, handler: (payload: any) => void): void => {
    const client = useSocketClient();
    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        const listener = (payload: any) => handlerRef.current(payload);
        client.listen(event, listener);
        return () => client.removeListener(event, listener);
    }, [client, event]);
};
