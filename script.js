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
const summarySeasonSelect = document.getElementById("summarySeasonSelect");
const logSeasonSelect = document.getElementById("logSeasonSelect");
const totals = document.getElementById("totals");
const styleSummaries = document.getElementById("styleSummaries");
const legend = document.getElementById("chartLegend");
const chartCanvas = document.getElementById("distanceChart");

const styleInput = document.getElementById("style");
const dateInput = document.getElementById("date");
const distanceInput = document.getElementById("distance");
const durationInput = document.getElementById("duration");
const elevationInput = document.getElementById("elevation");
const elevationField = document.getElementById("elevationField");

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = {
  logg: document.getElementById("tab-logg"),
  sammanfattning: document.getElementById("tab-sammanfattning"),
};

let editingSessionId = null;
let selectedSummarySeason = getCurrentSeason();
let selectedLogSeasonFilter = "__current__";

function parseSeasonStartYear(season) {
  if (!season || !season.includes("/")) return -1;
  const prefix = Number(season.split("/")[0]);
  if (!Number.isFinite(prefix)) return -1;
  return prefix >= 70 ? 1900 + prefix : 2000 + prefix;
}

function getSeasonOptions(sessions) {
  const allSeasons = new Set(sessions.map((session) => session.season));
  allSeasons.add(getCurrentSeason());

  return [...allSeasons].sort((a, b) => parseSeasonStartYear(b) - parseSeasonStartYear(a));
}

function renderSeasonSelector(sessions) {
  const options = getSeasonOptions(sessions);

  if (!options.includes(selectedSummarySeason)) {
    selectedSummarySeason = getCurrentSeason();
  }

  summarySeasonSelect.innerHTML = options
    .map((season) => `<option value="${season}">${season}</option>`)
    .join("");

  summarySeasonSelect.value = selectedSummarySeason;
}

function renderLogSeasonSelector(sessions) {
  const options = getSeasonOptions(sessions);

  const built = [
    { value: "__current__", label: "Aktuell säsong" },
    { value: "__all__", label: "Alla säsonger" },
    ...options.map((season) => ({ value: season, label: season })),
  ];

  logSeasonSelect.innerHTML = built
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");

  if (!built.some((option) => option.value === selectedLogSeasonFilter)) {
    selectedLogSeasonFilter = "__current__";
  }

  logSeasonSelect.value = selectedLogSeasonFilter;
}

function getLogSessions(allSessions, currentSeason) {
  if (selectedLogSeasonFilter === "__all__") {
    return allSessions;
  }

  if (selectedLogSeasonFilter === "__current__") {
    return allSessions.filter((session) => session.season === currentSeason);
  }

  return allSessions.filter((session) => session.season === selectedLogSeasonFilter);
}

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
  if (!raw) return NaN;
  return Number(raw.replace(",", ".").trim());
}

function parseDurationToSeconds(raw) {
  if (!raw) return NaN;

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
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return "-";
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
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((session) => session && session.style && session.date)
      .map((session) => {
        const distance = Number(session.distance);
        const durationSeconds = Number(session.durationSeconds);
        const style = session.style;

        const elevationValue = style === "Stakmaskin" ? 0 : Number(session.elevation);
        const season = session.season || getSeasonFromDate(new Date(session.date));

        return {
          id: session.id || crypto.randomUUID(),
          style,
          date: session.date,
          distance: Number.isFinite(distance) ? distance : 0,
          durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
          elevation: Number.isFinite(elevationValue) ? elevationValue : 0,
          season,
        };
      })
      .filter((session) => session.distance > 0 && session.durationSeconds > 0);
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function updateElevationVisibility() {
  const isStakmaskin = styleInput.value === "Stakmaskin";
  elevationField.classList.toggle("hidden", isStakmaskin);
  elevationInput.required = !isStakmaskin;
  if (isStakmaskin) {
    elevationInput.value = "";
  }
}

function clearForm() {
  form.reset();
  dateInput.valueAsDate = new Date();
  errorField.textContent = "";
  updateElevationVisibility();
}

function setEditingMode(session) {
  editingSessionId = session.id;
  styleInput.value = session.style;
  dateInput.value = session.date;
  distanceInput.value = formatDistanceInput(session.distance);
  durationInput.value = formatDuration(session.durationSeconds);
  elevationInput.value = session.style === "Stakmaskin" ? "" : String(session.elevation);
  submitButton.textContent = "Uppdatera pass";
  cancelEditButton.classList.remove("hidden");
  formState.textContent = `Redigerar pass: ${session.style} ${session.date}`;
  updateElevationVisibility();
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
  const currentSeason = getCurrentSeason();
  const logSessions = getLogSessions(all, currentSeason);
  const summarySessions = all.filter((session) => session.season === selectedSummarySeason);

  seasonLabel.textContent = `Aktuell säsong: ${currentSeason}`;
  summarySeason.textContent = selectedSummarySeason;

  renderLogSeasonSelector(all);
  renderSeasonSelector(all);
  renderSessionList(logSessions);
  renderSummary(summarySessions);
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
      const details =
        session.style === "Stakmaskin"
          ? `${formatNumber(session.distance)} km • ${formatDuration(session.durationSeconds)} • Tempo: ${formatPace(secPerKm)}`
          : `${formatNumber(session.distance)} km • ${formatDuration(session.durationSeconds)} • Tempo: ${formatPace(secPerKm)} • Stifa: ${formatNumber(session.elevation / session.distance)}`;

      item.innerHTML = `
        <strong>${session.style}</strong> • ${session.date}
        <div class="meta">${details}</div>
        <div class="session-actions">
          <button type="button" class="edit-button" data-action="edit" data-id="${session.id}">Ändra</button>
          <button type="button" class="delete-button" data-action="delete" data-id="${session.id}">Ta bort</button>
        </div>
      `;
      list.appendChild(item);
    });
}

