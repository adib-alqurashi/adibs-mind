/* Study Timer: one start/stop timer, minutes per day, and a small stats card. */
const { Plugin, Notice, MarkdownRenderChild } = require("obsidian");

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function fmtMinutes(min) {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return (h ? `${h}:` : "") + `${pad(m)}:${pad(x)}`;
}

/* Add the span [start, end) to a {day: minutes} map, splitting at midnight. */
function addSpan(days, start, end) {
  let t = start;
  while (t < end) {
    const d = new Date(t);
    const next = addDays(d, 1).getTime();
    const stop = Math.min(end, next);
    const k = dayKey(d);
    days[k] = (days[k] || 0) + (stop - t) / 60000;
    t = stop;
  }
}

function computeStats(days, now) {
  const today = new Date(now);
  const get = (d) => days[dayKey(d)] || 0;

  let streak = 0;
  let d = get(today) >= 1 ? today : addDays(today, -1);
  while (get(d) >= 1) {
    streak += 1;
    d = addDays(d, -1);
  }

  let week = 0;
  for (let i = 0; i < 7; i++) week += get(addDays(today, -i));

  let total = 0;
  let bestDay = null;
  let bestMin = 0;
  for (const [k, v] of Object.entries(days)) {
    total += v;
    if (v > bestMin) {
      bestMin = v;
      bestDay = k;
    }
  }
  return { today: get(today), streak, week, total, bestDay, bestMin };
}

class StatsView extends MarkdownRenderChild {
  constructor(el, plugin) {
    super(el);
    this.plugin = plugin;
  }
  onload() {
    this.plugin.views.add(this);
    this.render();
  }
  onunload() {
    this.plugin.views.delete(this);
  }
  /* Build the card once; render() only updates text, so the button never moves under a click. */
  build() {
    const p = this.plugin;
    const box = this.containerEl.createDiv({ cls: "study-timer" });
    const top = box.createDiv({ cls: "study-timer-top" });
    this.clock = top.createDiv({ cls: "study-timer-clock" });
    this.btn = top.createEl("button", { cls: "study-timer-btn" });
    this.btn.addEventListener("click", () => p.toggle());

    const grid = box.createDiv({ cls: "study-timer-grid" });
    const card = (label) => {
      const c = grid.createDiv({ cls: "study-timer-card" });
      const value = c.createDiv({ cls: "study-timer-value" });
      c.createDiv({ cls: "study-timer-label", text: label });
      const sub = c.createDiv({ cls: "study-timer-sub" });
      return { value, sub };
    };
    this.cards = {
      today: card("Today"),
      streak: card("Streak"),
      week: card("This week"),
      total: card("Total"),
      best: card("Best day"),
    };
  }

  render() {
    if (!this.btn) this.build();
    const p = this.plugin;
    const running = p.isRunning();
    this.clock.setText(running ? fmtClock(Date.now() - p.data.startedAt) : "00:00");
    this.btn.setText(running ? "Stop" : "Start");
    this.btn.toggleClass("mod-cta", !running);
    this.btn.toggleClass("is-running", running);

    const s = p.stats();
    this.cards.today.value.setText(fmtMinutes(s.today));
    this.cards.streak.value.setText(`${s.streak} ${s.streak === 1 ? "day" : "days"}`);
    this.cards.week.value.setText(fmtMinutes(s.week));
    this.cards.total.value.setText(fmtMinutes(s.total));
    this.cards.best.value.setText(s.bestDay ? fmtMinutes(s.bestMin) : "—");
    this.cards.best.sub.setText(s.bestDay || "");
  }
}

/* ---------- Calendar ---------- */

