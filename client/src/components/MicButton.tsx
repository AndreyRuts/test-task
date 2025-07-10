import React, { useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import voiceAnimation from "@/assets/lottie/voice.json";

interface MicButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isRecording, onClick }) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (isRecording) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.stop();
    }
  }, [isRecording]);

  return (
    <div
      className={`rounded-full p-4 cursor-pointer transition-colors duration-300 ${
        isRecording ? "bg-purple-600" : "bg-gray-300"
      }`}
      onClick={onClick}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={voiceAnimation}
        loop
        autoplay={false}
        style={{ width: 80, height: 80 }}
      />
    </div>
  );
};

export default MicButton;
