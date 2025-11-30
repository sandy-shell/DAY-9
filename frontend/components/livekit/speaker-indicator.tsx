// frontend/components/livekit/speaker-indicator.tsx
'use client';
import React, { useEffect, useState, useContext } from "react";
import { RoomContext } from "@livekit/components-react";

/**
 * Shows a pulsing colored dot + voice label while the agent is speaking.
 * Expects backend to send LiveKit data messages of format:
 *  {"type":"agent_reply_start","id":"msg123","voice":"Matthew","text":"..."}
 *  {"type":"agent_reply_end","id":"msg123"}
 */

const VOICE_COLOR: Record<string, string> = {
  Matthew: "#2B82FF", // blue
  Alicia:  "#FF6EC7", // pink
  Ken:     "#9B59FF", // purple
};

export default function SpeakerIndicator() {
  const room = useContext(RoomContext) as any;
  const [current, setCurrent] = useState<{ id: string; voice: string; text?: string } | null>(null);

  useEffect(() => {
    if (!room) return;

    const handler = (payload: any, participant: any) => {
      let data: any = null;
      try {
        // payload may be string or ArrayBuffer (LiveKit)
        if (typeof payload === "string") data = JSON.parse(payload);
        else {
          const str = new TextDecoder().decode(payload);
          data = JSON.parse(str);
        }
      } catch (e) {
        return;
      }
      if (!data?.type) return;

      if (data.type === "agent_reply_start") {
        setCurrent({ id: data.id, voice: data.voice, text: data.text });
      } else if (data.type === "agent_reply_end") {
        if (current?.id === data.id) setCurrent(null);
        else setCurrent(null);
      }
    };

    // LiveKit room event name for data depends on SDK; most versions use 'dataReceived'
    // the code below uses the LiveKit Room event emitter if present:
    room.on?.("dataReceived", handler);
    return () => {
      room.off?.("dataReceived", handler);
    };
  }, [room, current]);

  if (!current) return null;
  const color = VOICE_COLOR[current.voice] || "#cccccc";

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "6px 10px",
      borderRadius: 12,
      background: "transparent",
      color: "#fff",
      fontSize: 13
    }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: 12,
        background: color,
        boxShadow: `0 0 12px ${color}`,
        animation: "lk-pulse 1000ms infinite"
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontWeight: 700, lineHeight: 1 }}>{current.voice}</div>
        <div style={{ fontSize: 12, opacity: 0.9, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {current.text}
        </div>
      </div>

      <style>{`
        @keyframes lk-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.85; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
