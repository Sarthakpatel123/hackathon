"use client";
// components/ZindagiProfileForm.tsx
// Step 1 — Zindagi Dashboard profile builder

import { useState, useEffect } from "react";
import { ZindagiProfile, calcZindagiScore, loadProfile, saveProfile } from "@/lib/zindagi";

interface Props {
  onComplete: (profile: ZindagiProfile) => void;
}

const STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana",
  "Uttar Pradesh","Uttarakhand","West Bengal","Other",
];

const SCORE_HINTS = [
  "Fill your profile to unlock matched schemes",
  "Great start! Add income & occupation",
  "Almost there — add land and category",
  "Profile complete! Matching all schemes",
];

export default function ZindagiProfileForm({ onComplete }: Props) {
  const [form, setForm] = useState<Partial<ZindagiProfile>>({});
  const [score, setScore] = useState(0);

  // Load saved profile on mount
  useEffect(() => {
    const saved = loadProfile();
    if (saved) setForm(saved);
  }, []);

  useEffect(() => {
    setScore(calcZindagiScore(form));
  }, [form]);

  const set = (key: keyof ZindagiProfile, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const profile = form as ZindagiProfile;
    saveProfile(profile);
    onComplete(profile);
  };

  const hintIdx = score < 30 ? 0 : score < 60 ? 1 : score < 90 ? 2 : 3;
  const scoreColor = score < 40 ? "#E24B4A" : score < 70 ? "#EF9F27" : "#1D9E75";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{
          display: "inline-block", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.1em", color: "#1D9E75", marginBottom: 6,
          background: "#E1F5EE", padding: "3px 10px", borderRadius: 6,
        }}>
          ZINDAGI DASHBOARD
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: "8px 0 4px" }}>
          Build your life profile
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          Fill once. Schemes auto-match forever.
        </p>
      </div>

      {/* Zindagi Score bar */}
      <div style={{
        background: "#fff", border: "0.5px solid #e5e7eb",
        borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#888" }}>Zindagi Score</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor }}>{score}%</span>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, marginBottom: 6 }}>
          <div style={{
            width: `${score}%`, height: 6, borderRadius: 4,
            background: scoreColor, transition: "width 0.4s, background 0.3s",
          }} />
        </div>
        <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{SCORE_HINTS[hintIdx]}</p>
      </div>

      {/* Form card */}
      <div style={{
        background: "#fff", border: "0.5px solid #e5e7eb",
        borderRadius: 12, padding: "1.25rem",
      }}>
        <SectionLabel>Basic identity</SectionLabel>
        <Row>
          <Field label="Full name">
            <input placeholder="Ramesh Kumar" value={form.name || ""}
              onChange={(e) => set("name", e.target.value)} style={inp} />
          </Field>
          <Field label="Age">
            <input type="number" placeholder="34" min={18} max={80}
              value={form.age || ""}
              onChange={(e) => set("age", parseInt(e.target.value))} style={inp} />
          </Field>
        </Row>
        <Row>
          <Field label="State">
            <select value={form.state || ""} onChange={(e) => set("state", e.target.value)} style={inp}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={form.category || ""} onChange={(e) => set("category", e.target.value as ZindagiProfile["category"])} style={inp}>
              <option value="">Select</option>
              {["General","OBC","SC","ST","EWS"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </Row>

        <SectionLabel>Occupation & income</SectionLabel>
        <Row>
          <Field label="Occupation">
            <select value={form.occupation || ""} onChange={(e) => set("occupation", e.target.value as ZindagiProfile["occupation"])} style={inp}>
              <option value="">Select</option>
              {["Farmer","Daily wage worker","Small business","Govt employee","Private job","Student","Unemployed"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Annual income (₹)">
            <input type="number" placeholder="120000" value={form.income || ""}
              onChange={(e) => set("income", parseInt(e.target.value))} style={inp} />
          </Field>
        </Row>
        <Row>
          <Field label="Land owned (acres)">
            <input type="number" placeholder="2.5" step={0.5} value={form.land || ""}
              onChange={(e) => set("land", parseFloat(e.target.value))} style={inp} />
          </Field>
          <Field label="Family size">
            <input type="number" placeholder="4" min={1} max={20}
              value={form.family || ""}
              onChange={(e) => set("family", parseInt(e.target.value))} style={inp} />
          </Field>
        </Row>

        <SectionLabel>Documents & assets</SectionLabel>
        <Row>
          <Field label="Has BPL card?">
            <select value={form.hasBPL === null || form.hasBPL === undefined ? "" : form.hasBPL ? "yes" : "no"}
              onChange={(e) => set("hasBPL", e.target.value === "" ? null : e.target.value === "yes")} style={inp}>
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Has Jan Dhan account?">
            <select value={form.hasJanDhan === null || form.hasJanDhan === undefined ? "" : form.hasJanDhan ? "yes" : "no"}
              onChange={(e) => set("hasJanDhan", e.target.value === "" ? null : e.target.value === "yes")} style={inp}>
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </Row>

        <button onClick={handleSubmit} style={{
          width: "100%", marginTop: "1.25rem", padding: "12px",
          background: "#1D9E75", color: "#fff", border: "none",
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Find my schemes →
        </button>
      </div>
    </div>
  );
}

// Small helpers
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "#aaa",
      textTransform: "uppercase", letterSpacing: "0.07em",
      margin: "1rem 0 0.5rem",
    }}>{children}</div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: "0.5px solid #d1d5db", borderRadius: 6,
  background: "#fff", color: "#111", outline: "none",
};
