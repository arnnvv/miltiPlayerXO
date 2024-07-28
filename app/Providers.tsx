"use client";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function Providers({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <>
      <Toaster position="top-center" richColors />
      {children}
    </>
  );
}
