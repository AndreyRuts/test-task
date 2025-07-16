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
  | { type: "error"; message: string | object };

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

      recorder.ondataavailable = (event) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "audio_chunk", chunk: base64 }));
            console.log("🎤 Sent audio chunk");
          }
        };
        reader.readAsDataURL(event.data);
      };

      recorder.start(300);
    } catch (err) {
      console.error("❌ Failed to get microphone stream:", err);
    }
  };

  socket.onmessage = (event) => {
    console.log("📩 Raw WS message:", event.data);

    let message: ServerMessage;

    try {
      message = JSON.parse(event.data);
    } catch (e) {
      console.error("❌ Failed to parse WS message:", e);
      return;
    }

    console.log("✅ Parsed WS message:", message);

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

  socket.onclose = (event) => {
    console.warn("🔌 WebSocket closed:", event.code, event.reason);
  };

  socket.onerror = (event) => {
    console.error("💥 WebSocket error:", event);
  };
};

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
