"use client";

/**
 * Language context for GlowAI.
 * Supports: "en" (English) | "ur" (Urdu)
 * Language preference is persisted to localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "en" | "ur";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isUrdu: boolean;
}

const STORAGE_KEY = "glowai_lang";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────────────────────
const translations: Record<string, Record<Lang, string>> = {
  // Nav
  "nav.brand":              { en: "GLOWAI", ur: "گلو اے آئی" },
  "nav.start_scan":         { en: "Start scan", ur: "اسکین شروع کریں" },

  // Hero
  "hero.title":             { en: "Your skin,\ndecoded.", ur: "آپ کی جلد،\nتجزیہ کیا گیا۔" },
  "hero.subtitle":          { en: "AI-powered skin & hair analysis. Personalised to your face.", ur: "اے آئی سے جلد اور بالوں کا تجزیہ۔ آپ کے چہرے کے مطابق۔" },
  "hero.cta":               { en: "Start free scan", ur: "مفت اسکین شروع کریں" },
  "hero.how":               { en: "See how it works", ur: "طریقہ کار دیکھیں" },
  "hero.disclaimer":        { en: "~90 sec full analysis · Free · No app download", ur: "~90 سیکنڈ مکمل تجزیہ · مفت · ایپ ڈاؤن لوڈ نہیں" },

  // Stats
  "stats.analysis":         { en: "3-in-1", ur: "3-میں-1" },
  "stats.analysis_label":   { en: "Skin type, hydration & hair analysis", ur: "جلد کی قسم، نمی اور بالوں کا تجزیہ" },
  "stats.time":             { en: "~90s", ur: "~90 سیکنڈ" },
  "stats.time_label":       { en: "Full diagnostic scan time", ur: "مکمل تشخیصی اسکین وقت" },
  "stats.products":         { en: "40+", ur: "40+" },
  "stats.products_label":   { en: "Curated products", ur: "منتخب مصنوعات" },

  // How it works
  "how.step1_title":        { en: "Scan", ur: "اسکین" },
  "how.step1_desc":         { en: "Take 4 guided photos — face front, hair front, right, and left.", ur: "4 گائیڈڈ تصویریں لیں — چہرہ سامنے، بال سامنے، دائیں اور بائیں۔" },
  "how.step2_title":        { en: "Analyse", ur: "تجزیہ" },
  "how.step2_desc":         { en: "Computer vision reads your skin type, hydration, concerns, and hair type.", ur: "کمپیوٹر وژن آپ کی جلد کی قسم، نمی، مسائل اور بالوں کی قسم پڑھتا ہے۔" },
  "how.step3_title":        { en: "Routine", ur: "روٹین" },
  "how.step3_desc":         { en: "Receive a personalised morning, evening & hair care routine.", ur: "ذاتی صبح، شام اور بالوں کی دیکھ بھال کی روٹین حاصل کریں۔" },

  // Feature card
  "feature.title":          { en: "Not a quiz. A real scan.", ur: "کوئی کوئز نہیں۔ ایک حقیقی اسکین۔" },
  "feature.body":           { en: "Most beauty apps guess based on your answers. GlowAI reads your actual skin from a photo — hydration levels, detected concerns, skin type — and builds your routine from that data.", ur: "زیادہ تر بیوٹی ایپس صرف آپ کے جوابات پر اندازہ لگاتی ہیں۔ GlowAI آپ کی تصویر سے حقیقی جلد پڑھتی ہے اور اس ڈیٹا سے روٹین بناتی ہے۔" },

  // Footer CTA
  "cta.scan_now":           { en: "Scan your skin now", ur: "ابھی اپنی جلد اسکین کریں" },

  // Scanner
  "scan.centre_face":       { en: "Centre your face in the frame", ur: "اپنا چہرہ فریم کے وسط میں رکھیں" },
  "scan.hair_front":        { en: "Show the front of your hair", ur: "اپنے بالوں کا سامنے والا حصہ دکھائیں" },
  "scan.hair_right":        { en: "Turn to your right side", ur: "اپنی دائیں طرف مڑیں" },
  "scan.hair_left":         { en: "Turn to your left side", ur: "اپنی بائیں طرف مڑیں" },
  "scan.step_of":           { en: "Step {n} of {total}", ur: "مرحلہ {n} از {total}" },
  "scan.upload_instead":    { en: "Upload instead", ur: "اپلوڈ کریں" },

  // Lighting
  "light.too_dark":         { en: "Too dark — move to a brighter area", ur: "بہت تاریک — روشن جگہ جائیں" },
  "light.low_light":        { en: "Lighting could be better", ur: "روشنی بہتر ہو سکتی ہے" },
  "light.good":             { en: "Lighting optimal ✓", ur: "روشنی مناسب ✓" },
  "light.too_bright":       { en: "Very bright — step back slightly", ur: "بہت روشن — تھوڑا پیچھے جائیں" },
  "light.checking":         { en: "Checking image quality...", ur: "تصویر کا معیار جانچ رہے ہیں..." },

  // Quality gating
  "quality.no_face":        { en: "No face detected — move closer", ur: "چہرہ نہیں ملا — قریب آئیں" },
  "quality.face_small":     { en: "Move closer — face too small in frame", ur: "قریب آئیں — چہرہ بہت چھوٹا ہے" },
  "quality.face_off_centre":{ en: "Centre your face in the frame", ur: "چہرہ فریم کے وسط میں رکھیں" },
  "quality.good":           { en: "Perfect — tap to capture", ur: "بہترین — کیپچر کریں" },

  // Toasts
  "toast.light_pass_title": { en: "Image Quality Check Passed", ur: "تصویر کا معیار پاس" },
  "toast.light_pass_msg":   { en: "Optimal conditions detected — ready to capture.", ur: "بہترین حالات ملے — کیپچر کے لیے تیار۔" },
  "toast.light_fail_title": { en: "Image Quality Check Failed", ur: "تصویر کا معیار ناکام" },
  "toast.light_fail_msg":   { en: "Too dark — move to a brighter area for accurate analysis.", ur: "بہت تاریک — درست تجزیے کے لیے روشن جگہ جائیں۔" },
  "toast.light_warn_title": { en: "Lighting Sub-Optimal", ur: "روشنی کم مناسب" },
  "toast.light_warn_msg":   { en: "Low light detected — improve lighting for best results.", ur: "کم روشنی ملی — بہترین نتائج کے لیے روشنی بہتر کریں۔" },
  "toast.light_bright_msg": { en: "Very bright — step back slightly.", ur: "بہت روشن — تھوڑا پیچھے جائیں۔" },

  // Analyzing
  "analyze.title":          { en: "Diagnostic Analysis", ur: "تشخیصی تجزیہ" },
  "analyze.engine":         { en: "GlowAI Clinical Engine v2", ur: "گلو اے آئی کلینیکل انجن v2" },
  "analyze.progress":       { en: "Progress", ur: "پیشرفت" },

  // Results
  "results.title":          { en: "Your Personal Routine", ur: "آپ کی ذاتی روٹین" },
  "results.subtitle":       { en: "Based on our detailed AI analysis", ur: "ہمارے تفصیلی تجزیے پر مبنی" },
  "results.new_scan":       { en: "New Scan", ur: "نیا اسکین" },

  // Results / AnalysisDisplay
  "report.title":           { en: "Skin Analysis Report", ur: "جلد کے تجزیے کی رپورٹ" },
  "report.scan_id":         { en: "Scan ID:", ur: "اسکین آئی ڈی:" },
  "report.analysed":        { en: "Analysed:", ur: "تجزیہ کیا گیا:" },
  "report.hydration":       { en: "Hydration Index", ur: "نمی کا انڈیکس" },
  "report.parameter":       { en: "Parameter", ur: "پیرامیٹر" },
  "report.result":          { en: "Result", ur: "نتیجہ" },
  "report.confidence":      { en: "Confidence", ur: "اعتماد" },
  "report.tone":            { en: "Skin Tone", ur: "جلد کی رنگت" },
  "report.type":            { en: "Skin Type", ur: "جلد کی قسم" },
  "report.hair_color":      { en: "Hair Colour", ur: "بالوں کا رنگ" },
  "report.hair_type":       { en: "Hair Type", ur: "بالوں کی قسم" },
  "report.conditions":      { en: "Detected Conditions", ur: "تشخیص شدہ مسائل" },
  "report.severity":        { en: "Severity:", ur: "شدت:" },
  "report.healthy":         { en: "Healthy profile detected", ur: "صحت مند پروفائل پایا گیا" },
  "report.overall_conf":    { en: "Overall scan confidence:", ur: "مجموعی اسکین کا اعتماد:" },
  "report.disclaimer":      { en: "Analysis based on computer vision assessment of uploaded image. Not a medical diagnosis.", ur: "اپلوڈ کی گئی تصویر کے کمپیوٹر وژن تجزیے پر مبنی۔ یہ طبی تشخیص نہیں ہے۔" },

  // RecommendationList
  "rec.routine_protocol":   { en: "Clinical Routine Protocol", ur: "کلینیکل روٹین پروٹوکول" },
  "rec.prescribed":         { en: "Prescribed Regimen", ur: "تجویز کردہ روٹین" },
  "rec.ai_verified":        { en: "AI-Verified", ur: "اے آئی سے تصدیق شدہ" },
  "rec.morning_tab":        { en: "Morning", ur: "صبح" },
  "rec.evening_tab":        { en: "Evening", ur: "شام" },
  "rec.hair_tab":           { en: "Hair", ur: "بال" },
  "rec.morning_title":      { en: "Morning Protocol", ur: "صبح کا پروٹوکول" },
  "rec.evening_title":      { en: "Evening Protocol", ur: "شام کا پروٹوکول" },
  "rec.hair_title":         { en: "Hair Care Protocol", ur: "بالوں کا پروٹوکول" },
  "rec.active_products":    { en: "products active", ur: "مصنوعات فعال" },
  "rec.1_active":           { en: "1 product active", ur: "1 پروڈکٹ فعال" },
  "rec.min":                { en: "min", ur: "منٹ" },
  "rec.reset":              { en: "Reset", ur: "ری سیٹ کریں" },
  "rec.save_morning":       { en: "Save Morning", ur: "صبح محفوظ کریں" },
  "rec.save_evening":       { en: "Save Evening", ur: "شام محفوظ کریں" },
  "rec.save_hair":          { en: "Save Hair Routine", ur: "بالوں کی روٹین محفوظ کریں" },
  "rec.show_more":          { en: "Show {n} more products", ur: "مزید {n} مصنوعات دکھائیں" },
  "rec.show_1_more":        { en: "Show 1 more product", ur: "مزید 1 پروڈکٹ دکھائیں" },

  // Diagnostic Row
  "row.category":           { en: "Category:", ur: "قسم:" },
  "row.target":             { en: "Target:", ur: "ہدف:" },
  "row.efficacy":           { en: "Efficacy Match", ur: "مؤثریت کی مطابقت" },
  "row.rationale":          { en: "Clinical rationale", ur: "کلینیکل منطق" },
  "row.order":              { en: "Order", ur: "آرڈر" },

  // Errors
  "error.camera_title":     { en: "Camera couldn't start", ur: "کیمرہ شروع نہیں ہو سکا" },
  "error.analysis_title":   { en: "Analysis Interrupted", ur: "تجزیہ رک گیا" },
  "error.try_again":        { en: "Try again", ur: "دوبارہ کوشش کریں" },
  "error.upload_instead":   { en: "Upload photos instead", ur: "تصاویر اپلوڈ کریں" },

  // Privacy badge
  "badge.camera":           { en: "Bank-Level Privacy · Encrypted in Transit", ur: "بینک سطح کی رازداری · خفیہ ترسیل" },

  // Footer
  "footer.copyright":       { en: "© 2026 GlowAI · All rights reserved", ur: "© 2026 گلو اے آئی · جملہ حقوق محفوظ ہیں" },
  "footer.privacy":         { en: "Privacy Policy", ur: "رازداری کی پالیسی" },
  "footer.terms":           { en: "Terms of Service", ur: "سروس کی شرائط" },
  "footer.about":           { en: "About Us", ur: "ہمارے بارے میں" },
  "footer.contact":         { en: "Contact", ur: "رابطہ کریں" },

  // Upload Box
  "upload.title":           { en: "Upload Photos", ur: "تصاویر اپلوڈ کریں" },
  "upload.subtitle":        { en: "Select exactly 4 photos in this order:", ur: "اس ترتیب میں بالکل 4 تصاویر منتخب کریں:" },
  "upload.step1":           { en: "① Face — straight on", ur: "① چہرہ — سیدھا سامنے" },
  "upload.step2":           { en: "② Hair — front view", ur: "② بال — سامنے سے منظر" },
  "upload.step3":           { en: "③ Hair — right side", ur: "③ بال — دائیں طرف" },
  "upload.step4":           { en: "④ Hair — left side", ur: "④ بال — بائیں طرف" },
  "upload.btn_label":       { en: "Select 4 photos", ur: "4 تصاویر منتخب کریں" },
  "upload.btn_desc":        { en: "PNG, JPG · up to 10MB each", ur: "PNG, JPG · ہر ایک 10MB تک" },
  "upload.use_camera":      { en: "Use camera instead", ur: "اس کے بجائے کیمرہ استعمال کریں" },

  // Chat
  "chat.assistant":         { en: "GlowAI Assistant", ur: "گلو اے آئی اسسٹنٹ" },
  "chat.ai_badge":          { en: "AI", ur: "اے آئی" },
  "chat.skip":              { en: "Skip", ur: "چھوڑیں" },
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  isUrdu: false,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "en" || stored === "ur") setLangState(stored);
    } catch { /* ignore */ }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key: string) => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry["en"] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, isUrdu: lang === "ur" }}>
      <div dir={lang === "ur" ? "rtl" : "ltr"} lang={lang}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
