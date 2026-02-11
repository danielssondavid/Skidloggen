:root {
  color-scheme: light;
  --bg: #f3f6fb;
  --card: #ffffff;
  --text: #182033;
  --muted: #59637a;
  --primary: #1954db;
  --border: #d8dfee;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text);
  background: var(--bg);
}

.app {
  max-width: 760px;
  margin: 0 auto;
  padding: 1rem;
}

h1,
h2,
p {
  margin: 0;
}

header {
  margin-bottom: 1rem;
}

.season {
  color: var(--muted);
  margin-top: 0.25rem;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-button {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  padding: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.tab-button.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.tab-panel {
  display: none;
  gap: 1rem;
}

.tab-panel.active {
  display: grid;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
}

form {
  display: grid;
  gap: 0.75rem;
}

label {
  display: grid;
  gap: 0.3rem;
  font-weight: 600;
}

input,
select,
button {
  font: inherit;
}

input,
select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.7rem;
}

.form-actions {
  display: flex;
  gap: 0.6rem;
}

.primary,
.secondary,
.edit-button,
.delete-button {
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.secondary,
.edit-button {
  background: #fff;
  color: var(--text);
  border-color: var(--border);
}

.delete-button {
  background: #fff6f6;
  color: #a30000;
  border-color: #efc8c8;
}

.hidden {
  display: none;
}

.form-state {
  color: #0d5c9e;
  min-height: 1.3em;
}

.error {
  color: #b3261e;
  min-height: 1.3em;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0.8rem 0 0;
  display: grid;
  gap: 0.65rem;
}

.session-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem;
  background: #fafcff;
}

.session-item .meta {
  color: var(--muted);
  font-size: 0.93rem;
  margin-top: 0.35rem;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
  margin-top: 0.7rem;
}

.total-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem;
  background: #fafcff;
}

.total-card h3 {
  margin: 0 0 0.2rem;
  font-size: 0.95rem;
}

.style-summaries {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.7rem;
}

.style-summary {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem;
  background: #fafcff;
}

.style-summary h3 {
  margin: 0 0 0.45rem;
  font-size: 1rem;
}

.style-summary ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.25rem;
  color: var(--muted);
}

.legend {
  list-style: none;
  padding: 0;
  margin: 0.8rem 0 0;
  display: grid;
  gap: 0.4rem;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

#distanceChart {
  width: 100%;
  max-width: 320px;
  height: auto;
}

@media (max-width: 560px) {
  .app {
    padding: 0.8rem;
  }

  .tabs {
    position: sticky;
    top: 0;
    background: var(--bg);
    padding-top: 0.4rem;
    z-index: 10;
  }
}
