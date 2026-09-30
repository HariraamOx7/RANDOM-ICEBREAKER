import { useState, useRef, useCallback, useEffect } from "react";

const COLORS = ["#F7EFD8", "#E85C4A", "#2F7E7A", "#E8A93B"]; // cream, coral, teal, marigold
const CONFETTI_COLORS = ["#E85C4A", "#E8A93B", "#2F7E7A", "#F7EFD8"];
const C = 200; // wheel center
const R = 190; // wheel radius
const INK = "#1B2A2E";
const CREAM = "#F7EFD8";

const truncate = (s, max) => (s.length > max ? s.slice(0, max - 1) + "…" : s);
const textColorFor = (bg) => (bg === CREAM || bg === "#E8A93B" ? INK : CREAM);

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function wedgePath(cx, cy, r, start, end) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

/* ---------- Wheel ---------- */
function Wheel({ names, rotation, onTransitionEnd }) {
  const n = names.length;
  const slice = 360 / n;

  return (
    <svg id="wheelSvg" className="wheel" viewBox="0 0 400 400">
      <g
        id="wheelGroup"
        style={{ transform: `rotate(${rotation}deg)` }}
        onTransitionEnd={onTransitionEnd}
      >
        {n === 0 && (
          <text x={C} y={C} textAnchor="middle" className="wheel-empty-msg">
            Add names to build the wheel
          </text>
        )}

        {n === 1 && (
          <>
            <circle cx={C} cy={C} r={R} fill={COLORS[0]} stroke={INK} strokeWidth="2.5" />
            <text
              x={C}
              y={C}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textColorFor(COLORS[0])}
              fontFamily="'Baloo 2', sans-serif"
              fontWeight="700"
              fontSize="22"
            >
              {truncate(names[0], 16)}
            </text>
          </>
        )}

        {n > 1 &&
          names.map((name, i) => {
            const start = i * slice;
            const mid = start + slice / 2;
            const color = COLORS[i % COLORS.length];
            const pos = polar(C, C, R * 0.62, mid);
            // Flip text on the lower half so it stays upright
            const rot = mid > 90 && mid < 270 ? mid + 180 : mid;
            return (
              <g key={`${name}-${i}`}>
                <path
                  d={wedgePath(C, C, R, start, start + slice)}
                  fill={color}
                  stroke={INK}
                  strokeWidth="2.5"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${rot} ${pos.x} ${pos.y})`}
                  fill={textColorFor(color)}
                  fontFamily="'Baloo 2', sans-serif"
                  fontWeight="700"
                  fontSize={n > 10 ? 13 : 17}
                >
                  {truncate(name, 16)}
                </text>
              </g>
            );
          })}
      </g>
    </svg>
  );
}

/* ---------- Confetti ---------- */
function Confetti({ pieces }) {
  return (
    <div className="confetti-layer">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--drift": `${p.drift}px`,
            "--spin": `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [names, setNames] = useState(["Ava", "Noah", "Priya", "Mateo", "Zoe", "Leon"]);
  const [input, setInput] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [removeWinner, setRemoveWinner] = useState(false);
  const [winner, setWinner] = useState(null);
  const [afterSpin, setAfterSpin] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const winnerIndexRef = useRef(null);
  const confettiTimer = useRef(null);
  const confettiId = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => () => clearTimeout(confettiTimer.current), []);

  const launchConfetti = useCallback(() => {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: confettiId.current++,
      left: Math.random() * window.innerWidth,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      drift: (Math.random() - 0.5) * 200,
      spin: 360 + Math.random() * 720,
      duration: 2.2 + Math.random() * 1.4,
      delay: Math.random() * 0.3,
      round: Math.random() > 0.5,
    }));
    setConfetti(pieces);
    clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfetti([]), 4200);
  }, []);

  const addName = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    setNames((prev) => [...prev, value]);
    setInput("");
    inputRef.current?.focus();
  };

  const removeName = (i) => setNames((prev) => prev.filter((_, idx) => idx !== i));

  const shuffle = () =>
    setNames((prev) => {
      const a = [...prev];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });

  const clearAll = () => {
    if (names.length === 0) return;
    setNames([]);
    setWinner(null);
  };

  const spin = () => {
    if (spinning || names.length < 2) return;
    const n = names.length;
    const slice = 360 / n;
    const idx = Math.floor(Math.random() * n);
    const winnerMid = idx * slice + slice / 2;
    const jitter = (Math.random() - 0.5) * slice * 0.6;
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5–7 full turns

    winnerIndexRef.current = idx;
    setSpinning(true);
    setWinner(null);
    setRotation((prev) => prev + 360 * extraSpins - (prev % 360) - winnerMid - jitter);
  };

  const handleTransitionEnd = (e) => {
    if (!spinning || e.propertyName !== "transform") return;
    const idx = winnerIndexRef.current;
    setSpinning(false);
    setAfterSpin(true);
    setWinner(names[idx]);
    launchConfetti();
    if (removeWinner) setNames((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSpin = names.length >= 2 && !spinning;
  const spinLabel = spinning
    ? "Spinning…"
    : names.length < 2
    ? afterSpin
      ? "Add more names to spin"
      : "Add at least 2 names"
    : afterSpin
    ? "Spin again"
    : "Spin the wheel";

  return (
    <>
      <Confetti pieces={confetti} />

      <header className="site-head">
        <span className="eyebrow">warm-up round</span>
        <h1>Who's up first?</h1>
        <p className="subhead">Load the names, give it a spin, break the ice.</p>
      </header>

      <main className="layout">
        {/* LEFT: name management */}
        <section className="panel names-panel" aria-labelledby="namesHeading">
          <h2 id="namesHeading">Names in the hat</h2>

          <form className="add-form" onSubmit={addName}>
            <label htmlFor="nameInput" className="visually-hidden">Add a name</label>
            <input
              ref={inputRef}
              type="text"
              id="nameInput"
              placeholder="Type a name and hit enter…"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" id="addBtn" aria-label="Add name">+</button>
          </form>

          <ul className="chip-list">
            {names.map((name, i) => (
              <li className="chip" key={`${name}-${i}`}>
                <span>{name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => removeName(i)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="panel-actions">
            <button className="ghost-btn" type="button" onClick={shuffle}>Shuffle order</button>
            <button className="ghost-btn ghost-btn--danger" type="button" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <p className="hint">
            {names.length === 1 ? "1 name loaded" : `${names.length} names loaded`}
          </p>
        </section>

        {/* RIGHT: the wheel */}
        <section className="panel wheel-panel" aria-labelledby="wheelHeading">
          <h2 id="wheelHeading" className="visually-hidden">The wheel</h2>

          <div className="wheel-stage">
            <div className="pointer" aria-hidden="true">
              <svg viewBox="0 0 60 70" width="60" height="70">
                <path
                  d="M30 68 L2 6 Q30 -6 58 6 Z"
                  fill="var(--coral)"
                  stroke="var(--ink)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="wheel-wrap">
              <Wheel names={names} rotation={rotation} onTransitionEnd={handleTransitionEnd} />
              <div className="hub">
                <svg viewBox="0 0 40 40" width="40" height="40">
                  <circle cx="20" cy="20" r="17" fill="var(--marigold)" stroke="var(--ink)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="5" fill="var(--ink)" />
                </svg>
              </div>
            </div>
          </div>

          <label className="toggle-row" htmlFor="removeToggle">
            <input
              type="checkbox"
              id="removeToggle"
              checked={removeWinner}
              onChange={(e) => setRemoveWinner(e.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-text">Remove winner from the wheel after each spin</span>
          </label>

          <button className="spin-btn" type="button" disabled={!canSpin} onClick={spin}>
            <span>{spinLabel}</span>
          </button>

          <div className="result-banner" role="status" aria-live="polite">
            <span className="result-label">Up first:</span>
            <span className={`result-name${winner ? " show" : ""}`}>{winner ?? "—"}</span>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <p>Tip: press <kbd>Enter</kbd> after each name to add it quickly.</p>
      </footer>
    </>
  );
}
