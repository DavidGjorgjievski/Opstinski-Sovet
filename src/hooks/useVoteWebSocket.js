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
          setMessages((prev) => [...prev, msg.body]);
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [sessionId]);

  const sendVote = (payload) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/vote/${sessionId}`,
        body: `${payload}`,
      });
    }
  };

  return { messages, sendVote };
}
