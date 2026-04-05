"use client";

import React, { useState } from "react";
import {
  ZindagiProfile,
  Scheme,
  matchSchemes,
  calcZindagiScore,
  buildWhatsAppMessage,
} from "@/lib/zindagi";

interface Props {
  profile: ZindagiProfile;
  onEdit: () => void;
}

type Tab = "all" | "urgent" | "open" | "agents";

interface AgentConfig {
  name: string;
  icon: string;
  color: string;
  textColor: string;
  query: (p: ZindagiProfile) => string;
}

const AGENT_MAP: Record<string, AgentConfig> = {
  "Krishi Mitra": {
    name: "Krishi Mitra",
    icon: "🌾",
    color: "#EAF3DE",
    textColor: "#3B6D11",
    query: (p) => `I am a farmer in ${p.state} with ${p.land} acres. Which PM-KISAN and state farm schemes apply to me?`,
  },
  "Artha Advisor": {
    name: "Artha Advisor",
    icon: "₹",
    color: "#E6F1FB",
    textColor: "#185FA5",
    query: (p) => `My annual income is ₹${p.income?.toLocaleString("en-IN")} and family size is ${p.family}. What loans and financial schemes am I eligible for?`,
  },
  "Health Guide": {
    name: "Health Guide",
    icon: "⚕️",
    color: "#FBEAF0",
    textColor: "#993556",
    query: (p) => `I am ${p.age} years old from ${p.state}. What health schemes like Ayushman Bharat apply to me?`,
  },
  "Career Mitra": {
    name: "Career Mitra",
    icon: "🎯",
    color: "#EEEDFE",
    textColor: "#534AB7",
    query: (p) => `I am ${p.age} years old, ${p.occupation}, from ${p.state}. What skill and employment schemes can I apply for?`,
  },
};

const URGENCY_COLORS: Record<string, { border: string; bg: string; text: string; label: string }> = {
  urgent: { border: "#E24B4A", bg: "#FCEBEB", text: "#A32D2D", label: "Urgent" },
  high:   { border: "#EF9F27", bg: "#FAEEDA", text: "#854F0B", label: "High" },
  medium: { border: "#1D9E75", bg: "#E1F5EE", text: "#0F6E56", label: "Open" },
};

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: valueColor || "#111" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: Scheme }) {
  const uc = URGENCY_COLORS[scheme.urgency];
  return (
    <div style={{
      border: "0.5px solid #e5e7eb",
      borderLeft: `3px solid ${uc.border}`,
      borderRadius: 8, padding: "1rem", marginBottom: 8,
      background: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{scheme.icon} {scheme.name}</div>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 4,
          background: uc.bg, color: uc.text, fontWeight: 600, flexShrink: 0,
        }}>{uc.label}</span>
      </div>
      <p style={{ fontSize: 12, color: "#666", margin: "4px 0 8px" }}>{scheme.desc}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#aaa" }}>{scheme.deadline}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75" }}>
            Up to ₹{scheme.benefit.toLocaleString("en-IN")}
          </span>
          {scheme.applyUrl && (
            <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#185FA5", textDecoration: "none" }}>
              Apply →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchemeRadar({ profile, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const allSchemes = matchSchemes(profile);
  const urgent = allSchemes.filter((s) => s.urgency === "urgent");
  const score = calcZindagiScore(profile);
  const totalBenefit = allSchemes.reduce((a, s) => a + s.benefit, 0);

  const displayed =
    tab === "all" ? allSchemes :
    tab === "urgent" ? urgent :
    tab === "open" ? allSchemes.filter((s) => s.urgency !== "urgent") :
    [];

  const waUrl = `https://wa.me/14155238886?text=${encodeURIComponent(buildWhatsAppMessage(profile, allSchemes))}`;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#1D9E75", marginBottom: 2 }}>
            SCHEME RADAR
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            {profile.name || "Your dashboard"}
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#1D9E75" }}>{score}%</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>Zindagi Score</div>
        </div>
      </div>

      {/* Profile chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "1rem" }}>
        {([
          profile.occupation,
          profile.state,
          profile.category,
          profile.income ? `₹${Math.round(profile.income / 1000)}K/yr` : null,
          profile.land ? `${profile.land} acres` : null,
        ] as (string | null)[]).filter(Boolean).map((chip) => (
          <span key={chip!} style={{
            fontSize: 11, padding: "3px 10px",
            background: "#f3f4f6", borderRadius: 6, color: "#555",
          }}>{chip}</span>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: "1rem" }}>
        <StatCard label="Matched" value={String(allSchemes.length)} />
        <StatCard label="Urgent" value={String(urgent.length)} valueColor="#A32D2D" />
        <StatCard label="Potential/yr" value={`₹${Math.round(totalBenefit / 1000)}K`} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        {(["all", "urgent", "open", "agents"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 14px", fontSize: 12, border: "0.5px solid",
            borderColor: tab === t ? "#1D9E75" : "#e5e7eb",
            borderRadius: 6, cursor: "pointer",
            background: tab === t ? "#1D9E75" : "transparent",
            color: tab === t ? "#fff" : "#555",
            fontWeight: tab === t ? 600 : 400,
          }}>
            {t === "all" ? "All schemes" : t === "agents" ? "Ask agents" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Schemes list */}
      {tab !== "agents" && (
        <div>
          {displayed.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>
              No schemes in this category for your profile.
            </div>
          ) : displayed.map((s) => (
            <SchemeCard key={s.id} scheme={s} />
          ))}
        </div>
      )}

      {/* Agents panel */}
      {tab === "agents" && (
        <div>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
            Your profile is already loaded — agents know who you are.
          </p>
          {Object.values(AGENT_MAP).map((agent) => (
            <a
              key={agent.name}
              href={`/?agent=${encodeURIComponent(agent.name)}&q=${encodeURIComponent(agent.query(profile))}`}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", border: "0.5px solid #e5e7eb",
                borderRadius: 8, marginBottom: 8, textDecoration: "none",
                background: "#fff", color: "#111",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: agent.color, color: agent.textColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>{agent.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{agent.query(profile).slice(0, 60)}…</div>
              </div>
            </a>
          ))}

          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "12px 16px", background: "#25D366",
            color: "#fff", borderRadius: 8, textDecoration: "none",
            fontSize: 14, fontWeight: 600, marginTop: 12,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.529 5.843L0 24l6.335-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.372l-.36-.213-3.73.888.937-3.617-.234-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.418 0 9.818 4.398 9.818 9.818 0 5.419-4.4 9.818-9.818 9.818z"/>
            </svg>
            Get deadline alerts on WhatsApp
          </a>
        </div>
      )}

      {/* Edit profile */}
      <button onClick={onEdit} style={{
        width: "100%", marginTop: "1rem", padding: "10px",
        background: "transparent", border: "0.5px solid #e5e7eb",
        borderRadius: 8, fontSize: 12, color: "#888", cursor: "pointer",
      }}>
        Edit profile
      </button>
    </div>
  );
}
