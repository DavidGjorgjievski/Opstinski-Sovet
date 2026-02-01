import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useVoteWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectLock = useRef(false);
  const messageQueueRef = useRef([]);

  const connect = useCallback(() => {
    if (!sessionId) return;

    // Deactivate old client if exists
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      isConnectedRef.current = false;
    }

    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 0, // manual reconnect
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("Vote WS connected");
        isConnectedRef.current = true;
        reconnectLock.current = false;

        // Subscribe
        client.subscribe(`/topic/sessions/${sessionId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            setMessages((prev) => [...prev, data]);
          } catch (e) {
            console.error("Failed to parse WS message:", e);
          }
        });

        // Send queued messages
        while (messageQueueRef.current.length) {
          const body = messageQueueRef.current.shift();
          client.publish({ destination: `/app/vote/${sessionId}`, body });
        }
      },
      onStompError: (frame) => console.error("Vote WS STOMP error:", frame),
      onDisconnect: () => (isConnectedRef.current = false),
    });

    client.activate();
    stompClientRef.current = client;
    return client;
  }, [sessionId]);

  const ensureConnected = useCallback(() => {
    if (isConnectedRef.current || reconnectLock.current) return;
    reconnectLock.current = true;
    console.log("Vote WS reconnecting...");
    stompClientRef.current?.deactivate();
    connect().finally(() => {
      reconnectLock.current = false;
    });
  }, [connect]);

  useEffect(() => {
    if (!sessionId) return;

    connect();

    // Reconnect when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") ensureConnected();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic reconnect check
    const interval = setInterval(() => ensureConnected(), 15000);

    return () => {
      stompClientRef.current?.deactivate();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, connect, ensureConnected]);

  const sendVote = useCallback(
    (topicId) => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/vote/${sessionId}`,
          body: `${topicId}`,
        });
      } else {
        console.log("Vote WS disconnected, queuing message");
        messageQueueRef.current.push(topicId);
        ensureConnected();
      }
    },
    [sessionId, ensureConnected]
  );

  return { messages, sendVote };
}
