let socket: WebSocket | null = null;
let recorder: MediaRecorder | null = null;

type FinalResponse = {
  transcript: string;
  reply: string;
};

type ResponseCallback = (data: FinalResponse) => void;

type ServerMessage =
  | { type: "text-delta"; text: string }
  | { type: "text-final"; text: string }
  | { type: "error"; message: string | Record<string, unknown> };

export const startAudioStream = async (onResponse: ResponseCallback) => {
  socket = new WebSocket("ws://localhost:5000/ws");

  let fullReply = "";
  let partialTranscript = "";

  socket.onopen = async () => {
    console.log("✅ WebSocket connection opened");
    socket?.send(JSON.stringify({ type: "start" }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => handleAudioChunk(event);
      recorder.start(300);
    } catch (err) {
      console.error("❌ Failed to access microphone:", err);
    }
  };

  socket.onmessage = (event: MessageEvent) => {
    let message: ServerMessage;

    try {
      message = JSON.parse(event.data);
      console.log("📩 Server message:", message);
    } catch (error) {
      console.error("❌ Failed to parse server message:", error);
      return;
    }

    switch (message.type) {
      case "text-delta":
        partialTranscript += message.text;
        console.log("✏️ Transcript delta:", partialTranscript);
        onResponse({ transcript: partialTranscript, reply: "" });
        break;

      case "text-final":
        fullReply += message.text;
        partialTranscript = "";
        console.log("📘 Final reply:", fullReply);
        onResponse({ transcript: "", reply: fullReply });
        break;

      case "error":
        const errorText =
          typeof message.message === "string"
            ? message.message
            : JSON.stringify(message.message, null, 2);
        console.error("❌ Server error:", errorText);
        break;

      default:
        console.warn("⚠️ Unknown message type:", message);
    }
  };

  socket.onclose = ({ code, reason }) => {
    console.warn(`🔌 WebSocket closed: ${code} ${reason || ""}`);
  };

  socket.onerror = (event) => {
    console.error("💥 WebSocket error:", event);
  };
};

function handleAudioChunk(event: BlobEvent) {
  const reader = new FileReader();

  reader.onloadend = () => {
    const result = reader.result as string;
    const base64 = result.split(",")[1];

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "audio_chunk", chunk: base64 }));
      console.log("🎤 Sent audio chunk");
    }
  };

  reader.readAsDataURL(event.data);
}

export const stopAudioStream = () => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stop" }));
    console.log("🛑 Sent stop command");
  }

  socket?.close();
  recorder?.stop();

  socket = null;
  recorder = null;

  console.log("🧹 Cleaned up socket and recorder");
};
