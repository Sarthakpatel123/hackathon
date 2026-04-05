"use client";
// app/zindagi/page.tsx  (or pages/zindagi.tsx if using Pages Router)
// Main page — orchestrates Zindagi Dashboard + Scheme Radar flow

import { useState } from "react";
import ZindagiProfileForm from "@/app/components/ZindagiProfileForm";
import SchemeRadar from "@/app/components/SchemeRadar";
import { ZindagiProfile } from "@/lib/zindagi";

type Step = "profile" | "radar";

export default function ZindagiPage() {
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<ZindagiProfile | null>(null);

  const handleProfileComplete = (p: ZindagiProfile) => {
    setProfile(p);
    setStep("radar");
    // Scroll to top on mobile
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Progress indicator */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "#fff", borderBottom: "0.5px solid #e5e7eb",
        padding: "10px 1rem",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>🤖 MARGDARSHAK</span>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
            <StepDot active={step === "profile"} done={step === "radar"} label="Profile" />
            <div style={{ width: 20, height: 1, background: "#e5e7eb" }} />
            <StepDot active={step === "radar"} done={false} label="Schemes" />
          </div>
        </div>
      </div>

      {step === "profile" && (
        <ZindagiProfileForm onComplete={handleProfileComplete} />
      )}

      {step === "radar" && profile && (
        <SchemeRadar profile={profile} onEdit={() => setStep("profile")} />
      )}
    </main>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: done ? "#1D9E75" : active ? "#1D9E75" : "#e5e7eb",
        opacity: active && !done ? 0.6 : 1,
        border: `1px solid ${done || active ? "#1D9E75" : "#d1d5db"}`,
      }} />
      <span style={{ fontSize: 11, color: active || done ? "#1D9E75" : "#aaa" }}>{label}</span>
    </div>
  );
}
