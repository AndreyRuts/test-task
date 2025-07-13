
let socket: WebSocket | null = null;
let recorder: MediaRecorder | null = null;

type TranscriptCallback = (text: string) => void;

export const startAudioStream = async (onTranscript: TranscriptCallback) => {
  socket = new WebSocket("ws://localhost:5000/ws");
  
  socket.onopen = async () => {
    socket?.send(JSON.stringify({ type: "start" }));

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        socket?.send(JSON.stringify({ type: "audio_chunk", chunk: base64 }));
      };
      reader.readAsDataURL(event.data);
    };

    recorder.start(300); // каждые 300мс
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "transcript" && message.text) {
      onTranscript(message.text);
    }
  };
};

export const stopAudioStream = () => {
  socket?.send(JSON.stringify({ type: "stop" }));
  socket?.close();
  recorder?.stop();
  socket = null;
  recorder = null;
};
