"use client";
import { toast } from "sonner";

export default function H(): JSX.Element {
  return (
    <button
      onClick={() => {
        toast.success("clicked");
      }}
    >
      LKC
    </button>
  );
}
