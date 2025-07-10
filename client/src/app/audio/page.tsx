"use client";
import dynamic from "next/dynamic";

const AudioSection = dynamic(() => import("@/components/AudioSection"), {
  ssr: false,
});

export default function AudioPage() {
  return <AudioSection />;
}
