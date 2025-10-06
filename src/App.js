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
const pickColor = (i) => {
  const palette = [
    "#8B5CF6",
    "#34D399",
    "#F59E0B",
    "#FB7185",
    "#7C3AED",
    "#60A5FA",
  ];
  return palette[i % palette.length];
};

const IconSun = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
          className="es-input"
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="es-input"
          type="text"
          placeholder="Category (e.g. Food)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <input
        className="es-input"
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="es-row">
        <input
          className="es-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="btn-primary" type="submit">
          Add
        </button>
      </div>
    </form>
  );
}

export default function app() {
  const THEMES = {
    clean: {
      name: "Clean",
      bg: "linear-gradient(180deg,#f8fafc,#eef2ff)",
      text: "#0f172a",
      card: "rgba(255,255,255,0.6)",
    },
    dark: {
      name: "Dark",
      bg: "linear-gradient(180deg,#0f1724,#071124)",
      text: "#7C8AA2",
      card: "rgba(10,10,10,0.6)",
    },
    aesthetic: {
      name: "Aesthetic",
      bg: "linear-gradient(135deg,#fdf4ff 0%, #e6f4ff 60%)",
      text: "#4a148c",
      card: "rgba(255,255,255,0.55)",
    },
  };

  const [theme, setTheme] = useState("aesthetic");
  const cfg = THEMES[theme];

  const [expenses, setExpenses] = useState(loadFromStorage("ss-expenses", []));
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => saveToStorage("ss-expenses", expenses), [expenses]);

  const addExpense = (obj) => {
    const e = { id: uid(), ...obj };
    setExpenses((s) => [e, ...s]);
  };
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

  return (
    <div
      className="app-root"
      style={{ background: cfg.bg, color: cfg.text, minHeight: "100vh" }}
    >
      <style>{`
        /* Embedded styles for single-file usage */
        :root{font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial}
        .app-root{padding:28px}
        .topbar{display:flex;justify-content:space-between;align-items:center;gap:12px}
        .brand{font-weight:700;font-size:20px;display:flex;align-items:center;gap:10px}
        .theme-buttons{display:flex;gap:8px}
        .theme-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);backdrop-filter: blur(6px);cursor:pointer}
        .theme-btn:hover{transform:translateY(-3px);transition:all .18s}
        .layout{display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-top:22px}
        .card{padding:18px;border-radius:14px;box-shadow:0 10px 30px rgba(15,15,25,0.08);backdrop-filter: blur(8px)}
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

      <div className="topbar">
        <div className="brand">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg,#ffffff55,#ffffff22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15 8l6 1-4.5 4 1 6L12 17l-6.5 2 1-6L2 9l6-1 3-6z"
                fill="#fff"
                opacity="0.9"
              />
            </svg>
          </div>
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
            title="Clean"
            style={{ color: cfg.text }}
          >
            <IconSun /> Clean
          </button>
          <button
            className="theme-btn"
            onClick={() => setTheme("dark")}
            title="Dark"
            style={{ color: cfg.text }}
          >
            <IconMoon /> Dark
          </button>
          <button
            className="theme-btn"
            onClick={() => setTheme("aesthetic")}
            title="Aesthetic"
            style={{ color: cfg.text }}
          >
            <IconSparkle /> Aesthetic
          </button>
        </div>
      </div>

      <div className="layout">
        <section className="card" style={{ background: cfg.card }}>
          <h3 style={{ margin: 0 }}>Add Expense</h3>
          <div style={{ height: 8 }} />
          <ExpenseForm onAdd={addExpense} />

          <div style={{ height: 8 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label className="muted">Filter Day</label>
            <input
              className="es-input"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <label className="muted">Filter Month</label>
            <input
              className="es-input"
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
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

          <div style={{ height: 12 }} />
          <div className="muted">
            Monthly total: <strong>₹{totals.monthly}</strong>
          </div>
        </section>

        <section className="card" style={{ background: cfg.card }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>Spending Overview</h3>
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
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
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
                    {totals.byCategory.map((entry, index) => (
                      <Cell key={entry.name + index} fill={pickColor(index)} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ height: 12 }} />
          <h4 style={{ margin: "8px 0" }}>Recent Entries</h4>
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
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-ghost"
                  onClick={() => removeExpense(e.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div style={{ height: 28 }} />
      <div style={{ textAlign: "center" }} className="muted">
        SpendSmart • Personal project by Vijay
      </div>
    </div>
  );
}
//export default App;
