import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useCommissionVoteWebSocket(sessionId, commissionId) {
  const [messages, setMessages] = useState([]);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectLock = useRef(false);

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        isConnectedRef.current = true;
        reconnectLock.current = false;

        client.subscribe(`/topic/commission-sessions/${sessionId}/${commissionId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            setMessages((prev) => [...prev, data]);
          } catch (e) {
            console.error("Failed to parse Commission Vote WS message:", e);
          }
        });
      },
      onStompError: (frame) => console.error("Commission Vote WS STOMP error:", frame),
      onDisconnect: () => (isConnectedRef.current = false),
    });

    client.activate();
    stompClientRef.current = client;
    return client;
  }, [sessionId, commissionId]);

  const tryReconnect = useCallback(() => {
    if (stompClientRef.current?.connected || reconnectLock.current) return;
    reconnectLock.current = true;
    stompClientRef.current?.deactivate();
    connect();
    reconnectLock.current = false;
  }, [connect]);

  useEffect(() => {
    if (!sessionId || !commissionId) return;

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") tryReconnect();
    };

    const interval = setInterval(() => tryReconnect(), 30000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stompClientRef.current?.deactivate();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, commissionId, connect, tryReconnect]);

  const sendCommissionVote = async (commissionTopicId, voteType = null, username = null) => {
    if (!stompClientRef.current?.connected) {
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
        destination: `/app/commission-vote/${sessionId}/${commissionId}`,
        body: `${commissionTopicId}`,
        headers: { voteType: voteType || '', voterUsername: username || '' },
      });
    } else {
      console.warn("Failed to send commission vote, still disconnected");
    }
  };

  return { messages, sendCommissionVote };
}
