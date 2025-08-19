// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useWebSocket() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Connect using SockJS
    const socket = new SockJS(`${API_URL}/ws`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        setConnected(true);
        console.log("✅ Connected to WebSocket");

        // subscribe to /topic/greetings (matches your Spring config)
        stompClient.subscribe("/topic/votes", (msg) => {
          setMessages((prev) => [...prev, msg.body]);
        });
      },
      onDisconnect: () => {
        setConnected(false);
        console.log("❌ Disconnected from WebSocket");
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [API_URL]);

const sendMessage = (topicId) => {
  if (stompClientRef.current && stompClientRef.current.connected) {
    stompClientRef.current.publish({
      destination: "/app/vote",
      body: topicId.toString(), // send the topicId
    });
  } else {
    console.warn("STOMP client not connected yet");
  }
};


  return { connected, messages, sendMessage };
}
