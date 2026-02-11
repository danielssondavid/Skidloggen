const STORAGE_KEY = "skidlogg.sessions";
const STYLES = {
  Klassiskt: "#1f6bff",
  Skejt: "#21a559",
  Rullskidor: "#d83b3b",
  Stakmaskin: "#e0bd00",
};

const form = document.getElementById("sessionForm");
const list = document.getElementById("sessionList");
const emptyState = document.getElementById("emptyState");
const errorField = document.getElementById("formError");
const formState = document.getElementById("formState");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const seasonLabel = document.getElementById("seasonLabel");
const summarySeason = document.getElementById("summarySeason");
const totals = document.getElementById("totals");
const styleSummaries = document.getElementById("styleSummaries");
const legend = document.getElementById("chartLegend");
const chartCanvas = document.getElementById("distanceChart");

const styleInput = document.getElementById("style");
const dateInput = document.getElementById("date");
const distanceInput = document.getElementById("distance");
const durationInput = document.getElementById("duration");
const elevationInput = document.getElementById("elevation");

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = {
  logg: document.getElementById("tab-logg"),
  sammanfattning: document.getElementById("tab-sammanfattning"),
};

let editingSessionId = null;

function getSeasonFromDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 6 ? year : year - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}/${String(endYear).slice(-2)}`;
}

function getCurrentSeason() {
  return getSeasonFromDate(new Date());
}

function parseNumber(raw) {
  if (!raw) {
    return NaN;
  }
  return Number(raw.replace(",", ".").trim());
}

function parseDurationToSeconds(raw) {
  if (!raw) {
    return NaN;
  }

  const parts = raw.split(":").map((value) => Number(value.trim()));

  if (parts.some((value) => Number.isNaN(value) || value < 0)) {
    return NaN;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return NaN;
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatPace(secPerKm) {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) {
    return "-";
  }
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} min/km`;
}

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatDistanceInput(value) {
  return String(value).replace(".", ",");
}

function loadSessions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function clearForm() {
  form.reset();
  dateInput.valueAsDate = new Date();
  errorField.textContent = "";
}

