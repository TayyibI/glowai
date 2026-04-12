import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — GlowAI",
  description: "How GlowAI collects, processes, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-charcoal px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-serif text-4xl uppercase tracking-widest text-charcoal mb-2">Privacy Policy</h1>
      <p className="text-[11px] font-mono uppercase tracking-widest text-charcoal/40 mb-10">
        Effective: April 2026 · GlowAI
      </p>

      {[
        {
          heading: "1. What We Collect",
          body: `GlowAI collects: (a) camera images or photo uploads you provide, used solely to perform a skin and hair analysis; (b) preference answers you enter during the setup questionnaire, stored locally on your device only and never transmitted to our servers.`,
        },
        {
          heading: "2. How We Process Your Images",
          body: `Skin and hair images are transmitted over encrypted HTTPS to our technology analysis partner, Perfect Corp (registered in Taiwan). Perfect Corp processes the images using computer-vision algorithms and returns a structured analysis result. Images are deleted from Perfect Corp's servers immediately after analysis is complete. They are not stored, logged, sold, or used for any other purpose.`,
        },
        {
          heading: "3. Data We Do Not Collect",
          body: `GlowAI does not create user accounts. We do not collect your name, email address, phone number, or any other personally identifiable information. We do not use cookies for tracking. We do not sell or share data with advertisers.`,
        },
        {
          heading: "4. Data Stored on Your Device",
          body: `Your preference answers (skin goals, sensitivities, routine time preference) and your saved routine selections are stored in your browser's localStorage. This data never leaves your device. You may clear it at any time by clearing your browser's site data.`,
        },
        {
          heading: "5. Age Restriction",
          body: `GlowAI is available only to users aged 16 and above. By accepting these terms, you confirm that you meet this age requirement. We do not knowingly process biometric data of anyone under 16.`,
        },
        {
          heading: "6. Your Rights (Pakistan PDPB 2023)",
          body: `Under Pakistan's Personal Data Protection Bill (PDPB) 2023, you have the right to: (a) withdraw consent at any time by closing the app; (b) request deletion — as no images are stored, there is nothing to delete beyond what is on your device; (c) receive this information in plain language, which this policy aims to provide.`,
        },
        {
          heading: "7. Third-Party Partner",
          body: `Our sole third-party data processor is Perfect Corp Ltd., 14F, No. 98, Minquan Rd., Xindian Dist., New Taipei City, Taiwan. You may review their privacy practices at www.perfectcorp.com/privacy.`,
        },
        {
          heading: "8. Changes to This Policy",
          body: `We will update the effective date above when this policy changes. Continued use of GlowAI after changes constitutes acceptance of the revised policy.`,
        },
        {
          heading: "9. Contact",
          body: `For any privacy questions, contact us at privacy@glowai.app.`,
        },
      ].map((section) => (
        <section key={section.heading} className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-charcoal mb-2">
            {section.heading}
          </h2>
          <p className="text-sm text-charcoal/70 leading-relaxed">{section.body}</p>
        </section>
      ))}
    </main>
  );
}
