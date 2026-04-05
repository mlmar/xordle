import type { SocketClient } from "@/util/SocketClient";
import { createContext } from "react";

export const SocketContext = createContext<SocketClient | null>(null);
