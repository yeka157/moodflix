"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function MobileBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="fixed top-4 left-4 z-50 md:hidden size-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center motion-safe:transition-colors active:bg-black/80"
    >
      <ChevronLeft className="size-5 text-white" />
    </button>
  );
}
