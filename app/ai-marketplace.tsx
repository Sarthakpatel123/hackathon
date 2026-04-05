"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import Sidebar from "@/app/components/Sidebar";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
} from "firebase/auth";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Client (for chat history only) ──────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  totalQueries: number;
  favoriteAgents: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addToFavorites: (agentId: string) => void;
  removeFromFavorites: (agentId: string) => void;
  incrementQueries: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  showPasswordReset: boolean;
  setShowPasswordReset: (v: boolean) => void;
  updatePassword: (password: string) => Promise<boolean>;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

// ─── Auth Provider ────────────────────────────────────────────────────────────

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
          joinedAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          totalQueries: 0,
          favoriteAgents: [],
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  const addToFavorites = (agentId: string) => {
    if (user && !user.favoriteAgents.includes(agentId)) {
      updateUser({ favoriteAgents: [...user.favoriteAgents, agentId] });
    }
  };

  const removeFromFavorites = (agentId: string) => {
    if (user) {
      updateUser({ favoriteAgents: user.favoriteAgents.filter((id) => id !== agentId) });
    }
  };

  const incrementQueries = () => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, totalQueries: prev.totalQueries + 1 } : null);
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch {
      return false;
    }
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    try {
      if (!auth.currentUser) return false;
      await firebaseUpdatePassword(auth.currentUser, password);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, signup, logout, updateUser,
      addToFavorites, removeFromFavorites, incrementQueries,
      resetPassword, showPasswordReset, setShowPasswordReset, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Password Reset Modal ─────────────────────────────────────────────────────

function PasswordResetModal() {
  const { showPasswordReset, setShowPasswordReset, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setMessage(""); setStatus("idle");
    if (password.length < 6) { setMessage("At least 6 characters"); setStatus("error"); return; }
    if (password !== confirm) { setMessage("Passwords don't match"); setStatus("error"); return; }
    setLoading(true);
    const ok = await updatePassword(password);
    if (ok) {
      setMessage("Password updated! You're now logged in.");
      setStatus("success");
      setTimeout(() => setShowPasswordReset(false), 2000);
    } else {
      setMessage("Update failed. Try requesting a new reset link.");
      setStatus("error");
    }
    setLoading(false);
  };

  if (!showPasswordReset) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
      <div style={{ maxWidth: 400, width: "100%", background: "linear-gradient(135deg, #0f0f14 0%, #0a0a0f 100%)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Set New Password</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Choose something you'll remember this time</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Same password again"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
        </div>

        {message && (
          <div style={{ marginBottom: 16, padding: "10px 12px", background: status === "error" ? "rgba(200,40,40,0.1)" : "rgba(40,160,80,0.1)", border: `1px solid ${status === "error" ? "rgba(200,40,40,0.2)" : "rgba(40,160,80,0.25)"}`, borderRadius: 10, color: status === "error" ? "#ef9a9a" : "#81c784", fontSize: 12, textAlign: "center" }}>
            {status === "error" ? "⚠" : "✓"} {message}
          </div>
        )}

        {status !== "success" && (
          <button onClick={handleReset} disabled={loading}
            style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c5cbf 0%, #5a3d8f 100%)", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : "Update Password →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────

function AuthModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup, resetPassword } = useAuth();

  const reset = () => { setError(""); setSuccess(""); setName(""); setEmail(""); setPassword(""); };

  const handleSubmit = async () => {
    setError(""); setSuccess(""); setLoading(true);

    if (mode === "forgot") {
      if (!email) { setError("Please enter your email"); setLoading(false); return; }
      const ok = await resetPassword(email);
      if (ok) {
        setSuccess("Reset link sent! Check your inbox.");
      } else {
        setError("Could not send reset email. Check the address.");
      }
      setLoading(false);
      return;
    }

    let succeeded = false;
    if (mode === "login") {
      succeeded = await login(email, password);
      if (!succeeded) setError("Invalid email or password");
    } else {
      if (name.length < 2) { setError("Please enter your name"); setLoading(false); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
      succeeded = await signup(name, email, password);
      if (!succeeded) setError("Email already exists or is invalid");
    }

    if (succeeded) { onSuccess(); onClose(); reset(); }
    setLoading(false);
  };

  if (!isOpen) return null;

  const modeConfig = {
    login:  { emoji: "👋", title: "Welcome Back",   subtitle: "Login to access all agents" },
    signup: { emoji: "✨", title: "Create Account",  subtitle: "Join the MARGDARSHAK Marketplace" },
    forgot: { emoji: "🔑", title: "Reset Password",  subtitle: "We'll send a reset link to your email" },
  };
  const cfg = modeConfig[mode];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ maxWidth: 440, width: "100%", background: "linear-gradient(135deg, #0f0f14 0%, #0a0a0f 100%)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", padding: 32 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{cfg.emoji}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{cfg.title}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{cfg.subtitle}</p>
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
        </div>

        {mode !== "forgot" && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "login" ? "••••••••" : "At least 6 characters"}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
          </div>
        )}

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button onClick={() => { reset(); setMode("forgot"); }}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Forgot password?
            </button>
          </div>
        )}

        {(mode === "forgot" || mode === "signup") && <div style={{ marginBottom: 20 }} />}

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 12px", background: "rgba(200,40,40,0.1)", border: "1px solid rgba(200,40,40,0.2)", borderRadius: 10, color: "#ef9a9a", fontSize: 12, textAlign: "center" }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 16, padding: "10px 12px", background: "rgba(40,160,80,0.1)", border: "1px solid rgba(40,160,80,0.25)", borderRadius: 10, color: "#81c784", fontSize: 12, textAlign: "center" }}>
            ✓ {success}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c5cbf 0%, #5a3d8f 100%)", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : mode === "login" ? "Login →" : mode === "signup" ? "Create Account →" : "Send Reset Link →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {mode !== "forgot" && (
            <button onClick={() => { reset(); setMode(mode === "login" ? "signup" : "login"); }}
              style={{ background: "transparent", border: "none", color: "#7c5cbf", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => { reset(); setMode("login"); }}
              style={{ background: "transparent", border: "none", color: "#7c5cbf", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              ← Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const avatarLetter = user.name.charAt(0).toUpperCase();
  const avatarColor = ["#7c5cbf", "#2e7d32", "#1565c0", "#c62828", "#e65100"][user.id.charCodeAt(0) % 5];

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button onClick={() => setIsOpen(!isOpen)}
        style={{ width: 40, height: 40, borderRadius: "50%", background: avatarColor, border: "2px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {avatarLetter}
      </button>

      {isOpen && (
        <div style={{ position: "absolute", top: 50, right: 0, width: 280, background: "#0f0f14", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", overflow: "hidden", zIndex: 1000 }}>
          <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>{avatarLetter}</div>
              <div>
                <div style={{ fontWeight: 600, color: "#fff" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{user.email}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <span>📊 Total Queries</span>
              <span style={{ color: "#7c5cbf", fontWeight: 600 }}>{user.totalQueries}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <span>⭐ Favorite Agents</span>
              <span style={{ color: "#7c5cbf", fontWeight: 600 }}>{user.favoriteAgents.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <span>📅 Joined</span>
              <span style={{ fontSize: 11 }}>{new Date(user.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={() => { logout(); setIsOpen(false); }}
            style={{ width: "100%", padding: "12px", background: "rgba(200,40,40,0.1)", border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", color: "#ef9a9a", cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "background 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,40,40,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(200,40,40,0.1)"; }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Types for Agent ──────────────────────────────────────────────────────────

interface Example { label: string; q: string; }
interface QuickRef { label: string; val: string; }
interface Agent {
  id: string; name: string; tagline: string; category: string; icon: string;
  color: string; bg: string; border: string; accent: string; muted: string; dim: string;
  runs: number; featured: boolean; systemPrompt: string; examples: Example[];
  inputLabel: string; inputPlaceholder: string; btnLabel: string;
  disclaimer: string | null; quickRef: QuickRef[] | null;
}

// ─── Agent Definitions ────────────────────────────────────────────────────────

const AGENTS: Agent[] = [
  {
    id: "career", name: "Career Mitra", tagline: "Career guidance, skill development & job opportunities",
    category: "Career", icon: "🎯", color: "#ff6b35", bg: "#1a0d08", border: "rgba(255,107,53,0.3)",
    accent: "#ffb74d", muted: "#ff8c42", dim: "rgba(255,107,53,0.12)", runs: 2150, featured: true,
    systemPrompt: `You are Career Mitra. Keep responses SHORT (max 3-4 sentences). Be direct, practical, and actionable. No fluff, no long explanations. Use bullet points only when necessary. Get straight to the point.`,
    examples: [
      { label: "🎓 Career guidance", q: "I just completed 12th with PCM. I'm good at problem-solving but don't want engineering. What career options do I have?" },
      { label: "💼 Job preparation", q: "I have a B.Com degree and 2 years of gap. How do I prepare for banking exams?" },
      { label: "🚀 Skill development", q: "I want to switch from teaching to IT. What skills should I learn?" },
      { label: "📝 Resume review", q: "I'm a frontend developer with 3 years experience. How can I make my resume stand out?" },
      { label: "💡 Entrepreneurship", q: "I want to start my own food business. What government schemes are available?" },
    ],
    inputLabel: "Your career question", inputPlaceholder: "Ask about careers, skills, jobs, education...",
    btnLabel: "🎯 Ask Career Mitra", disclaimer: "Career guidance only — decisions should be based on your personal research and circumstances",
    quickRef: [{ label: "NCS Portal", val: "ncs.gov.in" }, { label: "PMKVY", val: "Skill India" }, { label: "SWAYAM", val: "Free courses" }],
  },
  {
    id: "krishi", name: "Krishi Mitra", tagline: "Crop advice, mandi prices & Govt schemes",
    category: "Agriculture", icon: "🌾", color: "#2e7d32", bg: "#0a1a0d", border: "rgba(76,175,80,0.25)",
    accent: "#a5d6a7", muted: "#66bb6a", dim: "rgba(76,175,80,0.1)", runs: 3240, featured: true,
    systemPrompt: `You are Krishi Mitra. Give VERY CONCISE answers (2-3 sentences max). Just the key facts - crop advice, prices, schemes. No lengthy explanations.`,
    examples: [
      { label: "🌾 Crop advice", q: "I have 2 acres in Punjab. It's October. What to grow after paddy? My soil is loamy clay." },
      { label: "📊 Mandi prices", q: "What is the MSP for wheat 2024-25? Best mandis in Haryana?" },
      { label: "🏛️ Schemes", q: "I am a small farmer with 1.5 acres. What government schemes am I eligible for?" },
    ],
    inputLabel: "Your farming question", inputPlaceholder: "Ask about crops, prices, schemes...",
    btnLabel: "🌱 Ask Krishi Mitra", disclaimer: null, quickRef: null,
  },
  {
    id: "gst", name: "GST Saathi", tagline: "Filing help, ITC & return status",
    category: "Tax", icon: "🧾", color: "#1565c0", bg: "#050d1a", border: "rgba(21,101,192,0.3)",
    accent: "#90caf9", muted: "#42a5f5", dim: "rgba(21,101,192,0.1)", runs: 2180, featured: false,
    systemPrompt: `You are GST Saathi. Keep answers BRIEF (1-2 short paragraphs max). Just deadlines, rates, and steps. No extra details unless asked.`,
    examples: [
      { label: "📋 Filing", q: "I'm a monthly GST filer. What returns do I need in November 2024?" },
      { label: "💰 ITC", q: "Can I claim ITC on a car purchased for business?" },
      { label: "🔍 HSN codes", q: "HSN code and GST rate for ready-made garments above ₹1000?" },
    ],
    inputLabel: "Your GST question", inputPlaceholder: "Ask about filing, ITC, HSN codes...",
    btnLabel: "🧾 Ask GST Saathi", disclaimer: "Not legal advice — consult a CA for complex matters",
    quickRef: [{ label: "GSTR-1", val: "11th monthly" }, { label: "GSTR-3B", val: "20th monthly" }, { label: "GSTR-9", val: "31st Dec" }],
  },
  {
    id: "health", name: "Health Guide", tagline: "Symptoms, medicines & wellness advice",
    category: "Healthcare", icon: "⚕", color: "#c62828", bg: "#130808", border: "rgba(198,40,40,0.3)",
    accent: "#ef9a9a", muted: "#e57373", dim: "rgba(198,40,40,0.1)", runs: 4120, featured: true,
    systemPrompt: `You are Health Guide. Give SHORT, helpful answers (3 sentences max). Just symptoms info, basic guidance. Always add "see a doctor" briefly.`,
    examples: [
      { label: "🤒 Symptoms", q: "I have had a persistent dry cough for 3 weeks, mild fever in evenings. What could this be?" },
      { label: "💊 Medicines", q: "What is the difference between paracetamol and ibuprofen?" },
      { label: "🥗 Wellness", q: "I am pre-diabetic with HbA1c of 6.1. What diet changes can help?" },
    ],
    inputLabel: "Your health question", inputPlaceholder: "Ask about symptoms, medicines, wellness...",
    btnLabel: "⚕ Ask Health Guide", disclaimer: "For information only — always consult a qualified doctor for medical advice",
    quickRef: null,
  },
  {
    id: "legal", name: "Kanoon Mitra", tagline: "Indian law made simple",
    category: "Legal", icon: "⚖", color: "#4a148c", bg: "#0c0714", border: "rgba(74,20,140,0.35)",
    accent: "#ce93d8", muted: "#ab47bc", dim: "rgba(74,20,140,0.12)", runs: 1560, featured: false,
    systemPrompt: `You are Kanoon Mitra. Keep it SHORT (2-3 sentences). Just the legal point, section number, and next step. No long explanations.`,
    examples: [
      { label: "🏠 Tenant rights", q: "My landlord is refusing to return my security deposit of ₹50,000. What are my legal options?" },
      { label: "🛍️ Consumer", q: "I bought a defective phone online. The seller is ignoring my return request. How do I file a complaint?" },
      { label: "📄 RTI", q: "How do I file an RTI to get information about a pending government job application?" },
    ],
    inputLabel: "Your legal question", inputPlaceholder: "Ask about your rights, procedures, laws...",
    btnLabel: "⚖ Ask Kanoon Mitra", disclaimer: "General legal information only — consult a qualified advocate for your specific case",
    quickRef: null,
  },
  {
    id: "finance", name: "Artha Advisor", tagline: "Personal finance, loans & investments",
    category: "Finance", icon: "₹", color: "#e65100", bg: "#110900", border: "rgba(230,81,0,0.3)",
    accent: "#ffcc80", muted: "#ffa726", dim: "rgba(230,81,0,0.1)", runs: 2890, featured: false,
    systemPrompt: `You are Artha Advisor. Be CONCISE (max 50 words). Give numbers, rates, and simple advice. No financial jargon essays.`,
    examples: [
      { label: "📈 Investing", q: "I am 28 years old with ₹20,000/month to invest. I want to build ₹1 crore in 15 years. What strategy should I follow?" },
      { label: "🏦 Home loan", q: "I want to take a ₹50 lakh home loan for 20 years. What will my EMI be?" },
      { label: "💰 Tax saving", q: "I am in the 30% tax bracket earning ₹18 lakh. Should I choose old or new tax regime?" },
    ],
    inputLabel: "Your finance question", inputPlaceholder: "Ask about savings, investments, loans...",
    btnLabel: "₹ Ask Artha Advisor", disclaimer: "General financial education — consult a SEBI-registered advisor before investing",
    quickRef: null,
  },
];

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Career", "Agriculture", "Tax", "Healthcare", "Legal", "Finance"];

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Career:      { bg: "#1a0d08", text: "#ffb74d", border: "rgba(255,107,53,0.4)" },
  Agriculture: { bg: "#0d1f10", text: "#a5d6a7", border: "rgba(76,175,80,0.4)" },
  Tax:         { bg: "#070e1c", text: "#90caf9", border: "rgba(21,101,192,0.4)" },
  Healthcare:  { bg: "#1c0a0a", text: "#ef9a9a", border: "rgba(198,40,40,0.4)" },
  Legal:       { bg: "#110a1c", text: "#ce93d8", border: "rgba(74,20,140,0.4)" },
  Finance:     { bg: "#1a0d00", text: "#ffcc80", border: "rgba(230,81,0,0.4)" },
};

// ─── Agent Panel ──────────────────────────────────────────────────────────────

function AgentPanel({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { user, incrementQueries, addToFavorites, removeFromFavorites } = useAuth();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const [attachedFile, setAttachedFile] = useState<{ type: "image" | "pdf"; base64: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const chatIdRef = useRef<string | null>(null);

  const isFavorite = user?.favoriteAgents.includes(agent.id) || false;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Load chat history ──
  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      const { data } = await supabase
        .from("chat_history")
        .select("id, messages")
        .eq("user_id", user.id)
        .eq("agent_id", agent.id)
        .maybeSingle();
      if (data) {
        chatIdRef.current = data.id;
        setMessages(data.messages || []);
      }
    }
    loadHistory();
  }, [agent.id, user?.id]);

  // ── Save chat history ──
  async function saveHistory(msgs: { role: "user" | "assistant"; content: string }[]) {
    if (!user) return;
    if (chatIdRef.current) {
      await supabase.from("chat_history").update({ messages: msgs, updated_at: new Date().toISOString() }).eq("id", chatIdRef.current);
    } else {
      const { data } = await supabase.from("chat_history").insert({ user_id: user.id, agent_id: agent.id, messages: msgs }).select("id").single();
      if (data) chatIdRef.current = data.id;
    }
  }

 useEffect(() => {
  const el = outputRef.current;
  if (!el) return;

  if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
    el.scrollTop = el.scrollHeight;
  }
}, [messages, loading]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        recognitionRef.current?.stop();
      }
    };
  }, []);

  function speakText(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/#{1,3} /g, "").replace(/\*\*/g, "").replace(/[▸•\-]/g, "").replace(/\n/g, " ").trim();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "hi-IN";
      utter.rate = 0.9;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch { setIsSpeaking(false); }
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }

  function startVoice() {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) { alert("Voice not supported in this browser."); return; }
    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      recognition.lang = "hi-IN";
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (e: any) => {
        if (mountedRef.current) setQuery(e.results[0][0].transcript);
      };
      recognition.start();
    } catch { alert("Could not start voice recognition."); }
  }

  function stopVoice() { recognitionRef.current?.stop(); setIsListening(false); }

  function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) { alert("Only images and PDFs are supported!"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setAttachedFile({ type: isImage ? "image" : "pdf", base64, name: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function clearHistory() {
    setMessages([]);
    setConfirmClear(false);
    if (chatIdRef.current) {
      await supabase.from("chat_history").update({ messages: [] }).eq("id", chatIdRef.current);
    }
  }

  function exportChat() {
    const text = messages.map((m) => `${m.role === "user" ? "You" : agent.name}:\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agent.name}-chat-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderText(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return <h3 key={i} style={{ fontSize: 12, fontWeight: 700, color: agent.muted, margin: "16px 0 8px", textTransform: "uppercase", borderBottom: `1px solid ${agent.border}`, paddingBottom: 4 }}>{line.slice(3)}</h3>;
      if (/^\*\*.*\*\*$/.test(line.trim()))
        return <p key={i} style={{ fontWeight: 700, color: agent.accent, margin: "10px 0 4px", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- ") || line.startsWith("• "))
        return (
          <div key={i} style={{ display: "flex", gap: 10, margin: "6px 0" }}>
            <span style={{ color: agent.color, flexShrink: 0 }}>▸</span>
            <span style={{ color: agent.accent, fontSize: 13.5, lineHeight: 1.6 }}>{line.slice(2)}</span>
          </div>
        );
      if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
      return <p key={i} style={{ color: agent.accent, fontSize: 13.5, lineHeight: 1.65, margin: "4px 0", opacity: 0.85 }}>{line}</p>;
    });
  }

  async function runAgent() {
    if ((!query.trim() && !attachedFile) || loading) return;

    const userMsg = { role: "user" as const, content: query || (attachedFile ? `[Attached: ${attachedFile.name}]` : "") };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setQuery("");
    setAttachedFile(null);
    setLoading(true);
    setError("");

    if (user) incrementQueries();

    let assistantText = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: agent.systemPrompt, messages: updatedMessages, file: attachedFile ?? undefined }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                assistantText += text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantText };
                  return updated;
                });
              }
            } catch { }
          }
        }
      }

      if (assistantText) speakText(assistantText);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection error.");
    } finally {
      if (assistantText) {
        const finalMessages = [...updatedMessages, { role: "assistant" as const, content: assistantText }];
        await saveHistory(finalMessages);
      }
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 900, background: agent.bg, borderRadius: 24, border: `1px solid ${agent.border}`, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5)` }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${agent.border}`, background: `linear-gradient(135deg, ${agent.dim} 0%, ${agent.bg} 100%)`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${agent.color}20 0%, ${agent.color}40 100%)`, border: `1px solid ${agent.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{agent.icon}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: agent.accent }}>{agent.name}</div>
              <div style={{ fontSize: 12, color: agent.muted }}>{agent.tagline} · {agent.runs.toLocaleString()} runs</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {user && (
              <button onClick={() => isFavorite ? removeFromFavorites(agent.id) : addToFavorites(agent.id)}
                style={{ fontSize: 20, padding: "6px 12px", borderRadius: 8, border: `1px solid ${agent.border}`, background: isFavorite ? agent.color : "rgba(255,255,255,0.05)", color: isFavorite ? "#fff" : agent.muted, cursor: "pointer" }}>
                {isFavorite ? "⭐" : "☆"}
              </button>
            )}
            {messages.length > 0 && (
              <>
                <button onClick={exportChat} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${agent.border}`, background: "rgba(255,255,255,0.05)", color: agent.muted, cursor: "pointer" }}>📤 Export</button>
                {confirmClear ? (
                  <>
                    <button onClick={clearHistory} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(200,40,40,0.4)", background: "rgba(200,40,40,0.15)", color: "#ef9a9a", cursor: "pointer" }}>Sure?</button>
                    <button onClick={() => setConfirmClear(false)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${agent.border}`, background: "rgba(255,255,255,0.05)", color: agent.muted, cursor: "pointer" }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmClear(true)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${agent.border}`, background: "rgba(255,255,255,0.05)", color: agent.muted, cursor: "pointer" }}>🗑️ Clear</button>
                )}
              </>
            )}
            <button onClick={() => { stopSpeaking(); onClose(); }} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${agent.border}`, background: "rgba(255,255,255,0.05)", color: agent.muted, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        </div>

        {/* Messages */}
        <div ref={outputRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 64, opacity: 0.3 }}>{agent.icon}</div>
              <p style={{ fontSize: 14, color: agent.muted }}>Ask anything or try an example</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
                {agent.examples.map((ex, i) => (
                  <button key={i} onClick={() => setQuery(ex.q)} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 24, border: `1px solid ${agent.border}`, background: agent.dim, color: agent.accent, cursor: "pointer" }}>{ex.label}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 6 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", maxWidth: "80%" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.role === "user" ? agent.color : agent.dim, border: `1px solid ${agent.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: msg.role === "user" ? 14 : 18 }}>{msg.role === "user" ? "👤" : agent.icon}</div>
                <div style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? agent.color : agent.dim, border: `1px solid ${agent.border}` }}>
                  {msg.role === "user"
                    ? <p style={{ margin: 0, fontSize: 14, color: "#fff" }}>{msg.content}</p>
                    : <>{renderText(msg.content)}<button onClick={() => navigator.clipboard.writeText(msg.content)} style={{ marginTop: 12, fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${agent.border}`, background: "transparent", color: agent.muted, cursor: "pointer" }}>📋 Copy</button></>}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: agent.dim, border: `1px solid ${agent.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{agent.icon}</div>
              <div style={{ padding: "12px 20px", borderRadius: "4px 16px 16px 16px", background: agent.dim, border: `1px solid ${agent.border}`, display: "flex", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.color, animation: "pulse 1.2s ease-in-out infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.color, animation: "pulse 1.2s ease-in-out 0.2s infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.color, animation: "pulse 1.2s ease-in-out 0.4s infinite" }} />
              </div>
            </div>
          )}
          {error && <div style={{ padding: "12px 16px", background: "rgba(200,40,40,0.1)", border: "1px solid rgba(200,40,40,0.2)", borderRadius: 12, color: "#ef9a9a", fontSize: 13 }}>⚠ {error}</div>}
        </div>

        {/* Input */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${agent.border}`, background: agent.dim, flexShrink: 0 }}>
          {attachedFile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${agent.border}` }}>
              <span>{attachedFile.type === "image" ? "🖼️" : "📄"}</span>
              <span style={{ fontSize: 13, color: agent.accent, flex: 1 }}>{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} style={{ background: "transparent", border: "none", color: agent.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileAttach} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${agent.border}`, background: "rgba(255,255,255,0.03)", color: agent.muted, cursor: "pointer", fontSize: 20 }}>📎</button>
            <button onClick={isListening ? stopVoice : startVoice} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${isListening ? agent.color : agent.border}`, background: isListening ? agent.color : "rgba(255,255,255,0.03)", color: isListening ? "#fff" : agent.muted, cursor: "pointer", fontSize: 20, animation: isListening ? "pulse 1s ease-in-out infinite" : "none" }}>🎙️</button>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAgent(); } }} placeholder={agent.inputPlaceholder} rows={1}
              style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${agent.border}`, borderRadius: 12, color: agent.accent, fontFamily: "inherit", fontSize: 14, padding: "11px 14px", resize: "none", outline: "none" }} />
            {isSpeaking && <button onClick={stopSpeaking} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${agent.border}`, background: agent.dim, color: agent.accent, cursor: "pointer", fontSize: 20 }}>🔇</button>}
            <button onClick={runAgent} disabled={loading || (!query.trim() && !attachedFile)}
              style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: loading || (!query.trim() && !attachedFile) ? agent.dim : `linear-gradient(135deg, ${agent.color} 0%, ${agent.color}cc 100%)`, color: loading || (!query.trim() && !attachedFile) ? agent.muted : "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: loading || (!query.trim() && !attachedFile) ? "not-allowed" : "pointer" }}>
              {loading ? "..." : "Send →"}
            </button>
          </div>
        </div>
        {agent.disclaimer && <div style={{ padding: "8px 20px 12px", textAlign: "center", background: agent.dim }}><span style={{ fontSize: 10, color: agent.muted, opacity: 0.6 }}>ℹ️ {agent.disclaimer}</span></div>}
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, onTry, index }: { agent: Agent; onTry: (a: Agent) => void; index: number }) {
  const { user } = useAuth();
  const cat = CAT_COLORS[agent.category] || CAT_COLORS.Career;
  const isFavorite = user?.favoriteAgents.includes(agent.id) || false;

  return (
    <div style={{ background: "linear-gradient(135deg, #0f0f14 0%, #0a0a0f 100%)", border: agent.featured ? `1.5px solid ${agent.color}` : "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px", cursor: "pointer", transition: "all 0.3s", animation: `cardIn 0.5s ease both`, animationDelay: `${index * 0.05}s`, position: "relative" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = agent.color; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = agent.featured ? agent.color : "rgba(255,255,255,0.08)"; }}
      onClick={() => onTry(agent)}>
      {agent.featured && <div style={{ position: "absolute", top: 0, right: 0, background: `linear-gradient(135deg, ${agent.color} 0%, ${agent.color}cc 100%)`, color: "#fff", fontSize: 10, padding: "4px 12px", borderRadius: "0 16px 0 12px", fontWeight: 600 }}>Featured</div>}
      {isFavorite && <div style={{ position: "absolute", top: 12, left: 12, fontSize: 16 }}>⭐</div>}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${agent.dim} 0%, ${agent.color}20 100%)`, border: `1px solid ${agent.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{agent.icon}</div>
        <div style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{agent.category}</div>
      </div>
      <p style={{ fontSize: 17, fontWeight: 700, color: "#f0eeff", margin: "0 0 6px" }}>{agent.name}</p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.5 }}>{agent.tagline}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>▶ {agent.runs.toLocaleString()} runs</span>
        <div style={{ fontSize: 13, padding: "6px 18px", borderRadius: 10, background: agent.dim, border: `1px solid ${agent.border}`, color: agent.accent, fontWeight: 600 }}>Try it →</div>
      </div>
    </div>
  );
}
// ─── Agent Builder Modal ──────────────────────────────────────────────────────