function setEditingMode(session) {
  editingSessionId = session.id;
  styleInput.value = session.style;
  dateInput.value = session.date;
  distanceInput.value = formatDistanceInput(session.distance);
  durationInput.value = formatDuration(session.durationSeconds);
  elevationInput.value = String(session.elevation);
  submitButton.textContent = "Uppdatera pass";
  cancelEditButton.classList.remove("hidden");
  formState.textContent = `Redigerar pass: ${session.style} ${session.date}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetEditingMode() {
  editingSessionId = null;
  submitButton.textContent = "Spara pass";
  cancelEditButton.classList.add("hidden");
  formState.textContent = "";
  clearForm();
}

function render() {
  const all = loadSessions();
  const season = getCurrentSeason();
  const sessions = all.filter((session) => session.season === season);

  seasonLabel.textContent = `Aktuell säsong: ${season}`;
  summarySeason.textContent = season;

  renderSessionList(sessions);
  renderSummary(sessions);
}

function renderSessionList(sessions) {
  list.innerHTML = "";

  if (!sessions.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((session) => {
      const item = document.createElement("li");
      item.className = "session-item";

      const secPerKm = session.durationSeconds / session.distance;
      const stifa = session.elevation / session.distance;

      item.innerHTML = `
        <strong>${session.style}</strong> • ${session.date}
        <div class="meta">
          ${formatNumber(session.distance)} km • ${formatDuration(session.durationSeconds)} •
          Tempo: ${formatPace(secPerKm)} • Stifa: ${formatNumber(stifa)}
        </div>
        <div class="session-actions">
          <button type="button" class="edit-button" data-action="edit" data-id="${session.id}">Ändra</button>
          <button type="button" class="delete-button" data-action="delete" data-id="${session.id}">Ta bort</button>
        </div>
      `;
      list.appendChild(item);
    });
}

function renderSummary(sessions) {
  const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalElevation = sessions.reduce((sum, s) => sum + s.elevation, 0);
  const averagePace = totalDistance > 0 ? totalSeconds / totalDistance : 0;
  const averageStifa = totalDistance > 0 ? totalElevation / totalDistance : 0;

  totals.innerHTML = `
    <article class="total-card"><h3>Totalt pass</h3><p>${sessions.length}</p></article>
    <article class="total-card"><h3>Total distans</h3><p>${formatNumber(totalDistance)} km</p></article>
    <article class="total-card"><h3>Total tid</h3><p>${formatDuration(totalSeconds)}</p></article>
    <article class="total-card"><h3>Totala höjdmeter</h3><p>${formatNumber(totalElevation, 0)} hm</p></article>
    <article class="total-card"><h3>Snittempo</h3><p>${formatPace(averagePace)}</p></article>
    <article class="total-card"><h3>Stifa</h3><p>${formatNumber(averageStifa)}</p></article>
  `;

  const distancesByStyle = Object.keys(STYLES).map((style) => ({
    style,
    color: STYLES[style],
    sessions: sessions.filter((session) => session.style === style),
  }));

  distancesByStyle.forEach((entry) => {
    entry.distance = entry.sessions.reduce((sum, session) => sum + session.distance, 0);
    entry.duration = entry.sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    entry.elevation = entry.sessions.reduce((sum, session) => sum + session.elevation, 0);
    entry.pace = entry.distance > 0 ? entry.duration / entry.distance : 0;
    entry.stifa = entry.distance > 0 ? entry.elevation / entry.distance : 0;
  });

  renderStyleSummaries(distancesByStyle);
  renderPieChart(distancesByStyle);

  legend.innerHTML = distancesByStyle
    .map(
      (entry) => `
      <li>
        <span class="swatch" style="background:${entry.color}"></span>
        <span>${entry.style}: ${formatNumber(entry.distance)} km</span>
      </li>`
    )
    .join("");
}

function renderStyleSummaries(styleData) {
  styleSummaries.innerHTML = styleData
    .map(
      (entry) => `
      <article class="style-summary">
        <h3>${entry.style}</h3>
        <ul>
          <li>Pass: ${entry.sessions.length}</li>
          <li>Distans: ${formatNumber(entry.distance)} km</li>
          <li>Tid: ${formatDuration(entry.duration)}</li>
          <li>Höjdmeter: ${formatNumber(entry.elevation, 0)} hm</li>
          <li>Tempo: ${formatPace(entry.pace)}</li>
          <li>Stifa: ${formatNumber(entry.stifa)}</li>
        </ul>
      </article>`
    )
    .join("");
}

function renderPieChart(data) {
  const ctx = chartCanvas.getContext("2d");
  const total = data.reduce((sum, entry) => sum + entry.distance, 0);
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const radius = Math.min(width, height) / 2 - 8;

  ctx.clearRect(0, 0, width, height);

  if (!total) {
    ctx.fillStyle = "#d8dfee";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#59637a";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Ingen distans", width / 2, height / 2 + 5);
    return;
  }

  let start = -Math.PI / 2;

  data.forEach((entry) => {
    const angle = (entry.distance / total) * Math.PI * 2;
    if (!angle) return;

    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.arc(width / 2, height / 2, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = entry.color;
    ctx.fill();

    start += angle;
  });
}

function buildSessionFromForm() {
  const style = styleInput.value;
  const date = dateInput.value;
  const distance = parseNumber(distanceInput.value);
  const durationSeconds = parseDurationToSeconds(durationInput.value);
  const elevation = parseNumber(elevationInput.value);

  if (!date) {
    return { error: "Ange datum." };
  }

  if (!Number.isFinite(distance) || distance <= 0) {
    return { error: "Distans måste vara ett positivt tal." };
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { error: "Tid måste vara i format mm:ss eller hh:mm:ss." };
  }

  if (!Number.isFinite(elevation) || elevation < 0) {
    return { error: "Höjdmeter måste vara 0 eller mer." };
  }

  return {
    value: {
      style,
      date,
      distance,
      durationSeconds,
      elevation,
      season: getSeasonFromDate(new Date(date)),
    },
  };
}

function submitSession(event) {
  event.preventDefault();
  errorField.textContent = "";
  formState.textContent = "";

  const parsed = buildSessionFromForm();
  if (parsed.error) {
    errorField.textContent = parsed.error;
    return;
  }

  const sessions = loadSessions();

  if (editingSessionId) {
    const updated = sessions.map((session) =>
      session.id === editingSessionId ? { ...session, ...parsed.value } : session
    );
    saveSessions(updated);
    resetEditingMode();
  } else {
    sessions.push({ id: crypto.randomUUID(), ...parsed.value });
    saveSessions(sessions);
    clearForm();
  }

  render();
}

function handleListAction(event) {
  const target = event.target.closest("button[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  const sessions = loadSessions();
  const session = sessions.find((item) => item.id === id);

  if (!session) return;

  if (action === "edit") {
    setEditingMode(session);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("Vill du ta bort passet?");
    if (!confirmed) return;

    const next = sessions.filter((item) => item.id !== id);
    saveSessions(next);

    if (editingSessionId === id) {
      resetEditingMode();
    }

    render();
  }
}

function initTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");

      const target = button.dataset.tab;
      Object.entries(tabPanels).forEach(([name, panel]) => {
        panel.classList.toggle("active", name === target);
      });
    });
  });
}

function init() {
  dateInput.valueAsDate = new Date();
  form.addEventListener("submit", submitSession);
  list.addEventListener("click", handleListAction);
  cancelEditButton.addEventListener("click", resetEditingMode);
  initTabs();
  render();
}

init();
