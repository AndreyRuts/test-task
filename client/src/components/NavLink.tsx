"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  name: string;
  href: string;
  position: "left" | "center" | "right";
};

export default function NavLink({ name, href, position }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const radiusClass =
    position === "left"
      ? "rounded-l-md"
      : position === "right"
      ? "rounded-r-md"
      : "rounded-none";

  if (position === "center") {
    return (
      <div
        className="flex-1 h-full"
        style={{
          paddingLeft: "2px",
          paddingRight: "2px",
          background: "linear-gradient(to right, #FF1CF7, #00F0FF)",
        }}
      >
        <Link href={href} className="block h-full">
          <div
            className={`flex justify-center items-center h-full text-sm font-medium bg-[#121212] ${radiusClass}
              ${isActive ? "text-[#5DDFFF]" : "text-white hover:text-[#5DDFFF]"}
            `}
          >
            {name}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <Link href={href} className="flex-1">
      <div
        className={`flex justify-center items-center h-full text-sm font-medium bg-[#121212] ${radiusClass}
          ${isActive ? "text-[#5DDFFF]" : "text-white hover:text-[#5DDFFF]"}
        `}
      >
        {name}
      </div>
    </Link>
  );
}
