"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  user?: { name: string; email: string } | null;
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
  recentAgents?: string[];
  activeNav?: number;
  onNavChange?: (index: number) => void;
}

const categories = [
  { emoji: "🎯", label: "All",         count: 6 },
  { emoji: "🎓", label: "Career",      count: 1 },
  { emoji: "🌾", label: "Agriculture", count: 1 },
  { emoji: "🧾", label: "Tax",         count: 1 },
  { emoji: "⚕️", label: "Healthcare",  count: 1 },
  { emoji: "⚖️", label: "Legal",       count: 1 },
  { emoji: "₹",  label: "Finance",     count: 1 },
];

const navItems = [
  { label: "Marketplace",  badge: null,  badgeType: null },
  { label: "Recent Runs",  badge: "16k", badgeType: "count" },
  { label: "My Agents",    badge: null,  badgeType: null },
  { label: "Profile",      badge: null,  badgeType: null },
  { label: "Submit Agent", badge: "Pro", badgeType: "upgrade" },
];

export default function Sidebar({ user, activeCategory = "All", onCategoryChange, recentAgents = [], activeNav = 0, onNavChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const avatarLetter = user?.name?.charAt(0).toUpperCase() || "?";
  const router = useRouter();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen(prev => !prev);

  return (
    <>
      <style>{`
        :root {
          --sb-bg: #1a1a18; --sb-bg2: #222220;
          --sb-border: rgba(255,255,255,0.07); --sb-border2: rgba(255,255,255,0.12);
          --sb-text: #e8e6df; --sb-muted: #888780;
          --sb-accent: #5DCAA5; --sb-accent2: #1D9E75; --sb-accent-bg: rgba(93,202,165,0.10);
        }

        .sb-hamburger {
          display: none;
          position: fixed;
          top: 14px;
          left: 14px;
          z-index: 200;
          width: 38px; height: 38px;
          background: #1a1a18;
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 9px;
          align-items: center; justify-content: center;
          cursor: pointer;
          color: #e8e6df;
        }

        .sb-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 140;
        }

        .sb {
          min-height: 100vh;
          background: var(--sb-bg);
          border-right: 0.5px solid var(--sb-border);
          display: flex; flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
          transition: width 0.2s ease;
          overflow: hidden;
          z-index: 50;
        }
        .sb.open  { width: 240px; }
        .sb.closed { width: 60px; }

        .sb-top { display:flex; align-items:center; justify-content:space-between; padding:18px 16px 14px; border-bottom:0.5px solid var(--sb-border); flex-shrink:0; }
        .sb.closed .sb-top { justify-content:center; padding:18px 0 14px; }
        .sb-brand { display:flex; align-items:center; gap:9px; text-decoration:none; overflow:hidden; }
        .sb-brand-icon { width:28px; height:28px; background:linear-gradient(135deg,#1D9E75,#5DCAA5); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sb-brand-name { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:var(--sb-text); letter-spacing:-0.2px; white-space:nowrap; }
        .sb.closed .sb-brand-name { display:none; }
        .sb-icon-btn { width:30px; height:30px; background:transparent; border:none; border-radius:7px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sb-muted); flex-shrink:0; }
        .sb-icon-btn:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb.closed .sb-icon-btn.toggle { display:none; }
        .sb-nav { padding:10px 10px 6px; display:flex; flex-direction:column; gap:1px; border-bottom:0.5px solid var(--sb-border); }
        .sb.closed .sb-nav { padding:10px 6px 6px; }
        .sb-nav-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:7px; cursor:pointer; font-size:13.5px; color:var(--sb-muted); transition:background .15s,color .15s; background:transparent; border:none; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .sb-nav-item:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb-nav-item.active { background:var(--sb-accent-bg); color:var(--sb-accent); }
        .sb.closed .sb-nav-item { justify-content:center; padding:8px 0; }
        .sb-nav-label { white-space:nowrap; }
        .sb.closed .sb-nav-label { display:none; }
        .sb-badge { margin-left:auto; font-size:10px; font-weight:500; padding:2px 7px; border-radius:20px; background:var(--sb-bg2); border:0.5px solid var(--sb-border2); color:var(--sb-muted); white-space:nowrap; }
        .sb-upgrade { margin-left:auto; font-size:10px; font-weight:600; padding:2px 8px; border-radius:20px; background:transparent; border:0.5px solid var(--sb-accent2); color:var(--sb-accent); font-family:'Syne',sans-serif; white-space:nowrap; }
        .sb.closed .sb-badge, .sb.closed .sb-upgrade { display:none; }
        .sb-section { padding:14px 10px 6px; border-bottom:0.5px solid var(--sb-border); }
        .sb.closed .sb-section { display:none; }
        .sb-label { font-size:10.5px; font-weight:600; letter-spacing:0.8px; text-transform:uppercase; color:var(--sb-muted); padding:0 10px 8px; font-family:'Syne',sans-serif; display:block; }
        .sb-cat-item { display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:7px; cursor:pointer; font-size:13px; color:var(--sb-muted); transition:background .15s,color .15s; background:transparent; border:none; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .sb-cat-item:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb-cat-item.active { color:var(--sb-accent); background:var(--sb-accent-bg); }
        .sb-cat-emoji { font-size:14px; width:18px; text-align:center; }
        .sb-cat-count { margin-left:auto; font-size:11px; color:var(--sb-muted); opacity:.7; }
        .sb-recents { padding:14px 10px 6px; flex:1; overflow-y:auto; }
        .sb.closed .sb-recents { display:none; }
        .sb-recents::-webkit-scrollbar { width:3px; }
        .sb-recents::-webkit-scrollbar-thumb { background:var(--sb-border2); border-radius:2px; }
        .sb-recent-item { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:7px; font-size:12.5px; color:var(--sb-muted); }
        .sb-dot { width:6px; height:6px; border-radius:50%; background:var(--sb-border2); flex-shrink:0; }
        .sb-recent-label { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-footer { border-top:0.5px solid var(--sb-border); padding:12px 10px; }
        .sb.closed .sb-footer { padding:12px 6px; }
        .sb-user-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:7px; cursor:pointer; transition:background .15s; }
        .sb-user-row:hover { background:var(--sb-bg2); }
        .sb.closed .sb-user-row { justify-content:center; padding:8px 0; }
        .sb-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#7F77DD,#5DCAA5); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; }
        .sb-user-info { flex:1; min-width:0; }
        .sb.closed .sb-user-info { display:none; }
        .sb-user-name { font-size:13px; color:var(--sb-text); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-user-plan { font-size:11px; color:var(--sb-muted); }
        .sb.closed .sb-chevron { display:none; }
        .sb-expand-btn { display:none; }
        .sb.closed .sb-expand-btn { display:flex; width:30px; height:30px; background:transparent; border:none; border-radius:7px; align-items:center; justify-content:center; cursor:pointer; color:var(--sb-muted); margin: 14px auto 10px; }
        .sb.closed .sb-expand-btn:hover { background:var(--sb-bg2); color:var(--sb-text); }

        .sb-zindagi {
          margin: 10px 10px 0;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 8px;
          background: rgba(93,202,165,0.08);
          border: 0.5px solid rgba(93,202,165,0.20);
          cursor: pointer;
          font-size: 13px;
          color: var(--sb-accent);
          font-family: 'DM Sans', sans-serif;
          width: calc(100% - 20px);
          text-align: left;
          transition: background .15s;
        }
        .sb-zindagi:hover { background: rgba(93,202,165,0.15); }
        .sb.closed .sb-zindagi { justify-content:center; width: calc(100% - 12px); margin: 10px 6px 0; padding: 9px 0; }
        .sb-zindagi-label { white-space: nowrap; font-weight: 500; }
        .sb.closed .sb-zindagi-label { display: none; }
        .sb-zindagi-badge { margin-left: auto; font-size: 10px; padding: 1px 6px; border-radius: 10px; background: rgba(93,202,165,0.15); color: var(--sb-accent); border: 0.5px solid rgba(93,202,165,0.3); white-space: nowrap; }
        .sb.closed .sb-zindagi-badge { display: none; }

        @media (max-width: 768px) {
          .sb-hamburger { display: flex; }
          .sb-backdrop.open { display: block; }
          .sb {
            position: fixed;
            top: 0; left: 0;
            height: 100vh;
            width: 240px !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 150;
          }
          .sb.mobile-open { transform: translateX(0); }
          .sb-icon-btn.toggle { display: none !important; }
          .sb-expand-btn { display: none !important; }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <button className="sb-hamburger" onClick={toggleMobile} aria-label="Toggle menu">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="17" y2="6"/>
          <line x1="3" y1="10" x2="17" y2="10"/>
          <line x1="3" y1="14" x2="17" y2="14"/>
        </svg>
      </button>

      <div className={`sb-backdrop ${mobileOpen ? "open" : ""}`} onClick={closeMobile} />

      <aside className={`sb ${collapsed ? "closed" : "open"} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sb-top">
          {!collapsed && (
            <a className="sb-brand" href="/">
              <div className="sb-brand-icon">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="3" fill="white"/>
                  <path d="M10 3V5M10 15V17M3 10H5M15 10H17M5.05 5.05L6.46 6.46M13.54 13.54L14.95 14.95M5.05 14.95L6.46 13.54M13.54 6.46L14.95 5.05" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="sb-brand-name">MARGDARSHAK</span>
            </a>
          )}
          {!collapsed && (
            <button className="sb-icon-btn toggle" onClick={() => setCollapsed(true)}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="14" height="14" rx="2"/><line x1="7" y1="3" x2="7" y2="17"/>
              </svg>
            </button>
          )}
        </div>

        {collapsed && (
          <button className="sb-expand-btn" onClick={() => setCollapsed(false)}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="14" height="14" rx="2"/><line x1="7" y1="3" x2="7" y2="17"/>
            </svg>
          </button>
        )}

        {/* Nav */}
        <nav className="sb-nav">
          {navItems.map((item, i) => (
            <button
              key={i}
              className={`sb-nav-item${activeNav === i ? " active" : ""}`}
              onClick={() => { onNavChange?.(i); closeMobile(); }}
              title={collapsed ? item.label : undefined}
            >
              <NavIcon index={i} />
              <span className="sb-nav-label">{item.label}</span>
              {!collapsed && item.badgeType === "count"   && <span className="sb-badge">{item.badge}</span>}
              {!collapsed && item.badgeType === "upgrade" && <span className="sb-upgrade">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Zindagi Dashboard button — added here, nothing else changed */}
        <button
          className="sb-zindagi"
          onClick={() => { router.push("/zindagi"); closeMobile(); }}
          title={collapsed ? "Zindagi Dashboard" : undefined}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2L3 7v11h5v-5h4v5h5V7z"/>
            <circle cx="10" cy="11" r="2" fill="currentColor" stroke="none"/>
          </svg>
          <span className="sb-zindagi-label">Zindagi Dashboard</span>
          <span className="sb-zindagi-badge">New</span>
        </button>

        {/* Categories */}
        <div className="sb-section">
          <span className="sb-label">Categories</span>
          {categories.map((cat, i) => (
            <button key={i}
              className={`sb-cat-item${activeCategory === cat.label ? " active" : ""}`}
              onClick={() => { onCategoryChange?.(cat.label); closeMobile(); }}>
              <span className="sb-cat-emoji">{cat.emoji}</span>
              {cat.label}
              <span className="sb-cat-count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Recents */}
        <div className="sb-recents">
          <span className="sb-label">Recents</span>
          {recentAgents.length === 0 ? (
            <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--sb-muted)" }}>No recent chats yet</div>
          ) : (
            recentAgents.map((r, i) => (
              <div key={i} className="sb-recent-item">
                <div className="sb-dot" />
                <span className="sb-recent-label">{r}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-user-row" title={collapsed ? (user?.name || "Guest") : undefined}>
            <div className="sb-avatar">{avatarLetter}</div>
            {!collapsed && (
              <>
                <div className="sb-user-info">
                  <div className="sb-user-name">{user?.name || "Guest"}</div>
                  <div className="sb-user-plan">Free plan</div>
                </div>
                <svg className="sb-chevron" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--sb-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 6l4 4-4 4"/>
                </svg>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavIcon({ index }: { index: number }) {
  const icons = [
    <path key={0} d="M10 3L3 8v9h5v-4h4v4h5V8z" />,
    <><circle key="c" cx="10" cy="10" r="7"/><path key="p" d="M10 7v3l2 2"/></>,
    <><rect key="a" x="3" y="3" width="6" height="6" rx="1.5"/><rect key="b" x="11" y="3" width="6" height="6" rx="1.5"/><rect key="c" x="3" y="11" width="6" height="6" rx="1.5"/><rect key="d" x="11" y="11" width="6" height="6" rx="1.5"/></>,
    <><circle key="c" cx="10" cy="8" r="3"/><path key="p" d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5"/></>,
    <><circle key="c" cx="10" cy="10" r="3"/><path key="p" d="M10 3v2M10 15v2M3 10h2M15 10h2"/></>,
  ];
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[index]}
    </svg>
  );
}
