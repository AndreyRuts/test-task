import { useEffect, useRef, useState } from "react";
import { Visualizer } from "react-sound-visualizer";

interface SoundVisualizerProps {
  isActive: boolean;
}

export const SoundVisualizer = ({ isActive }: SoundVisualizerProps) => {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    const getAudio = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    };

    if (isActive) {
      getAudio();
    } else {
      setAudioStream(null);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isActive]);

  if (!isActive || !audioStream) return null;

  return (
    <Visualizer
      audio={audioStream}
      autoStart
      mode="continuous"
      slices={4}
      barRadius={22}
      strokeColor="#9013FE"
      rectWidth={30}
    >
      {({ canvasRef }) => (
        <div className="flex justify-center mt-6">
          <canvas ref={canvasRef} width={280} height={60} />
        </div>
      )}
    </Visualizer>
  );
};
