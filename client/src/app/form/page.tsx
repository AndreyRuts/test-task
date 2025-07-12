"use client";

import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-[297px] left-1/2 -translate-x-1/2">
        <RegisterForm />
      </div>
    </div>
  );
}
