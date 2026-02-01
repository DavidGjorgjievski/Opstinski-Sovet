import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function usePresenterWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false); // track connection state

  const connect = useCallback(() => {
    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("Presenter WebSocket connected");
        isConnectedRef.current = true;
        client.subscribe(`/topic/presenters/${sessionId}`, (msg) => {
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
      if (document.visibilityState === "visible" && !isConnectedRef.current) {
        console.log("Tab active, reconnecting Presenter WebSocket...");
        stompClientRef.current?.deactivate();
        connect();
      }
    };

    const interval = setInterval(() => {
      if (!isConnectedRef.current) {
        console.log("Presenter WebSocket inactive, reconnecting...");
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

  const sendPresenterUpdate = async (payload) => {
    // If not connected, try to reconnect first
    if (!stompClientRef.current?.connected) {
      console.log("Presenter WebSocket not connected, reconnecting...");
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

    // Send the message if connected
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/presenter/${sessionId}`,
        body: `${payload}`,
      });
    } else {
      console.warn("Failed to send Presenter message, still disconnected");
    }
  };

  return { messages, sendPresenterUpdate };
}
