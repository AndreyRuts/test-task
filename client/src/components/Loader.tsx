import { Spinner } from "@nextui-org/react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Loader({ size = "md", className = "" }: LoaderProps) {
  return (
    <div className={`flex justify-center items-center py-20 ${className}`}>
      <Spinner size={size} />
    </div>
  );
}
