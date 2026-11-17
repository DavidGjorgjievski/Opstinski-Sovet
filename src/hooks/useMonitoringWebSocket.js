import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

/**
 * Subscribes to /topic/monitoring. The backend sends a content-free "CHANGED" ping on
 * login, logout, page change and stale-session cleanup; the caller refetches the data.
 * Returns whether the socket is currently connected.
 */
export default function useMonitoringWebSocket(onChange) {
  const [connected, setConnected] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe("/topic/monitoring", () => onChangeRef.current?.());
        // Catch up on anything missed while disconnected
        onChangeRef.current?.();
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) => console.error("Monitoring STOMP error:", frame),
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);

  return connected;
}
