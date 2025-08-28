import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useNewTopicWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/newTopics/${sessionId}`, (msg) => {
          setMessages((prev) => [...prev, msg.body]); // Usually returns "NEW_TOPIC"
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [sessionId]);

  const sendNewTopic = () => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/topics/new/${sessionId}`,
        body: "NEW_TOPIC",
      });
    }
  };

  return { messages, sendNewTopic };
}