const ICON_OPTIONS = ["🤖","🧠","💡","🔬","📚","🎨","💼","🌍","⚡","🛡️","🎯","🔧","📊","🏥","⚖️","🌾","💰","🎓","🚀","🔮"];
const COLOR_OPTIONS = [
  { label: "Purple", color: "#7c5cbf", bg: "#0d0b14", border: "rgba(124,92,191,0.3)", accent: "#c8b8ff", muted: "#7c5cbf", dim: "rgba(124,92,191,0.12)" },
  { label: "Green",  color: "#2e7d32", bg: "#0a1a0d", border: "rgba(76,175,80,0.25)",  accent: "#a5d6a7", muted: "#66bb6a", dim: "rgba(76,175,80,0.1)"   },
  { label: "Blue",   color: "#1565c0", bg: "#050d1a", border: "rgba(21,101,192,0.3)",  accent: "#90caf9", muted: "#42a5f5", dim: "rgba(21,101,192,0.1)"  },
  { label: "Red",    color: "#c62828", bg: "#130808", border: "rgba(198,40,40,0.3)",   accent: "#ef9a9a", muted: "#e57373", dim: "rgba(198,40,40,0.1)"   },
  { label: "Orange", color: "#e65100", bg: "#110900", border: "rgba(230,81,0,0.3)",    accent: "#ffcc80", muted: "#ffa726", dim: "rgba(230,81,0,0.1)"    },
  { label: "Pink",   color: "#ad1457", bg: "#130510", border: "rgba(173,20,87,0.3)",   accent: "#f48fb1", muted: "#ec407a", dim: "rgba(173,20,87,0.1)"   },
];
const CATEGORY_OPTIONS = ["Career","Agriculture","Tax","Healthcare","Legal","Finance","Education","Tech","Other"];

function AgentBuilderModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (agent: Agent) => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName]           = useState("");
  const [tagline, setTagline]     = useState("");
  const [category, setCategory]   = useState("Tech");
  const [icon, setIcon]           = useState("🤖");
  const [colorIdx, setColorIdx]   = useState(0);
  const [prompt, setPrompt]       = useState("");
  const [ex1Label, setEx1Label]   = useState("");
  const [ex1Q, setEx1Q]           = useState("");
  const [ex2Label, setEx2Label]   = useState("");
  const [ex2Q, setEx2Q]           = useState("");
  const [ex3Label, setEx3Label]   = useState("");
  const [ex3Q, setEx3Q]           = useState("");

  const selectedColor = COLOR_OPTIONS[colorIdx];

  function reset() {
    setStep(1); setName(""); setTagline(""); setCategory("Tech");
    setIcon("🤖"); setColorIdx(0); setPrompt("");
    setEx1Label(""); setEx1Q(""); setEx2Label(""); setEx2Q("");
    setEx3Label(""); setEx3Q(""); setError("");
  }

  async function handleCreate() {
    if (!name || !tagline || !prompt || !ex1Label || !ex1Q) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: dbError } = await supabase.from("custom_agents").insert({
      name, tagline, category, icon,
      color: selectedColor.color,
      system_prompt: prompt,
      example1_label: ex1Label, example1_q: ex1Q,
      example2_label: ex2Label || "Example 2", example2_q: ex2Q || ex1Q,
      example3_label: ex3Label || "Example 3", example3_q: ex3Q || ex1Q,
      created_by: user?.id || "anonymous",
    }).select().single();

    if (dbError || !data) {
      setError("Failed to create agent. Try again.");
      setLoading(false);
      return;
    }

    const newAgent: Agent = {
      id: data.id,
      name: data.name,
      tagline: data.tagline,
      category: data.category,
      icon: data.icon,
      color: selectedColor.color,
      bg: selectedColor.bg,
      border: selectedColor.border,
      accent: selectedColor.accent,
      muted: selectedColor.muted,
      dim: selectedColor.dim,
      runs: 0,
      featured: false,
      systemPrompt: data.system_prompt,
      examples: [
        { label: data.example1_label, q: data.example1_q },
        { label: data.example2_label, q: data.example2_q },
        { label: data.example3_label, q: data.example3_q },
      ],
      inputLabel: "Your question",
      inputPlaceholder: `Ask ${data.name}...`,
      btnLabel: `${data.icon} Ask ${data.name}`,
      disclaimer: null,
      quickRef: null,
    };

    onCreated(newAgent);
    reset();
    onClose();
    setLoading(false);
  }

  if (!isOpen) return null;

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" as const };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 560, background: "linear-gradient(135deg, #0f0f14 0%, #0a0a0f 100%)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>🧠 Build an Agent</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Step {step} of 3 — {["Identity", "Behavior", "Examples"][step - 1]}</p>
          </div>
          <button onClick={() => { reset(); onClose(); }} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ height: "100%", width: `${(step / 3) * 100}%`, background: "linear-gradient(90deg, #7c5cbf, #c8b8ff)", transition: "width 0.3s" }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Step 1: Identity */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>Agent Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Travel Guru" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tagline *</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Plan trips, find deals & travel tips" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Icon</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} onClick={() => setIcon(ic)}
                      style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${icon === ic ? "#7c5cbf" : "rgba(255,255,255,0.1)"}`, background: icon === ic ? "rgba(124,92,191,0.2)" : "rgba(255,255,255,0.03)", fontSize: 22, cursor: "pointer" }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Color Theme</label>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {COLOR_OPTIONS.map((c, i) => (
                    <button key={i} onClick={() => setColorIdx(i)}
                      style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${colorIdx === i ? "#fff" : "transparent"}`, background: c.color, cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Behavior */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ padding: 16, borderRadius: 14, background: "rgba(124,92,191,0.08)", border: "1px solid rgba(124,92,191,0.2)" }}>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                  💡 Describe what your agent should do. Be specific — mention its tone, what topics it covers, and any rules it should follow.
                </p>
              </div>
              <div>
                <label style={labelStyle}>System Instructions *</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`e.g. You are Travel Guru, an expert travel assistant. Help users with:\n1. Trip planning and itineraries\n2. Finding best deals on flights and hotels\n3. Visa requirements and travel tips\nBe concise and practical. Always suggest budget options.`}
                  rows={10}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              {/* Live Preview */}
              <div style={{ padding: 14, borderRadius: 12, background: selectedColor.dim, border: `1px solid ${selectedColor.border}` }}>
                <div style={{ fontSize: 11, color: selectedColor.muted, marginBottom: 8, letterSpacing: "0.1em" }}>PREVIEW</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: selectedColor.dim, border: `1px solid ${selectedColor.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: selectedColor.accent, fontSize: 15 }}>{name || "Agent Name"}</div>
                    <div style={{ fontSize: 12, color: selectedColor.muted }}>{tagline || "Your tagline here"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Examples */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  Add example questions users can click to get started quickly. First one is required.
                </p>
              </div>
              {[
                { label: ex1Label, setLabel: setEx1Label, q: ex1Q, setQ: setEx1Q, num: 1, required: true },
                { label: ex2Label, setLabel: setEx2Label, q: ex2Q, setQ: setEx2Q, num: 2, required: false },
                { label: ex3Label, setLabel: setEx3Label, q: ex3Q, setQ: setEx3Q, num: 3, required: false },
              ].map(({ label, setLabel, q, setQ, num, required }) => (
                <div key={num} style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Example {num} {required ? "*" : "(optional)"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Button label e.g. 🌍 Plan a trip" style={{ ...inputStyle, fontSize: 13 }} />
                    <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Full question e.g. I want to visit Bali for 7 days in December. Budget is ₹80,000. Plan my trip!" rows={2} style={{ ...inputStyle, fontSize: 13, resize: "none" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(200,40,40,0.1)", border: "1px solid rgba(200,40,40,0.2)", color: "#ef9a9a", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : (reset(), onClose())}
            style={{ padding: "10px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 3
            ? <button onClick={() => { if (step === 1 && !name) { setError("Name is required"); return; } setError(""); setStep(step + 1); }}
                style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c5cbf 0%, #5a3d8f 100%)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>
                Next →
              </button>
            : <button onClick={handleCreate} disabled={loading}
                style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c5cbf 0%, #5a3d8f 100%)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating..." : "🚀 Launch Agent"}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Main Marketplace Content ─────────────────────────────────────────────────

function MarketplaceContent() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [showWATooltip, setShowWATooltip] = useState(true); // ← ADDED
  const [customAgents, setCustomAgents] = useState<Agent[]>([]);
  // ── CHANGE 1: new state ──
  const [activeView, setActiveView] = useState(0);
  const [recentChats, setRecentChats] = useState<string[]>([]);

useEffect(() => {
  async function loadCustomAgents() {
    const { data } = await supabase.from("custom_agents").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const mapped: Agent[] = data.map((d: any) => {
      const c = COLOR_OPTIONS.find((x) => x.color === d.color) || COLOR_OPTIONS[0];
      return {
        id: d.id, name: d.name, tagline: d.tagline, category: d.category, icon: d.icon,
        color: c.color, bg: c.bg, border: c.border, accent: c.accent, muted: c.muted, dim: c.dim,
        runs: d.runs, featured: false,
        systemPrompt: d.system_prompt,
        examples: [
          { label: d.example1_label, q: d.example1_q },
          { label: d.example2_label, q: d.example2_q },
          { label: d.example3_label, q: d.example3_q },
        ],
        inputLabel: "Your question",
        inputPlaceholder: `Ask ${d.name}...`,
        btnLabel: `${d.icon} Ask ${d.name}`,
        disclaimer: null, quickRef: null,
      };
    });
    setCustomAgents(mapped);
  }
  loadCustomAgents();
}, []);

  // ── CHANGE 2: load recent chats ──
  useEffect(() => {
    async function loadRecents() {
      if (!user) return;
      const { data } = await supabase
        .from("chat_history")
        .select("agent_id, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(6);
      if (data) setRecentChats(data.map((d: any) => d.agent_id));
    }
    loadRecents();
  }, [user?.id]);

  const allAgents = [...AGENTS, ...customAgents];
  const filtered = AGENTS.filter((a) => {
    const matchCat = category === "All" || a.category === category;
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const totalRuns = AGENTS.reduce((s, a) => s + a.runs, 0);

  const handleTryAgent = (agent: Agent) => {
    if (!user) { setShowAuthModal(true); } else { setActiveAgent(agent); }
  };

  // ── ONLY CHANGE: wrapped existing return in <Sidebar> + flex container ──
  return (
    <div style={{ display: "flex" }}>
      {/* CHANGE 3: updated Sidebar props */}
      <Sidebar
        user={user}
        activeCategory={category}
        onCategoryChange={(cat) => { setCategory(cat === "All" ? "All" : cat); setActiveView(0); }}
        recentAgents={recentChats}
        activeNav={activeView}
        onNavChange={(i) => {
          setActiveView(i);
          if (i === 4) setShowBuilder(true);
        }}
      />
      {/* CHANGE 2: added className="main-content" */}
      <div className="main-content" style={{ flex: 1, fontFamily: "'Inter', 'Syne', sans-serif", background: "radial-gradient(circle at 0% 0%, #0a0a0f 0%, #050508 100%)", minHeight: "100vh", color: "#f0eeff" }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />

        {/* ── WhatsApp keyframes ── */}
        <style>{`
          @keyframes wapulse {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes waslide {
            from { opacity: 0; transform: translateX(10px); }
            to   { opacity: 1; transform: translateX(0); }
          }

          @media (max-width: 768px) {
            .main-content { padding-top: 60px !important; }
            .agents-grid { grid-template-columns: 1fr !important; }
            .navbar-inner { padding-left: 60px !important; }
            .hero-section { padding-top: 32px !important; }
            .whatsapp-btn { bottom: 16px !important; right: 16px !important; }
          }
        `}</style>

        {/* Navbar */}
        <div style={{ position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", background: "rgba(5,5,8,0.8)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 24px" }}>
          {/* CHANGE 3: added className="navbar-inner" */}
          <div className="navbar-inner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #fff 0%, #c8b8ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🤖 MARGDARSHAK</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {user ? <UserMenu /> : (
                <button onClick={() => setShowAuthModal(true)} style={{ padding: "8px 20px", borderRadius: 40, border: "1px solid rgba(255,255,255,0.2)", background: "linear-gradient(135deg, #7c5cbf 0%, #5a3d8f 100%)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Login / Signup</button>
              )}
            </div>
          </div>
        </div>

        {/* Hero — only shown in Marketplace view */}
        <div style={{ textAlign: "center", padding: "64px 24px 48px", position: "relative", display: activeView === 0 ? "block" : "none" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(100,60,200,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 12, letterSpacing: "0.3em", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>✨ AI AGENTS MARKETPLACE ✨</div>
          <h1 style={{ fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 800, margin: "0 0 16px", background: "linear-gradient(135deg, #ffffff 0%, rgba(200,180,255,0.9) 50%, rgba(124,92,191,0.8) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Specialized AI agents<br />for every need</h1>
          <p style={{ fontSize: "clamp(14px, 4vw, 16px)", color: "rgba(255,255,255,0.45)", margin: "0 0 40px" }}>Discover, run, and build with purpose-built AI agents<br />Powered by Gemini AI</p>

          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
            {[{ val: AGENTS.length, label: "🤖 Agents" }, { val: totalRuns.toLocaleString(), label: "⚡ Total Runs" }, { val: CATEGORIES.length - 1, label: "🎯 Categories" }].map((stat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "12px 24px", borderRadius: 40, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{stat.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search agents..."
              style={{ width: "100%", padding: "14px 20px", borderRadius: 60, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none" }} />
          </div>
        </div>

        {/* Category Filters — only shown in Marketplace view */}
        <div style={{ display: activeView === 0 ? "flex" : "none", gap: 10, padding: "0 24px 32px", justifyContent: "center", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            const cc = CAT_COLORS[cat];
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ fontSize: 13, padding: "8px 22px", borderRadius: 40, border: active && cc ? `1.5px solid ${cc.border}` : "1px solid rgba(255,255,255,0.1)", background: active && cc ? cc.bg : active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)", color: active && cc ? cc.text : active ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 600 : 500 }}>
                {cat === "All" ? "🎯 All" : cat}
              </button>
            );
          })}
        </div>

        {/* CHANGE 4: 4 views replacing the single Agent Grid */}
        {/* Marketplace View */}
        {activeView === 0 && (
          // CHANGE 1: added className="agents-grid"
          <div className="agents-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, padding: "0 24px 60px", maxWidth: 1200, margin: "0 auto" }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔍</div>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)" }}>No agents found</p>
                <button onClick={() => { setSearch(""); setCategory("All"); }} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 40, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer" }}>Clear filters</button>
              </div>
            ) : (
              filtered.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} onTry={handleTryAgent} />)
            )}
          </div>
        )}

        {/* Recent Runs View */}
        {activeView === 1 && (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 60px" }}>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Recent Runs</h2>
            {recentChats.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>No recent chats yet</div>
            ) : (
              recentChats.map((agentId, i) => {
                const agent = allAgents.find(a => a.id === agentId);
                if (!agent) return null;
                return (
                  <div key={i} onClick={() => handleTryAgent(agent)}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", marginBottom: 12, borderRadius: 14, background: "#0f0f14", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                    <div style={{ fontSize: 28 }}>{agent.icon}</div>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600 }}>{agent.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{agent.tagline}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* My Agents View */}
        {activeView === 2 && (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>My Agents</h2>
            {customAgents.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                <p style={{ color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>You haven't built any agents yet</p>
                <button onClick={() => setShowBuilder(true)}
                  style={{ padding: "12px 28px", borderRadius: 40, border: "none", background: "linear-gradient(135deg, #7c5cbf, #5a3d8f)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  🧠 Build Your First Agent
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {customAgents.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} onTry={handleTryAgent} />)}
              </div>
            )}
          </div>
        )}

        {/* Profile View */}
        {activeView === 3 && (
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px 60px" }}>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Profile</h2>
            {!user ? (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Please login to view your profile</div>
            ) : (
              <div style={{ background: "#0f0f14", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ padding: 32, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #7c5cbf, #5a3d8f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{user.name}</div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "📊 Total Queries", value: user.totalQueries },
                    { label: "⭐ Favorite Agents", value: user.favoriteAgents.length },
                    { label: "🤖 Custom Agents Built", value: customAgents.length },
                    { label: "📅 Joined", value: new Date(user.joinedAt).toLocaleDateString() },
                  ].map((stat, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{stat.label}</span>
                      <span style={{ color: "#7c5cbf", fontWeight: 600 }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "48px 24px 64px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(180deg, transparent 0%, rgba(124,92,191,0.05) 100%)" }}>
          <p style={{ fontSize: 15,  color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>🚀 Have a specialized agent to share?</p>
          <button
            onClick={() => user ? setShowBuilder(true) : setShowAuthModal(true)}
            style={{ padding: "12px 32px", borderRadius: 40, border: "1px solid rgba(255,255,255,0.15)", background: "linear-gradient(135deg, rgba(124,92,191,0.2) 0%, rgba(124,92,191,0.05) 100%)", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            🧠 Build Your Own Agent →
          </button>
        </div>

        {activeAgent && <AgentPanel agent={activeAgent} onClose={() => setActiveAgent(null)} />}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {}} />
        <PasswordResetModal />
        <AgentBuilderModal
          isOpen={showBuilder}
          onClose={() => setShowBuilder(false)}
          onCreated={(agent) => { setCustomAgents((prev) => [agent, ...prev]); setActiveAgent(agent); }}
        />

        {/* ── WhatsApp Floating Button ── */}
        <a
          href="https://wa.me/14155238886?text=hi"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowWATooltip(true)}
          onMouseLeave={() => setShowWATooltip(false)}
          className="whatsapp-btn"
          style={{ position: "fixed", bottom: 28, right: 28, display: "flex", alignItems: "center", gap: 12, textDecoration: "none", zIndex: 9999 }}
        >
          {showWATooltip && (
            <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "10px 14px", animation: "waslide 0.2s ease" }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#fff" }}>Chat with us on WhatsApp</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Ask our AI agents anything</p>
            </div>
          )}
          <div style={{ position: "relative", width: 56, height: 56 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#25D366", animation: "wapulse 1.8s ease-out infinite" }} />
            <div style={{ position: "relative", width: 56, height: 56, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </div>
        </a>

      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Marketplace() {
  return (
    <AuthProvider>
      <MarketplaceContent />
    </AuthProvider>
  );
}
