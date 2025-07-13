// client/src/components/AudioSection.tsx
"use client";

import React, { useState } from "react";
import MicButton from "@/components/MicButton";
import { SoundVisualizer } from "./SoundVisualizer";
import { startAudioStream, stopAudioStream } from "@/lib/api/ws/audioSocket";

const AudioSection = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  const toggleRecording = async () => {
    if (!isRecording) {
      setTranscript(null);
      await startAudioStream((text) => {
        setTranscript(text);
        console.log("📝 Transcription:", text);
      });
    } else {
      stopAudioStream();
    }

    setIsRecording((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 h-[313px] bg-[#171717] w-[552px] rounded-2xl">
      <div
        className="h-[60px] w-full flex justify-center"
        style={{ minHeight: 60 }}
      >
        {isRecording && <SoundVisualizer isActive={isRecording} />}
      </div>

      <MicButton isRecording={isRecording} onClick={toggleRecording} />

      <button
        onClick={toggleRecording}
        className={`px-6 py-2 h-10 w-[190px] rounded-full font-semibold text-white transition-colors duration-300
          ${isRecording ? "bg-[#a21649]" : "bg-[#612AD8]"}`}
      >
        {isRecording ? "End conversation" : "Start conversation"}
      </button>

      {transcript && (
        <p className="text-white text-sm mt-2 w-full text-center">
          📝 {transcript}
        </p>
      )}
    </div>
  );
};

export default AudioSection;
