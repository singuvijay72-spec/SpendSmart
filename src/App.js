import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import SpendSmartClean from "./SpendSmartClean.png";
import SpendSmartDark from "./SpendsmartDark.png";
import SpendSmartAesthetic from "./SpendSmartAesthetic.png";

const uid = () => Math.random().toString(36).slice(2, 9);
const loadFromStorage = (k, f) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : f;
  } catch {
    return f;
  }
};
const saveToStorage = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const sameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();
const formatDateISO = (d = new Date()) =>
  new Date(d).toISOString().slice(0, 10);
const aggregateForBarChart = (items) => {
  const map = {};
  items.forEach((it) => {
    const d = new Date(it.date).toLocaleDateString();
    map[d] = (map[d] || 0) + it.amount;
  });
  return Object.keys(map).map((k) => ({ label: k, value: map[k] }));
};
const pickColor = (i) =>
  ["#8B5CF6", "#34D399", "#F59E0B", "#FB7185", "#7C3AED", "#60A5FA"][i % 6];

const IconSun = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 7a5 5 0 100 10 5 5 0 000-10z"
    />
  </svg>
);
const IconMoon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
    />
  </svg>
);
const IconSparkle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l1.5 3L17 8l-3.5 2L12 13l-1.5-3L7 8l3.5-2L12 3zM5 21l1.5-3L10 16l-3.5-2L5 11 3.5 13 0 16l3.5 2L5 21z"
    />
  </svg>
);

