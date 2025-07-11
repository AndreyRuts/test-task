"use client";
import dynamic from "next/dynamic";

const AudioSection = dynamic(() => import("@/components/AudioSection"), {
  ssr: false,
});

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <AudioSection />
    </div>
  );
}
