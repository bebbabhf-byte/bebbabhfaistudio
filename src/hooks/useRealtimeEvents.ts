import { useEffect, useRef } from 'react';

type RealtimeEventHandler = (event: { type: string; data: any }) => void;

export function useRealtimeEvents(channel: string = 'all', onEvent: RealtimeEventHandler) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: any = null;

    const connect = () => {
      const url = `/api/realtime?channel=${encodeURIComponent(channel)}`;
      eventSource = new EventSource(url);

      const eventNames = [
        'order_created',
        'order_status_updated',
        'order_assigned',
        'order_cancelled',
        'claim_created',
        'claim_updated',
        'claim_message',
        'driver_location',
        'delivery_completed',
        'payment_collected',
        'stock_updated',
        'system_notification',
        'audit_log',
        'settings_updated'
      ];

      eventNames.forEach(name => {
        eventSource?.addEventListener(name, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            onEventRef.current({ type: name, data: parsed });
          } catch (err) {
            console.error('Failed to parse SSE event data', err);
          }
        });
      });

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3 seconds if disconnected
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
    };
  }, [channel]);
}
