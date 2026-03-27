import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useSpeakingWebSocket(municipalityId) {
  const [messages, setMessages] = useState([]);
  const [durationMessages, setDurationMessages] = useState([]);
  const [pauseMessages, setPauseMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectLock = useRef(false);

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${process.env.REACT_APP_API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("Speaking WebSocket connected");
        isConnectedRef.current = true;
        reconnectLock.current = false;
        setIsConnected(true);

        client.subscribe(`/topic/speaking/municipality/${municipalityId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            setMessages((prev) => [...prev, data]);
          } catch (e) {
            console.error("Failed to parse Speaking WS message:", e);
          }
        });

        client.subscribe(`/topic/speaking/municipality/${municipalityId}/durations`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            setDurationMessages((prev) => [...prev, data]);
          } catch (e) {
            console.error("Failed to parse durations WS message:", e);
          }
        });

        client.subscribe(`/topic/speaking/municipality/${municipalityId}/pause`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            setPauseMessages((prev) => [...prev, data]);
          } catch (e) {
            console.error("Failed to parse pause WS message:", e);
          }
        });
      },
      onStompError: (frame) =>
        console.error("Speaking WS STOMP error:", frame),
      onDisconnect: () => {
        isConnectedRef.current = false;
        setIsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;
    return client;
  }, [municipalityId]);

  const tryReconnect = useCallback(() => {
    if (stompClientRef.current?.connected || reconnectLock.current) return;
    reconnectLock.current = true;
    stompClientRef.current?.deactivate();
    connect();
    reconnectLock.current = false;
  }, [connect]);

  useEffect(() => {
    if (!municipalityId) return;

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") tryReconnect();
    };

    const interval = setInterval(() => tryReconnect(), 30000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stompClientRef.current?.deactivate();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [municipalityId, connect, tryReconnect]);

  return { messages, durationMessages, pauseMessages, isConnected };
}
