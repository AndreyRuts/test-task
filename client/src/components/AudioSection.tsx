"use client";

import React, { useState } from "react";
import MicButton from "@/components/MicButton";
import { SoundVisualizer } from "./SoundVisualizer";
import { startAudioStream, stopAudioStream } from "@/lib/api/ws/audioSocket";

const AudioSection = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  const toggleRecording = async () => {
    if (!isRecording) {
      setTranscript(null);
      setReply(null);
      await startAudioStream(({ transcript, reply }) => {
        setTranscript(transcript);
        setReply(reply);
        console.log("📝 Transcript:", transcript);
        console.log("🤖 GPT Reply:", reply);
      });
    } else {
      stopAudioStream();
    }

    setIsRecording((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 h-auto min-h-[313px] bg-[#171717] w-[552px] rounded-2xl">
      <div className="w-full flex justify-center min-h-[60px]">
        {isRecording && <SoundVisualizer isActive={isRecording} />}
      </div>

      <div className="w-full bg-[#262626] text-white rounded-xl px-4 py-3 min-h-[80px] flex flex-col items-center justify-center text-center">
        {transcript && (
          <p className="text-gray-400 text-sm mb-1">📝 {transcript}</p>
        )}
        {reply && <p className="text-green-400 text-sm">🤖 {reply}</p>}
        {!reply && !transcript && (
          <p className="text-gray-500 text-sm italic">
            Waiting for your voice...
          </p>
        )}
      </div>

      <MicButton isRecording={isRecording} onClick={toggleRecording} />

      <button
        onClick={toggleRecording}
        className={`px-6 py-2 h-10 w-[190px] rounded-full font-semibold text-white transition-colors duration-300 ${
          isRecording ? "bg-[#a21649]" : "bg-[#612AD8]"
        }`}
      >
        {isRecording ? "End conversation" : "Start conversation"}
      </button>
    </div>
  );
};

export default AudioSection;