function ExpenseForm({ onAdd }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(formatDateISO());

  const submit = (e) => {
    e.preventDefault();
    if (!amount || !category) return;
    onAdd({
      id: uid(),
      amount: Number(amount),
      category: category.trim() || "Other",
      note: note.trim(),
      date,
    });
    setAmount("");
    setCategory("");
    setNote("");
    setDate(formatDateISO());
  };

  return (
    <form onSubmit={submit} className="es-form">
      <div className="es-row">
        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="es-input"
        />
        <input
          type="text"
          placeholder="Category (e.g. Food)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="es-input"
        />
      </div>
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="es-input"
      />
      <div className="es-row">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="es-input"
        />
        <button type="submit" className="btn-primary">
          Add
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [showTransition, setShowTransition] = useState(true);
  const [fadeInDashboard, setFadeInDashboard] = useState(false);
  const [theme, setTheme] = useState("aesthetic");
  const [expenses, setExpenses] = useState(loadFromStorage("ss-expenses", []));
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const THEMES = {
    clean: {
      bg: "linear-gradient(180deg,#f8fafc,#eef2ff)",
      text: "#0f172a",
      card: "rgba(255,255,255,0.6)",
    },
    dark: {
      bg: "linear-gradient(180deg,#0f1724,#071124)",
      text: "#7C8AA2",
      card: "rgba(10,10,10,0.6)",
    },
    aesthetic: {
      bg: "linear-gradient(135deg,#fdf4ff 0%, #e6f4ff 60%)",
      text: "#4a148c",
      card: "rgba(255,255,255,0.55)",
    },
  };
  const cfg = THEMES[theme];

  useEffect(() => saveToStorage("ss-expenses", expenses), [expenses]);

  const addExpense = (obj) => setExpenses((s) => [obj, ...s]);
  const removeExpense = (id) =>
    setExpenses((s) => s.filter((x) => x.id !== id));

  const filtered = useMemo(() => {
    let arr = expenses;
    if (filterDate) arr = arr.filter((e) => sameDay(e.date, filterDate));
    if (filterMonth) {
      const [y, m] = filterMonth.split("-");
      arr = arr.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === Number(y) && d.getMonth() + 1 === Number(m);
      });
    }
    return arr;
  }, [expenses, filterDate, filterMonth]);

  const totals = useMemo(() => {
    const byCategory = {};
    let monthly = 0;
    filtered.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      monthly += e.amount;
    });
    return {
      byCategory: Object.keys(byCategory).map((k) => ({
        name: k,
        value: byCategory[k],
      })),
      monthly,
    };
  }, [filtered]);

  const logoSrc =
    theme === "clean"
      ? SpendSmartClean
      : theme === "dark"
      ? SpendSmartDark
      : SpendSmartAesthetic;

  const handleLogoClick = () => {
    document.querySelector(".transition-overlay").classList.add("fade-out");
    setTimeout(() => {
      setShowTransition(false);
      setFadeInDashboard(true);
    }, 1000);
  };

  return (
    <>
      <style>{`
        .transition-overlay {position:fixed;inset:0;background:linear-gradient(180deg,#0f1724,#071124);display:flex;justify-content:center;align-items:center;z-index:9999;transition:opacity 1s ease;}
        .transition-logo {width:180px;cursor:pointer;transition:transform .4s ease;}
        .transition-logo:hover {transform:scale(1.1);}
        .fade-out {opacity:0;pointer-events:none;}
        :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial}
        .app-root{padding:28px;opacity:0;transition:opacity 1s ease;}
        .fade-in{opacity:1;}
        .topbar{display:flex;justify-content:space-between;align-items:center;gap:12px}
        .brand{font-weight:700;font-size:20px;display:flex;align-items:center;gap:10px}
        .theme-buttons{display:flex;gap:8px}
        .theme-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);backdrop-filter: blur(6px);cursor:pointer}
        .theme-btn:hover{transform:translateY(-3px);transition:all .18s}
        .layout{display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-top:22px}
        .card{padding:18px;border-radius:14px;box-shadow:0 10px 30px rgba(15,15,25,0.08);backdrop-filter: blur(8px);opacity:0;transform:scale(0.95);transition:opacity 0.6s ease, transform 0.6s ease;}
        .fade-in .card{opacity:1;transform:scale(1);}
        .es-form{display:flex;flex-direction:column;gap:10px}
        .es-row{display:flex;gap:10px}
        .es-input{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(0,0,0,0.06);outline:none}
        .btn-primary{background:linear-gradient(90deg,#8b5cf6,#06b6d4);color:white;padding:10px 14px;border-radius:10px;border:none;cursor:pointer}
        .btn-ghost{background:transparent;border:1px solid rgba(255,255,255,0.12);padding:8px 10px;border-radius:9px}
        .charts-wrap{display:flex;gap:12px}
        .expense-entry{display:flex;justify-content:space-between;align-items:center;padding:10px;border-radius:10px}
        .muted{opacity:0.75;font-size:13px}
        @media(max-width:900px){.layout{grid-template-columns:1fr;}.charts-wrap{flex-direction:column}}
      `}</style>

      {showTransition && (
        <div className="transition-overlay" onClick={handleLogoClick}>
          <img src={logoSrc} alt="Logo" className="transition-logo" />
        </div>
      )}

      {!showTransition && (
        <div
          className={`app-root ${fadeInDashboard ? "fade-in" : ""}`}
          style={{ background: cfg.bg, color: cfg.text, minHeight: "100vh" }}
        >
          <div className="topbar">
            <div className="brand">
              <img
                src={logoSrc}
                alt="logo"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  objectFit: "cover",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                }}
              />
              <div>
                SpendSmart{" "}
                <span
                  className="muted"
                  style={{ fontWeight: 500, marginLeft: 8, fontSize: 12 }}
                >
                  — your pocketmoney wingman
                </span>
              </div>
            </div>
            <div className="theme-buttons">
              <button
                className="theme-btn"
                onClick={() => setTheme("clean")}
                style={{ color: cfg.text }}
              >
                <IconSun /> Clean
              </button>
              <button
                className="theme-btn"
                onClick={() => setTheme("dark")}
                style={{ color: cfg.text }}
              >
                <IconMoon /> Dark
              </button>
              <button
                className="theme-btn"
                onClick={() => setTheme("aesthetic")}
                style={{ color: cfg.text }}
              >
                <IconSparkle /> Aesthetic
              </button>
            </div>
          </div>

          <div className="layout">
            <div className="card" style={{ transitionDelay: "0.2s" }}>
              <h3>Add Expense</h3>
              <ExpenseForm onAdd={addExpense} />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <label className="muted">Filter Day</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="es-input"
                />
                <label className="muted">Filter Month</label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="es-input"
                />
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setFilterDate("");
                    setFilterMonth("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{ marginTop: 12 }} className="muted">
                Monthly total: <strong>₹{totals.monthly}</strong>
              </div>
            </div>

            <div className="card" style={{ transitionDelay: "0.4s" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3>Spending Overview</h3>
                <div className="muted">
                  Showing: {filterDate || filterMonth || "All"}
                </div>
              </div>
              <div style={{ height: 12 }} />
              <div className="charts-wrap">
                <div style={{ flex: 1, height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={aggregateForBarChart(filtered)}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={totals.byCategory}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        innerRadius={30}
                      >
                        {totals.byCategory.map((entry, i) => (
                          <Cell key={entry.name + i} fill={pickColor(i)} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <h4 style={{ marginTop: 12 }}>Recent Entries</h4>
              {filtered.length === 0 && (
                <div className="muted">No entries yet.</div>
              )}
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="expense-entry"
                  style={{
                    background:
                      theme === "dark" ? "#0f1720" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {e.category} <span className="muted">• ₹{e.amount}</span>
                    </div>
                    <div className="muted" style={{ marginTop: 6 }}>
                      {e.note || <em>No note</em>} • {e.date}
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => removeExpense(e.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28, textAlign: "center" }} className="muted">
            SpendSmart • Personal project by Vijay
          </div>
        </div>
      )}
    </>
  );
}