const DATE = "(\\d{4}-\\d{2}-\\d{2})";
const TASK_RE = /^\s*[-*+] \[(.)\] (.*)$/;
const parseDay = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/* Read every task line that has a date. Returns [{text, time, done, kind, from, to, path, line, recurring}] */
function parseTasks(content, path) {
  const out = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = TASK_RE.exec(lines[i]);
    if (!m) continue;
    const body = m[2];
    const due = (body.match(new RegExp("📅\\s*" + DATE)) || [])[1];
    const sched = (body.match(new RegExp("⏳\\s*" + DATE)) || [])[1];
    const start = (body.match(new RegExp("🛫\\s*" + DATE)) || [])[1];
    const end = due || sched;
    if (!end && !start) continue;
    const from = start || end;
    const to = end || start;
    const tags = (body.match(/#[\w/-]+/g) || []).map((t) => t.toLowerCase());
    const kind = tags.includes("#deadline") ? "deadline" : tags.includes("#event") ? "event" : "task";
    let text = body
      .replace(/🔁[^📅⏳🛫✅➕⏫🔼🔽🔺⏬#]*/gu, "")
      .replace(new RegExp("[📅⏳🛫✅➕❌]\\s*" + DATE, "gu"), "")
      .replace(/[⏫🔼🔽🔺⏬]/gu, "")
      .replace(/#[\w/-]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    let time = "";
    const tm = text.match(/^(\d{1,2}:\d{2})\s+/);
    if (tm) {
      time = tm[1].padStart(5, "0");
      text = text.slice(tm[0].length);
    }
    out.push({
      text,
      time,
      done: m[1] !== " ",
      kind,
      from,
      to,
      path,
      line: i,
      recurring: body.includes("🔁"),
    });
  }
  return out;
}

/* Spread items over every day they cover: {"YYYY-MM-DD": [items]} */
function indexByDay(items) {
  const byDay = {};
  for (const it of items) {
    let d = parseDay(it.from);
    const last = parseDay(it.to < it.from ? it.from : it.to);
    let guard = 0;
    while (d <= last && guard++ < 400) {
      (byDay[dayKey(d)] = byDay[dayKey(d)] || []).push(it);
      d = addDays(d, 1);
    }
  }
  const rank = { deadline: 0, event: 1, task: 2 };
  for (const k of Object.keys(byDay)) {
    byDay[k].sort((a, b) =>
      a.done - b.done || (a.time || "99") .localeCompare(b.time || "99") || rank[a.kind] - rank[b.kind] || a.text.localeCompare(b.text)
    );
  }
  return byDay;
}

function parseOptions(src) {
  const o = {};
  for (const line of src.split("\n")) {
    const m = line.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/);
    if (m) o[m[1].toLowerCase()] = m[2];
  }
  return o;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

class CalendarView extends MarkdownRenderChild {
  constructor(el, plugin, opts) {
    super(el);
    this.plugin = plugin;
    this.opts = opts;
    const now = new Date();
    this.month = new Date(now.getFullYear(), now.getMonth(), 1);
    this.selected = dayKey(now);
  }
  onload() {
    this.plugin.calendars.add(this);
    this.render();
  }
  onunload() {
    this.plugin.calendars.delete(this);
  }

  render() {
    const p = this.plugin;
    const el = this.containerEl;
    el.empty();
    const today = dayKey(new Date());
    const byDay = p.byDay || {};
    const minutes = p.data.days || {};
    const start = this.opts.start ? parseDay(this.opts.start) : null;
    const end = this.opts.end ? parseDay(this.opts.end) : null;
    const box = el.createDiv({ cls: "pcal" });

    // Term progress
    if (start && end) {
      const now = parseDay(today);
      const msDay = 86400000;
      const totalWeeks = Math.ceil((end - start + msDay) / (7 * msDay));
      let line;
      if (now < start) line = `${this.opts.name || "Term"} starts in ${Math.round((start - now) / msDay)} days`;
      else if (now > end) line = `${this.opts.name || "Term"} is over`;
      else {
        const week = Math.floor((now - start) / (7 * msDay)) + 1;
        const left = Math.round((end - now) / msDay);
        line = `${this.opts.name || "Term"} · week ${week} of ${totalWeeks} · ${left} days left`;
      }
      const prog = box.createDiv({ cls: "pcal-term" });
      prog.createSpan({ text: line });
      prog.createSpan({ cls: "pcal-term-dates", text: `${this.opts.start} → ${this.opts.end}` });
    }

    // Header
    const head = box.createDiv({ cls: "pcal-head" });
    const prev = head.createEl("button", { text: "‹" });
    head.createDiv({ cls: "pcal-title", text: `${MONTHS[this.month.getMonth()]} ${this.month.getFullYear()}` });
    const next = head.createEl("button", { text: "›" });
    const todayBtn = head.createEl("button", { text: "Today" });
    prev.onclick = () => { this.month = new Date(this.month.getFullYear(), this.month.getMonth() - 1, 1); this.render(); };
    next.onclick = () => { this.month = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 1); this.render(); };
    todayBtn.onclick = () => { const n = new Date(); this.month = new Date(n.getFullYear(), n.getMonth(), 1); this.selected = dayKey(n); this.render(); };

    // Grid
    const grid = box.createDiv({ cls: "pcal-grid" });
    for (const w of WEEKDAYS) grid.createDiv({ cls: "pcal-wd", text: w });
    const first = this.month;
    let d = addDays(first, -first.getDay());
    for (let i = 0; i < 42; i++, d = addDays(d, 1)) {
      if (i === 35 && d.getMonth() !== first.getMonth()) break;
      const k = dayKey(d);
      const cell = grid.createDiv({ cls: "pcal-day" });
      if (d.getMonth() !== first.getMonth()) cell.addClass("is-other");
      if (k === today) cell.addClass("is-today");
      if (k === this.selected) cell.addClass("is-selected");
      if ((start && d < start) || (end && d > end)) cell.addClass("is-off");
      const top = cell.createDiv({ cls: "pcal-day-top" });
      top.createSpan({ cls: "pcal-num", text: String(d.getDate()) });
      const mins = minutes[k] || 0;
      if (mins >= 1) top.createSpan({ cls: "pcal-mins", text: fmtMinutes(mins) });
      const items = byDay[k] || [];
      const shown = items.slice(0, 3);
      for (const it of shown) {
        const chip = cell.createDiv({ cls: `pcal-chip is-${it.kind}${it.done ? " is-done" : ""}` });
        chip.setText((it.time ? it.time + " " : "") + it.text);
        chip.setAttr("title", it.text);
      }
      if (items.length > 3) cell.createDiv({ cls: "pcal-more", text: `+${items.length - 3} more` });
      cell.onclick = () => { this.selected = k; this.render(); };
    }

    // Selected day
    const sel = parseDay(this.selected);
    const panel = box.createDiv({ cls: "pcal-panel" });
    const ph = panel.createDiv({ cls: "pcal-panel-head" });
    const label = this.selected === today ? "Today" : WEEKDAYS[sel.getDay()];
    ph.createSpan({ cls: "pcal-panel-title", text: `${label} · ${sel.getDate()} ${MONTHS[sel.getMonth()]}` });
    const smin = (this.selected === today ? p.stats().today : minutes[this.selected] || 0);
    if (smin >= 1) ph.createSpan({ cls: "pcal-mins", text: `studied ${fmtMinutes(smin)}` });
    const list = byDay[this.selected] || [];
    if (!list.length) panel.createDiv({ cls: "pcal-empty", text: "Nothing planned." });
    for (const it of list) {
      const row = panel.createDiv({ cls: `pcal-row is-${it.kind}${it.done ? " is-done" : ""}` });
      const cb = row.createEl("input", { type: "checkbox" });
      cb.checked = it.done;
      cb.onclick = (e) => { e.stopPropagation(); p.toggleTask(it); };
      if (it.time) row.createSpan({ cls: "pcal-time", text: it.time });
      row.createSpan({ cls: "pcal-text", text: it.text });
      if (it.from !== it.to) row.createSpan({ cls: "pcal-range", text: `${it.from.slice(5)} → ${it.to.slice(5)}` });
      row.createSpan({ cls: "pcal-file", text: it.path.split("/").pop().replace(/\.md$/, "") });
      row.onclick = () => p.openTask(it);
    }
  }
}

module.exports = class StudyTimerPlugin extends Plugin {
  async onload() {
    this.data = Object.assign({ days: {}, startedAt: null }, await this.loadData());
    this.views = new Set();

    this.bar = this.addStatusBarItem();
    this.bar.addClass("study-timer-bar", "mod-clickable");
    this.bar.setAttr("aria-label", "Start / stop study timer");
    this.bar.addEventListener("click", () => this.toggle());

    this.addRibbonIcon("timer", "Start / stop study timer", () => this.toggle());
    this.addCommand({ id: "toggle", name: "Start / stop", callback: () => this.toggle() });
    this.addCommand({
      id: "discard",
      name: "Discard the running session",
      checkCallback: (checking) => {
        if (!this.isRunning()) return false;
        if (!checking) this.discard();
        return true;
      },
    });

    this.registerMarkdownCodeBlockProcessor("study-timer", (src, el, ctx) => {
      ctx.addChild(new StatsView(el, this));
    });

    this.calendars = new Set();
    this.byDay = {};
    this.registerMarkdownCodeBlockProcessor("planner-calendar", (src, el, ctx) => {
      ctx.addChild(new CalendarView(el, this, parseOptions(src)));
    });
    const changed = (file) => {
      if (!file || file.extension === "md") this.scheduleScan();
    };
    this.registerEvent(this.app.vault.on("modify", changed));
    this.registerEvent(this.app.vault.on("create", changed));
    this.registerEvent(this.app.vault.on("delete", changed));
    this.registerEvent(this.app.vault.on("rename", changed));
    this.app.workspace.onLayoutReady(() => this.scan());
    this.lastDay = dayKey(new Date());

    this.registerInterval(window.setInterval(() => this.tick(), 1000));
    this.tick();
  }

  scheduleScan() {
    window.clearTimeout(this.scanTimer);
    this.scanTimer = window.setTimeout(() => this.scan(), 400);
  }

  async scan() {
    const items = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (f.path.includes("/Templates/")) continue;
      const text = await this.app.vault.cachedRead(f);
      if (!text.includes("- [")) continue;
      items.push(...parseTasks(text, f.path));
    }
    this.byDay = indexByDay(items);
    this.refreshCalendars();
  }

  refreshCalendars() {
    for (const c of this.calendars) c.render();
  }

  async toggleTask(it) {
    if (it.recurring) return this.openTask(it);
    const file = this.app.vault.getAbstractFileByPath(it.path);
    if (!file) return;
    const today = dayKey(new Date());
    await this.app.vault.process(file, (data) => {
      const lines = data.split("\n");
      const ln = lines[it.line];
      if (ln === undefined || !TASK_RE.test(ln)) return data;
      lines[it.line] = it.done
        ? ln.replace(/\[.\]/, "[ ]").replace(new RegExp("\\s*✅\\s*" + DATE), "")
        : ln.replace(/\[ \]/, "[x]") + ` ✅ ${today}`;
      return lines.join("\n");
    });
  }

  async openTask(it) {
    const file = this.app.vault.getAbstractFileByPath(it.path);
    if (!file) return;
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file, { eState: { line: it.line } });
  }

  isRunning() {
    return typeof this.data.startedAt === "number";
  }

  stats() {
    const days = Object.assign({}, this.data.days);
    if (this.isRunning()) addSpan(days, this.data.startedAt, Date.now());
    return computeStats(days, Date.now());
  }

  async toggle() {
    if (this.isRunning()) {
      const start = this.data.startedAt;
      const end = Date.now();
      this.data.startedAt = null;
      addSpan(this.data.days, start, end);
      new Notice(`Study session saved: ${fmtMinutes((end - start) / 60000)}`);
    } else {
      this.data.startedAt = Date.now();
      new Notice("Study timer started");
    }
    await this.saveData(this.data);
    this.tick();
    this.refreshCalendars();
  }

  async discard() {
    this.data.startedAt = null;
    await this.saveData(this.data);
    new Notice("Running session discarded");
    this.tick();
  }

  tick() {
    if (this.isRunning()) {
      this.bar.setText(`⏸ ${fmtClock(Date.now() - this.data.startedAt)}`);
    } else {
      this.bar.setText(`▶ Study · ${fmtMinutes(this.stats().today)} today`);
    }
    for (const v of this.views) v.render();
    const now = dayKey(new Date());
    if (now !== this.lastDay) {
      this.lastDay = now;
      for (const c of this.calendars) {
        const n = new Date();
        c.selected = now;
        c.month = new Date(n.getFullYear(), n.getMonth(), 1);
      }
      this.refreshCalendars();
    }
  }
};

module.exports.__test = { addSpan, computeStats, fmtMinutes, fmtClock, dayKey, parseTasks, indexByDay, parseOptions };
