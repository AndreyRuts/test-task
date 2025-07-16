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
    <Lottie
      lottieRef={lottieRef}
      animationData={voiceAnimation}
      loop
      autoplay={false}
      style={{ width: 120, height: 120 }}
      onClick={onClick}
    />
  );
};

export default MicButton;
