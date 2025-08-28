import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useVoteWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/sessions/${sessionId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body); // now receiving JSON, not just ID
            setMessages((prev) => [...prev, data]);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [sessionId]);

  const sendVote = (topicId) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/vote/${sessionId}`,
        body: `${topicId}`,
      });
    }
  };

  return { messages, sendVote };
}
