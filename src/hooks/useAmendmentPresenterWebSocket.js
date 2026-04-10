import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useAmendmentPresenterWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("Amendment Presenter WebSocket connected");
        isConnectedRef.current = true;
        client.subscribe(`/topic/amendment-presenters/${sessionId}`, (msg) => {
          setMessages((prev) => [...prev, msg.body]);
        });
      },
      onStompError: (frame) => console.error("STOMP error:", frame),
      onDisconnect: () => (isConnectedRef.current = false),
    });

    client.activate();
    stompClientRef.current = client;
    return client;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !stompClientRef.current?.connected) {
        console.log("Tab active, reconnecting Amendment Presenter WebSocket...");
        stompClientRef.current?.deactivate();
        connect();
      }
    };

    const interval = setInterval(() => {
      if (!stompClientRef.current?.connected) {
        console.log("Amendment Presenter WebSocket inactive, reconnecting...");
        stompClientRef.current?.deactivate();
        connect();
      }
    }, 15000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stompClientRef.current?.deactivate();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, connect]);

  const sendAmendmentPresenterUpdate = async (payload) => {
    if (!stompClientRef.current?.connected) {
      console.log("Amendment Presenter WebSocket not connected, reconnecting...");
      stompClientRef.current?.deactivate();

      await new Promise((resolve) => {
        const tempClient = connect();
        const check = setInterval(() => {
          if (tempClient.connected) {
            clearInterval(check);
            resolve(true);
          }
        }, 200);
      });
    }

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/amendment-presenter/${sessionId}`,
        body: `${payload}`,
      });
    } else {
      console.warn("Failed to send Amendment Presenter message, still disconnected");
    }
  };

  return { messages, sendAmendmentPresenterUpdate };
}
