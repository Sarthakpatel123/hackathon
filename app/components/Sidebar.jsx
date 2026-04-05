"use client";
import { useState } from "react";

const categories = [
  { emoji: "🎯", label: "All Agents", count: 6 },
  { emoji: "🎓", label: "Career",     count: 1 },
  { emoji: "🌾", label: "Agriculture",count: 1 },
  { emoji: "🧾", label: "Tax",        count: 1 },
  { emoji: "⚕️", label: "Healthcare", count: 1 },
  { emoji: "⚖️", label: "Legal",      count: 1 },
  { emoji: "₹",  label: "Finance",    count: 1 },
];

const navItems = [
  { label: "Marketplace",   badge: null,   badgeType: null },
  { label: "Recent Runs",   badge: "16k",  badgeType: "count" },
  { label: "My Agents",     badge: null,   badgeType: null },
  { label: "Profile",       badge: null,   badgeType: null },
  { label: "Submit Agent",  badge: "Pro",  badgeType: "upgrade" },
];

const recents = [
  { label: "Career Mitra — resume tips",        active: true },
  { label: "Krishi Mitra — kharif crop advice", active: false },
  { label: "Health Guide — fever symptoms",     active: false },
  { label: "Artha Advisor — SIP vs FD",         active: false },
  { label: "GST Saathi — ITC claim process",    active: false },
  { label: "Kanoon Mitra — tenant rights",       active: false },
];

