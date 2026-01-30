import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useVoteWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe(`/topic/sessions/${sessionId}`, (msg) => {
            try {
              const data = JSON.parse(msg.body);
              setMessages((prev) => [...prev, data]);
            } catch (e) {
              console.error("Failed to parse WebSocket message:", e);
            }
          });
        },
        onStompError: (frame) => {
          console.error("STOMP error:", frame);
        },
      });

      client.activate();
      stompClientRef.current = client;
    };

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!stompClientRef.current?.connected) {
          console.log("Tab visible, reconnecting WebSocket...");
          stompClientRef.current?.deactivate();
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stompClientRef.current?.deactivate();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId]);

  const sendVote = (topicId) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/vote/${sessionId}`,
        body: `${topicId}`,
      });
    }
  };

  return { messages, sendVote };
}
