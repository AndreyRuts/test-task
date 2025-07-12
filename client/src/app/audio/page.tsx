"use client";
import dynamic from "next/dynamic";

const AudioSection = dynamic(() => import("@/components/AudioSection"), {
  ssr: false,
});

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[#121212]">
      <div className="absolute top-[297px] left-1/2 -translate-x-1/2">
        <AudioSection />
      </div>
    </div>
  );
}
