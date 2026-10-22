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
    this.registerInterval(window.setInterval(() => this.tick(), 1000));
    this.tick();
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
  }
};

module.exports.__test = { addSpan, computeStats, fmtMinutes, fmtClock, dayKey };
