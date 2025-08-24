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
        let destination;
        if (type === "presenter") {
          destination = `/topic/presenters/${sessionId}`;
        } else if (type === "newTopic") {
          destination = `/topic/newTopics/${sessionId}`;
        } else {
          destination = `/topic/sessions/${sessionId}`;
        }

        client.subscribe(destination, (msg) => {
          const body = msg.body;
          setMessages(prev => [...prev, body]); // for NEW_TOPIC it will be the string "NEW_TOPIC"
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [sessionId, type]);

  const send = (payload) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      let destination;
      if (type === "presenter") {
        destination = `/app/presenter/${sessionId}`;
      } else if (type === "newTopic") {
        destination = `/app/topics/new/${sessionId}`;
      } else {
        destination = `/app/vote/${sessionId}`;
      }

      stompClientRef.current.publish({
        destination,
        body: `${payload}`,
      });
    }
  };

  return {
    messages,
    sendVote: type === "vote" ? send : undefined,
    sendPresenterUpdate: type === "presenter" ? send : undefined,
    sendNewTopic: type === "newTopic" ? send : undefined
  };
}
