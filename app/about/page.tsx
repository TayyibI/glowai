import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-clinical-white text-unilever-blue p-8 flex flex-col items-center justify-center text-center">
      <Link href="/" className="absolute top-8 left-8 text-unilever-blue/60 hover:text-unilever-blue flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold text-sm">Back to Home</span>
      </Link>
      <h1 className="text-4xl font-bold mb-4 tracking-tight">About Us</h1>
      <p className="text-lg text-unilever-blue/70 max-w-md">This page is a placeholder for the About Us content.</p>
    </main>
  );
}
