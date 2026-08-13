
const STATUS_LABEL = {
    planned: "Planned",
    in_progress: "In Progress",
    done: "Done",
    todo: "To Do",
};

function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text) node.textContent = opts.text;
    if (opts.html) node.innerHTML = opts.html;
    for (const child of children) if (child) node.appendChild(child);
    return node;
}

async function loadYaml(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const text = await res.text();
    return jsyaml.load(text);
}

function renderError(container, path, err) {
    container.appendChild(
        el("div", {
            class: "block",
            html: `<p style="color:var(--high);font-family:var(--mono);font-size:13px;">
        Couldn't load <strong>${path}</strong>. ${err.message || err}
      </p>`,
        })
    );
}

/* ---------- Vision page ---------- */

async function renderVision() {
    const main = document.getElementById("main");
    try {
        const data = await loadYaml("data/vision.yml");
        const s = data.server || {};

        const hero = el("div", { class: "hero" }, [


            el("p", { class: "tagline", text: s.tagline || "" }),
            s.motd
                ? el("p", { class: "motd", text: `${s.version || ""} — ${s.motd}` })
                : null,
        ]);
        main.appendChild(hero);

        if (data.mission) {
            main.appendChild(
                el("section", { class: "block" }, [
                    el("p", { class: "eyebrow", text: "mission" }),
                    el("p", { class: "mission", text: data.mission.trim() }),
                ])
            );
        }

        if (Array.isArray(data.pillars)) {
            const grid = el("div", { class: "pillars" });
            for (const p of data.pillars) {
                grid.appendChild(
                    el("div", { class: "pillar" }, [
                        el("h3", { text: p.title }),
                        el("p", { text: (p.body || "").trim() }),
                    ])
                );
            }
            main.appendChild(
                el("section", { class: "block" }, [
                    el("p", { class: "eyebrow", text: "pillars" }),
                    grid,
                ])
            );
        }

        if (Array.isArray(data.stats)) {
            const grid = el("div", { class: "stats" });
            for (const stat of data.stats) {
                grid.appendChild(
                    el("div", { class: "stat" }, [
                        el("div", { class: "value", text: stat.value }),
                        el("div", { class: "label", text: stat.label }),
                    ])
                );
            }
            main.appendChild(
                el("section", { class: "block" }, [
                    el("p", { class: "eyebrow", text: "status" }),
                    grid,
                ])
            );
        }

        if (data.footer_note) {
            document.getElementById("footer-note").textContent = data.footer_note;
        }
    } catch (err) {
        renderError(main, "data/vision.yml", err);
    }
}

/* ---------- Roadmap page ---------- */

async function renderRoadmap() {
    const main = document.getElementById("main");
    try {
        const data = await loadYaml("data/roadmap.yml");
        const timeline = el("div", { class: "timeline" });

        for (const phase of data.phases || []) {
            const status = phase.status || "planned";
            const items = el("ul", { class: "phase-items" });
            for (const item of phase.items || []) {
                items.appendChild(el("li", { text: item }));
            }
            timeline.appendChild(
                el("div", { class: `phase ${status}` }, [
                    el("div", { class: "phase-head" }, [
                        el("h2", { text: phase.name }),
                        el("span", {
                            class: `status-tag ${status}`,
                            text: STATUS_LABEL[status] || status,
                        }),
                        phase.timeframe
                            ? el("span", { class: "phase-time", text: phase.timeframe })
                            : null,
                    ]),
                    items,
                ])
            );
        }

        main.appendChild(
            el("section", { class: "block" }, [

                timeline,
            ])
        );

        if (data.footer_note) {
            document.getElementById("footer-note").textContent = data.footer_note;
        }
    } catch (err) {
        renderError(main, "data/roadmap.yml", err);
    }
}

/* ---------- Tasks page ---------- */

async function renderTasks() {
    const main = document.getElementById("main");
    try {
        const data = await loadYaml("data/tasks.yml");
        const wrap = el("section", { class: "block" }, [

        ]);

        for (const cat of data.categories || []) {
            const catBlock = el("div", { class: "task-category" }, [
                el("h2", { text: cat.name }),
            ]);
            for (const task of cat.tasks || []) {
                const status = task.status || "todo";
                const priority = task.priority || "medium";
                catBlock.appendChild(
                    el("div", { class: `task-row ${status}` }, [
                        el("div", { class: "task-check" }),
                        el("div", { class: "task-text", text: task.text }),
                        el("span", {
                            class: `priority-tag ${priority}`,
                            text: priority,
                        }),
                    ])
                );
            }
            wrap.appendChild(catBlock);
        }

        main.appendChild(wrap);

        if (data.footer_note) {
            document.getElementById("footer-note").textContent = data.footer_note;
        }
    } catch (err) {
        renderError(main, "data/tasks.yml", err);
    }
}

/* ---------- Dispatch ---------- */

const page = document.body.dataset.page;
if (page === "vision") renderVision();
if (page === "roadmap") renderRoadmap();
if (page === "tasks") renderTasks();
if (page === "rules") renderRules();

/* ---------- Rules page ---------- */

async function renderRules() {
    const main = document.getElementById("main");
    try {
        const data = await loadYaml("data/rules.yml");
        const wrap = el("section", { class: "block" }, []);

        (data.categories || []).forEach((cat, catIdx) => {
            const list = el("div", { class: "rules-list" });
            (cat.rules || []).forEach((rule, i) => {
                const head = el("div", { class: "rule-row-head" }, [
                    el("span", { class: "rule-index", text: String(i + 1).padStart(2, "0") }),
                    el("span", { class: "rule-text", text: rule.text }),
                    rule.severity
                        ? el("span", { class: `priority-tag ${rule.severity}`, text: rule.severity })
                        : null,
                ]);
                const row = el("div", { class: "rule-row" }, [head]);
                if (rule.detail) {
                    row.classList.add("expandable", "open");
                    row.appendChild(el("p", { class: "rule-detail", text: rule.detail.trim() }));
                    head.addEventListener("click", () => row.classList.toggle("open"));
                }
                list.appendChild(row);
            });

            const details = el("details", { class: "rules-category" }, [
                el("summary", {}, [
                    el("span", { class: "rules-category-name", text: cat.name }),
                    el("span", { class: "rules-category-count", text: `${(cat.rules || []).length} rules` }),
                ]),
                list,
            ]);
            details.open = catIdx === 0;
            details.open = true;
            wrap.appendChild(details);
        });

        main.appendChild(wrap);
        if (data.footer_note) {
            document.getElementById("footer-note").textContent = data.footer_note;
        }
    } catch (err) {
        renderError(main, "data/rules.yml", err);
    }
}