import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useNewTopicWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectLock = useRef(false);
  const messageQueueRef = useRef([]);

  const connect = useCallback(() => {
    if (!sessionId) return;

    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      isConnectedRef.current = false;
    }

    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("NewTopic WS connected");
        isConnectedRef.current = true;
        reconnectLock.current = false;

        client.subscribe(`/topic/newTopics/${sessionId}`, (msg) => {
          setMessages((prev) => [...prev, msg.body]);
        });

        while (messageQueueRef.current.length) {
          const body = messageQueueRef.current.shift();
          client.publish({ destination: `/app/topics/new/${sessionId}`, body });
        }
      },
      onStompError: (frame) => console.error("NewTopic WS STOMP error:", frame),
      onDisconnect: () => (isConnectedRef.current = false),
    });

    client.activate();
    stompClientRef.current = client;
    return client;
  }, [sessionId]);

  const ensureConnected = useCallback(() => {
    if (isConnectedRef.current || reconnectLock.current) return;
    reconnectLock.current = true;
    console.log("NewTopic WS reconnecting...");
    stompClientRef.current?.deactivate();
    connect().finally(() => {
      reconnectLock.current = false;
    });
  }, [connect]);

  useEffect(() => {
    if (!sessionId) return;

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") ensureConnected();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(() => ensureConnected(), 15000);

    return () => {
      stompClientRef.current?.deactivate();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, connect, ensureConnected]);

  const sendNewTopic = useCallback(
    (body = "NEW_TOPIC") => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/topics/new/${sessionId}`,
          body,
        });
      } else {
        console.log("NewTopic WS disconnected, queuing message");
        messageQueueRef.current.push(body);
        ensureConnected();
      }
    },
    [sessionId, ensureConnected]
  );

  return { messages, sendNewTopic };
}
