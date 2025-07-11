"use client";

import React, { useState } from "react";
import MicButton from "@/components/MicButton";
import { SoundVisualizer } from "./SoundVisualizer";

const AudioSection = () => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-6 p-6 h-[313px] bg-[#171717] w-[552px] rounded-2xl">
        <div className="h-[60px]">
          <SoundVisualizer isActive={isRecording} />
        </div>

        <MicButton isRecording={isRecording} onClick={toggleRecording} />

        <button
          onClick={toggleRecording}
          className={`mt-4 px-6 py-2 h-10 w-44 rounded-full font-semibold text-white transition-colors duration-300
      ${isRecording ? "bg-[#a21649]" : "bg-[#612AD8]"}`}
        >
          {isRecording ? "End conversation" : "Start conversation"}
        </button>
      </div>
    </>
  );
};

export default AudioSection;
