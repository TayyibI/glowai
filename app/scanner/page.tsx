"use client";

import { Scanner } from "@/components/Scanner";

export default function ScannerPage() {
  return (
    <main className="min-h-screen bg-ivory px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Scanner />
      </div>
    </main>
  );
}
