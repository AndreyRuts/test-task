"use client";

import React, { useState, useEffect } from "react";
import MicButton from "@/components/MicButton";
import CustomVisualizer from "@/components/CustomVisualizer";

import { useVoiceVisualizer, VoiceVisualizer } from "react-voice-visualizer";

const AudioSection = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  const recorderControls = useVoiceVisualizer();
  const {
    // ... (Extracted controls and states, if necessary)
    recordedBlob,
    error,
  } = recorderControls;

  // Get the recorded audio blob
  useEffect(() => {
    if (!recordedBlob) return;

    console.log(recordedBlob);
  }, [recordedBlob]);

  // Get the error when it occurs
  useEffect(() => {
    if (!error) return;

    console.error(error);
  }, [error]);

  const toggle = async () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    } else {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(micStream);
      } catch (err) {
        console.error("🎤 Ошибка доступа к микрофону:", err);
      }
    }
  };

  const isRecording = Boolean(stream);

  return (
    <>
      <div className="text-2xl">Tailwind работает!</div>
      <div className="flex flex-col items-center gap-6 p-6">
        <MicButton isRecording={isRecording} onClick={toggle} />

        {stream && <CustomVisualizer stream={stream} />}
      </div>
      <VoiceVisualizer controls={recorderControls} />
    </>
  );
};

export default AudioSection;
