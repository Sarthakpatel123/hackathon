// HOW TO ADD "Zindagi" TO YOUR EXISTING NAV
// ============================================
// In your main layout/navbar component, add a link to /zindagi
// The icon is the "star" or "person" — we suggest a fingerprint or shield.

// Example — add to your existing nav items array:
// { href: "/zindagi", label: "Zindagi", icon: "🛡️" }

// Or add this NavItem component inline:

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ZindagiNavItem() {
  const pathname = usePathname();
  const active = pathname.startsWith("/zindagi");

  return (
    <Link href="/zindagi" style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 8, textDecoration: "none",
      background: active ? "#E1F5EE" : "transparent",
      color: active ? "#0F6E56" : "inherit",
      fontSize: 13, fontWeight: active ? 600 : 400,
      border: active ? "0.5px solid #9FE1CB" : "0.5px solid transparent",
      transition: "all 0.15s",
    }}>
      <span style={{ fontSize: 14 }}>🛡️</span>
      Zindagi
    </Link>
  );
}

// Or a Sidebar card widget (for the existing sidebar):
export function ZindagiBannerCard() {
  return (
    <Link href="/zindagi" style={{
      display: "block", textDecoration: "none",
      background: "linear-gradient(135deg, #E1F5EE 0%, #9FE1CB 100%)",
      border: "0.5px solid #5DCAA5", borderRadius: 10,
      padding: "12px 14px", marginBottom: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F6E56", marginBottom: 2 }}>
        🛡️ ZINDAGI DASHBOARD
      </div>
      <div style={{ fontSize: 11, color: "#085041" }}>
        Auto-match govt schemes to your profile
      </div>
      <div style={{
        marginTop: 8, fontSize: 11, fontWeight: 600, color: "#0F6E56",
        background: "#fff", display: "inline-block",
        padding: "3px 10px", borderRadius: 6,
      }}>
        Set up profile →
      </div>
    </Link>
  );
}
