import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { QuizEventMessage } from '../types/quiz';

interface UseQuizWebSocketProps {
  quizId?: number;
  teamId?: number;
  onEvent?: (event: QuizEventMessage) => void;
}

export function useQuizWebSocket({ quizId, teamId, onEvent }: UseQuizWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!quizId) return;

    const prodBackend = 'https://quizpulse-backend-m0wk.onrender.com';
    const baseBackend = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
      : (import.meta.env.PROD ? prodBackend : '');

    const wsUrl = import.meta.env.VITE_WS_URL
      ? import.meta.env.VITE_WS_URL
      : baseBackend
      ? `${baseBackend}/ws`
      : '/ws';

    // Use SockJS fallback or ws protocol
    const socketFactory = () => new SockJS(wsUrl);

    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 2000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        // console.debug('[STOMP]', msg);
      },
      onConnect: () => {
        setIsConnected(true);

        // 1. Subscribe to Quiz events
        client.subscribe(`/topic/quiz/${quizId}`, (message: IMessage) => {
          try {
            const parsed: QuizEventMessage = JSON.parse(message.body);
            if (onEventRef.current) {
              onEventRef.current(parsed);
            }
          } catch (err) {
            console.error('Failed to parse websocket message', err);
          }
        });

        // 2. Subscribe to Team events if teamId provided
        if (teamId) {
          client.subscribe(`/topic/quiz/${quizId}/team/${teamId}`, (message: IMessage) => {
            try {
              const parsed: QuizEventMessage = JSON.parse(message.body);
              if (onEventRef.current) {
                onEventRef.current(parsed);
              }
            } catch (err) {
              console.error('Failed to parse team websocket message', err);
            }
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [quizId, teamId]);

  return { isConnected };
}