function renderSummary(sessions) {
  const sessionsWithoutStak = sessions.filter((session) => session.style !== "Stakmaskin");

  const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalElevation = sessionsWithoutStak.reduce((sum, s) => sum + s.elevation, 0);
  const distanceWithoutStak = sessionsWithoutStak.reduce((sum, s) => sum + s.distance, 0);

  const averagePace = totalDistance > 0 ? totalSeconds / totalDistance : 0;
  const averageStifa = distanceWithoutStak > 0 ? totalElevation / distanceWithoutStak : 0;

  totals.innerHTML = `
    <article class="total-card"><h3>Totalt pass</h3><p>${sessions.length}</p></article>
    <article class="total-card"><h3>Total distans</h3><p>${formatNumber(totalDistance)} km</p></article>
    <article class="total-card"><h3>Total tid</h3><p>${formatDuration(totalSeconds)}</p></article>
    <article class="total-card"><h3>Totala höjdmeter (utan stakmaskin)</h3><p>${formatNumber(totalElevation, 0)} hm</p></article>
    <article class="total-card"><h3>Snittempo</h3><p>${formatPace(averagePace)}</p></article>
    <article class="total-card"><h3>Stifa (utan stakmaskin)</h3><p>${formatNumber(averageStifa)}</p></article>
  `;

  const distancesByStyle = Object.keys(STYLES).map((style) => ({
    style,
    color: STYLES[style],
    sessions: sessions.filter((session) => session.style === style),
  }));

  distancesByStyle.forEach((entry) => {
    entry.distance = entry.sessions.reduce((sum, session) => sum + session.distance, 0);
    entry.duration = entry.sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    entry.elevation =
      entry.style === "Stakmaskin"
        ? 0
        : entry.sessions.reduce((sum, session) => sum + session.elevation, 0);
    entry.pace = entry.distance > 0 ? entry.duration / entry.distance : 0;
    entry.stifa = entry.style === "Stakmaskin" ? null : entry.distance > 0 ? entry.elevation / entry.distance : 0;
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
    .map((entry) => {
      const stifaRow =
        entry.style === "Stakmaskin"
          ? "<li>Stifa: -</li>"
          : `<li>Stifa: ${formatNumber(entry.stifa)}</li>`;
      const elevationRow =
        entry.style === "Stakmaskin"
          ? "<li>Höjdmeter: -</li>"
          : `<li>Höjdmeter: ${formatNumber(entry.elevation, 0)} hm</li>`;

      return `
      <article class="style-summary">
        <h3>${entry.style}</h3>
        <ul>
          <li>Pass: ${entry.sessions.length}</li>
          <li>Distans: ${formatNumber(entry.distance)} km</li>
          <li>Tid: ${formatDuration(entry.duration)}</li>
          ${elevationRow}
          <li>Tempo: ${formatPace(entry.pace)}</li>
          ${stifaRow}
        </ul>
      </article>`;
    })
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

  if (!date) return { error: "Ange datum." };
  if (!Number.isFinite(distance) || distance <= 0) {
    return { error: "Distans måste vara ett positivt tal." };
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { error: "Tid måste vara i format mm:ss eller hh:mm:ss." };
  }

  let elevation = 0;
  if (style !== "Stakmaskin") {
    elevation = parseNumber(elevationInput.value);
    if (!Number.isFinite(elevation) || elevation < 0) {
      return { error: "Höjdmeter måste vara 0 eller mer." };
    }
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
  styleInput.addEventListener("change", updateElevationVisibility);
  logSeasonSelect.addEventListener("change", () => {
    selectedLogSeasonFilter = logSeasonSelect.value;
    render();
  });
  summarySeasonSelect.addEventListener("change", () => {
    selectedSummarySeason = summarySeasonSelect.value;
    render();
  });
  initTabs();
  updateElevationVisibility();
  render();
}

init();
