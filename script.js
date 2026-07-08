(function () {
  "use strict";

  let names = [];
  let currentRotation = 0; 
  let spinning = false;

  const COLORS = ["#F7EFD8", "#E85C4A", "#2F7E7A", "#E8A93B"]; 
  const WHEEL_RADIUS = 190;


  const addForm = document.getElementById("addForm");
  const nameInput = document.getElementById("nameInput");
  const chipList = document.getElementById("chipList");
  const countHint = document.getElementById("countHint");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const clearBtn = document.getElementById("clearBtn");

  const wheelGroup = document.getElementById("wheelGroup");
  const removeToggle = document.getElementById("removeToggle");
  const spinBtn = document.getElementById("spinBtn");
  const spinBtnLabel = document.getElementById("spinBtnLabel");
  const resultName = document.getElementById("resultName");
  const confettiLayer = document.getElementById("confettiLayer");

  
  names = ["Ava", "Noah", "Priya", "Mateo", "Zoe", "Leon"];

  
  function renderChips() {
    chipList.innerHTML = "";
    names.forEach((name, i) => {
      const li = document.createElement("li");
      li.className = "chip";
      li.innerHTML = `<span>${escapeHtml(name)}</span>`;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.setAttribute("aria-label", `Remove ${name}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        names.splice(i, 1);
        renderChips();
        renderWheel();
      });
      li.appendChild(removeBtn);
      chipList.appendChild(li);
    });

    countHint.textContent = names.length === 1
      ? "1 name loaded"
      : `${names.length} names loaded`;

    const canSpin = names.length >= 2 && !spinning;
    spinBtn.disabled = !canSpin;
    spinBtnLabel.textContent = names.length < 2
      ? "Add at least 2 names"
      : "Spin the wheel";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }


  function renderWheel() {
    wheelGroup.innerHTML = "";
    const n = names.length;

    if (n === 0) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", WHEEL_CENTER);
      text.setAttribute("y", WHEEL_CENTER);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "wheel-empty-msg");
      text.textContent = "Add names to build the wheel";
      wheelGroup.appendChild(text);
      return;
    }

    const sliceAngle = 360 / n;

    names.forEach((name, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = COLORS[i % COLORS.length];

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", describeWedge(WHEEL_CENTER, WHEEL_CENTER, WHEEL_RADIUS, startAngle, endAngle));
      path.setAttribute("fill", color);
      path.setAttribute("stroke", "#1B2A2E");
      path.setAttribute("stroke-width", "2.5");
      wheelGroup.appendChild(path);


      const midAngle = startAngle + sliceAngle / 2;
      const textColor = (color === "#F7EFD8" || color === "#E8A93B") ? "#1B2A2E" : "#F7EFD8";
      const labelRadius = WHEEL_RADIUS * 0.62;
      const pos = polarToCartesian(WHEEL_CENTER, WHEEL_CENTER, labelRadius, midAngle);

     
      let rotation = midAngle;
      if (midAngle > 90 && midAngle < 270) {
        rotation += 180;
      }

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("transform", `rotate(${rotation} ${pos.x} ${pos.y})`);
      text.setAttribute("fill", textColor);
      text.setAttribute("font-family", "'Baloo 2', sans-serif");
      text.setAttribute("font-weight", "700");
      text.setAttribute("font-size", n > 10 ? "13" : "17");
      text.textContent = truncate(name, 16);
      wheelGroup.appendChild(text);
    });
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  }

  function describeWedge(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
      "Z",
    ].join(" ");
  }


  function spin() {
    if (spinning || names.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    spinBtnLabel.textContent = "Spinning…";
    resultName.classList.remove("show");
    resultName.textContent = "—";

    const n = names.length;
    const sliceAngle = 360 / n;
    const winnerIndex = Math.floor(Math.random() * n);

   
    const winnerMid = winnerIndex * sliceAngle + sliceAngle / 2;

   
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.6;

    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full turns

  
    const currentNormalized = currentRotation % 360;
    currentRotation += (360 * extraSpins) - currentNormalized - winnerMid - jitter;

    wheelGroup.style.transform = `rotate(${currentRotation}deg)`;

    const onDone = () => {
      wheelGroup.removeEventListener("transitionend", onDone);
      spinning = false;
      const winnerName = names[winnerIndex];

      resultName.textContent = winnerName;
      resultName.classList.add("show");
      launchConfetti();

      if (removeToggle.checked) {
        names.splice(winnerIndex, 1);
        renderChips();
        renderWheel();
        spinBtnLabel.textContent = names.length >= 2 ? "Spin again" : "Add more names to spin";
      } else {
        spinBtn.disabled = names.length < 2;
        spinBtnLabel.textContent = "Spin again";
      }
    };
    wheelGroup.addEventListener("transitionend", onDone);
  }

  
  function launchConfetti() {
    const colors = ["#E85C4A", "#E8A93B", "#2F7E7A", "#F7EFD8"];
    const pieceCount = 60;
    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      const startX = Math.random() * window.innerWidth;
      const drift = (Math.random() - 0.5) * 200;
      const duration = 2.2 + Math.random() * 1.4;
      const delay = Math.random() * 0.3;
      const spinDeg = 360 + Math.random() * 720;
      piece.style.left = `${startX}px`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", `${drift}px`);
      piece.style.setProperty("--spin", `${spinDeg}deg`);
      piece.style.animationDuration = `${duration}s`;
      piece.style.animationDelay = `${delay}s`;
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + delay) * 1000 + 100);
    }
  }

  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = nameInput.value.trim();
    if (!value) return;
    names.push(value);
    nameInput.value = "";
    nameInput.focus();
    renderChips();
    renderWheel();
  });

  shuffleBtn.addEventListener("click", () => {
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    renderChips();
    renderWheel();
  });

  clearBtn.addEventListener("click", () => {
    if (names.length === 0) return;
    names = [];
    renderChips();
    renderWheel();
    resultName.textContent = "—";
    resultName.classList.remove("show");
  });

  spinBtn.addEventListener("click", spin);

  
  renderChips();
  renderWheel();
})();
