import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useWebSocket(sessionId, type = "vote") {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/${type === "presenter" ? "presenters" : "sessions"}/${sessionId}`, (msg) => {
          const topicId = Number(msg.body);
          setMessages(prev => [...prev, topicId]);
        });
      },
    });
    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [sessionId, type]);

  const send = (topicId) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/${type}/${sessionId}`,
        body: `${topicId}`,
      });
    }
  };

  return { messages, sendVote: type === "vote" ? send : undefined, sendPresenterUpdate: type === "presenter" ? send : undefined };
}