export default function Sidebar() {
  const [activeNav, setActiveNav]   = useState(0);
  const [activeCat, setActiveCat]   = useState(0);

  return (
    <>
      <style>{`
        :root {
          --sb-bg:         #1a1a18;
          --sb-bg2:        #222220;
          --sb-border:     rgba(255,255,255,0.07);
          --sb-border2:    rgba(255,255,255,0.12);
          --sb-text:       #e8e6df;
          --sb-muted:      #888780;
          --sb-accent:     #5DCAA5;
          --sb-accent2:    #1D9E75;
          --sb-accent-bg:  rgba(93,202,165,0.10);
        }
        .sb { width:260px; min-height:100vh; background:var(--sb-bg); border-right:0.5px solid var(--sb-border); display:flex; flex-direction:column; font-family:'DM Sans',sans-serif; }
        .sb-top { display:flex; align-items:center; justify-content:space-between; padding:18px 16px 14px; border-bottom:0.5px solid var(--sb-border); }
        .sb-brand { display:flex; align-items:center; gap:9px; text-decoration:none; }
        .sb-brand-icon { width:28px; height:28px; background:linear-gradient(135deg,#1D9E75,#5DCAA5); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sb-brand-name { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:var(--sb-text); letter-spacing:-0.2px; }
        .sb-icon-btn { width:30px; height:30px; background:transparent; border:none; border-radius:7px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sb-muted); transition:background .15s,color .15s; }
        .sb-icon-btn:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb-nav { padding:10px 10px 6px; display:flex; flex-direction:column; gap:1px; border-bottom:0.5px solid var(--sb-border); }
        .sb-nav-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:7px; cursor:pointer; font-size:13.5px; color:var(--sb-muted); transition:background .15s,color .15s; background:transparent; border:none; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .sb-nav-item:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb-nav-item.active { background:var(--sb-accent-bg); color:var(--sb-accent); }
        .sb-badge { margin-left:auto; font-size:10px; font-weight:500; padding:2px 7px; border-radius:20px; background:var(--sb-bg2); border:0.5px solid var(--sb-border2); color:var(--sb-muted); }
        .sb-upgrade { margin-left:auto; font-size:10px; font-weight:600; padding:2px 8px; border-radius:20px; background:transparent; border:0.5px solid var(--sb-accent2); color:var(--sb-accent); font-family:'Syne',sans-serif; letter-spacing:0.3px; }
        .sb-section { padding:14px 10px 6px; border-bottom:0.5px solid var(--sb-border); }
        .sb-label { font-size:10.5px; font-weight:600; letter-spacing:0.8px; text-transform:uppercase; color:var(--sb-muted); padding:0 10px 8px; font-family:'Syne',sans-serif; display:block; }
        .sb-cat-item { display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:7px; cursor:pointer; font-size:13px; color:var(--sb-muted); transition:background .15s,color .15s; background:transparent; border:none; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .sb-cat-item:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb-cat-item.active { color:var(--sb-accent); background:var(--sb-accent-bg); }
        .sb-cat-emoji { font-size:14px; width:18px; text-align:center; }
        .sb-cat-count { margin-left:auto; font-size:11px; color:var(--sb-muted); opacity:.7; }
        .sb-recents { padding:14px 10px 6px; flex:1; overflow-y:auto; }
        .sb-recents::-webkit-scrollbar { width:3px; }
        .sb-recents::-webkit-scrollbar-thumb { background:var(--sb-border2); border-radius:2px; }
        .sb-recent-item { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:7px; cursor:pointer; font-size:12.5px; color:var(--sb-muted); transition:background .15s,color .15s; position:relative; }
        .sb-recent-item:hover { background:var(--sb-bg2); color:var(--sb-text); }
        .sb-recent-item:hover .sb-recent-more { opacity:1; }
        .sb-dot { width:6px; height:6px; border-radius:50%; background:var(--sb-border2); flex-shrink:0; }
        .sb-dot.green { background:var(--sb-accent2); }
        .sb-recent-label { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-recent-more { opacity:0; transition:opacity .15s; color:var(--sb-muted); background:transparent; border:none; cursor:pointer; font-size:14px; padding:2px 4px; border-radius:4px; }
        .sb-footer { border-top:0.5px solid var(--sb-border); padding:12px 10px; }
        .sb-user-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:7px; cursor:pointer; transition:background .15s; }
        .sb-user-row:hover { background:var(--sb-bg2); }
        .sb-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#7F77DD,#5DCAA5); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; font-family:'Syne',sans-serif; }
        .sb-user-info { flex:1; min-width:0; }
        .sb-user-name { font-size:13px; color:var(--sb-text); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-user-plan { font-size:11px; color:var(--sb-muted); }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <aside className="sb">

        {/* Top bar */}
        <div className="sb-top">
          <a className="sb-brand" href="/">
            <div className="sb-brand-icon">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" fill="white"/>
                <path d="M10 3V5M10 15V17M3 10H5M15 10H17M5.05 5.05L6.46 6.46M13.54 13.54L14.95 14.95M5.05 14.95L6.46 13.54M13.54 6.46L14.95 5.05" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="sb-brand-name">AI Agents</span>
          </a>
          <button className="sb-icon-btn" title="Collapse">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="14" height="14" rx="2"/>
              <line x1="7" y1="3" x2="7" y2="17"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {navItems.map((item, i) => (
            <button
              key={i}
              className={`sb-nav-item${activeNav === i ? " active" : ""}`}
              onClick={() => setActiveNav(i)}
            >
              <NavIcon index={i} />
              {item.label}
              {item.badgeType === "count"   && <span className="sb-badge">{item.badge}</span>}
              {item.badgeType === "upgrade" && <span className="sb-upgrade">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Categories */}
        <div className="sb-section">
          <span className="sb-label">Categories</span>
          {categories.map((cat, i) => (
            <button
              key={i}
              className={`sb-cat-item${activeCat === i ? " active" : ""}`}
              onClick={() => setActiveCat(i)}
            >
              <span className="sb-cat-emoji">{cat.emoji}</span>
              {cat.label}
              <span className="sb-cat-count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Recents */}
        <div className="sb-recents">
          <span className="sb-label">Recents</span>
          {recents.map((r, i) => (
            <div key={i} className="sb-recent-item">
              <div className={`sb-dot${r.active ? " green" : ""}`} />
              <span className="sb-recent-label">{r.label}</span>
              <button className="sb-recent-more">···</button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-user-row">
            <div className="sb-avatar">YO</div>
            <div className="sb-user-info">
              <div className="sb-user-name">Your Name</div>
              <div className="sb-user-plan">Free plan</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--sb-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 6l4 4-4 4"/>
            </svg>
          </div>
        </div>

      </aside>
    </>
  );
}

// Simple inline SVG icons per nav index
function NavIcon({ index }) {
  const icons = [
    <path key={0} d="M10 3L3 8v9h5v-4h4v4h5V8z" />,
    <><circle key="c" cx="10" cy="10" r="7"/><path key="p" d="M10 7v3l2 2"/></>,
    <><rect key="a" x="3" y="3" width="6" height="6" rx="1.5"/><rect key="b" x="11" y="3" width="6" height="6" rx="1.5"/><rect key="c" x="3" y="11" width="6" height="6" rx="1.5"/><rect key="d" x="11" y="11" width="6" height="6" rx="1.5"/></>,
    <><circle key="c" cx="10" cy="8" r="3"/><path key="p" d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5"/></>,
    <><circle key="c" cx="10" cy="10" r="3"/><path key="p" d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41"/></>,
  ];
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[index]}
    </svg>
  );
}
