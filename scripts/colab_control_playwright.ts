#!/usr/bin/env node
/**
 * Colab UI control via Playwright CLI (local script).
 * 実ブラウザ操作の主軸は CLI。MCP は補助診断に留める。
 * 現時点では:
 * - 入力検証
 * - 診断ディレクトリ作成
 * - 診断メタ情報出力
 * - 機械可読なJSONレスポンス（stub）
 */

const fs = require("fs");
const path = require("path");

function usage() {
  console.error(
    "Usage: scripts/colab_control_playwright.ts <start|resume|stop> (--input-json '<json>' | --input-file path) [--output-file path] [--user-data-dir path] [--browser-channel chrome|chromium] [--timeout-ms ms] [--force-stub]"
  );
}

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function writeText(p, text) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, text, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  if (argv.length < 3) {
    usage();
    process.exit(1);
  }
  const mode = argv[2];
  if (!["start", "resume", "stop"].includes(mode)) {
    console.error(`ERROR: invalid mode: ${mode}`);
    usage();
    process.exit(1);
  }
  let inputJson = "";
  let inputFile = "";
  let outputFile = "";
  let userDataDir = "";
  let browserChannel = "chromium";
  let timeoutMs = "";
  let forceStub = false;
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input-json") {
      inputJson = argv[++i] || "";
    } else if (a === "--input-file") {
      inputFile = argv[++i] || "";
    } else if (a === "--output-file") {
      outputFile = argv[++i] || "";
    } else if (a === "--user-data-dir") {
      userDataDir = argv[++i] || "";
    } else if (a === "--browser-channel") {
      browserChannel = argv[++i] || "";
    } else if (a === "--timeout-ms") {
      timeoutMs = argv[++i] || "";
    } else if (a === "--force-stub") {
      forceStub = true;
    } else if (a === "-h" || a === "--help") {
      usage();
      process.exit(0);
    } else {
      console.error(`ERROR: unknown arg: ${a}`);
      usage();
      process.exit(1);
    }
  }
  if (!!inputJson === !!inputFile) {
    console.error("ERROR: specify exactly one of --input-json or --input-file");
    process.exit(1);
  }
  if (!["chrome", "chromium"].includes(browserChannel)) {
    console.error("ERROR: --browser-channel must be chrome or chromium");
    process.exit(1);
  }
  return { mode, inputJson, inputFile, outputFile, userDataDir, browserChannel, timeoutMs, forceStub };
}

function validateInput(input, mode) {
  const required = ["notebook_url", "state_dir", "diag_dir", "phase"];
  for (const k of required) {
    if (!input[k] || String(input[k]).trim() === "") {
      throw new Error(`missing required input key: ${k}`);
    }
  }
  if (mode !== "stop") {
    if (!input.run_id) throw new Error("missing required input key: run_id");
  }
  if (!Array.isArray(input.cell_tags)) {
    throw new Error("cell_tags must be array");
  }
}

function loadInput(parsed) {
  if (parsed.inputFile) {
    return JSON.parse(fs.readFileSync(parsed.inputFile, "utf8"));
  }
  return JSON.parse(parsed.inputJson);
}

function createDiagnostics(diagRoot, mode, input) {
  const stamp = isoNow().replace(/[:]/g, "").replace("T", "_").replace("Z", "");
  const dir = path.join(diagRoot, `${stamp}_${mode}`);
  mkdirp(dir);
  writeJson(path.join(dir, "meta.json"), {
    mode,
    timestamp: isoNow(),
    current_url: input.notebook_url,
    step: "stub_initialized",
    note: "Phase 1 stub. No browser automation executed yet.",
  });
  fs.writeFileSync(
    path.join(dir, "README.txt"),
    "Phase 1 stub diagnostics. Playwright MCP integration pending.\n",
    "utf8"
  );
  return dir;
}

async function captureDiagnostics(page, diagnosticsDir, metaPatch = {}) {
  const metaPath = path.join(diagnosticsDir, "meta.json");
  let meta = {};
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (_) {}
  const nextMeta = {
    ...meta,
    ...metaPatch,
    captured_at: isoNow(),
  };
  writeJson(metaPath, nextMeta);

  if (!page) return;
  try {
    await page.screenshot({ path: path.join(diagnosticsDir, "screenshot.png"), fullPage: true });
  } catch (_) {}
  try {
    const html = await page.content();
    writeText(path.join(diagnosticsDir, "page.html"), html);
  } catch (_) {}
  try {
    const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
    writeJson(path.join(diagnosticsDir, "accessibility.json"), snapshot);
  } catch (_) {}
}

function parseMarkersFromText(text) {
  const markerNames = ["COLAB_SSH_JSON", "TRAIN_STATUS_JSON", "SYNC_STATUS_JSON"];
  const markers = {};
  for (const marker of markerNames) {
    const pattern = new RegExp(`^${marker}:\\s*(\\{.*\\})\\s*$`, "gm");
    let match;
    let last = null;
    while ((match = pattern.exec(text)) !== null) {
      last = match[1];
    }
    if (last) {
      try {
        markers[marker] = JSON.parse(last);
      } catch (_) {
        // malformed JSON is ignored here; diagnostics keep raw page text
      }
    }
  }
  return markers;
}

async function tryClick(page, candidates, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 2000;
  for (const c of candidates) {
    let locator;
    try {
      if (c.kind === "role") {
        locator = page.getByRole(c.role, { name: c.name });
      } else if (c.kind === "text") {
        locator = page.getByText(c.text, { exact: !!c.exact });
      } else if (c.kind === "selector") {
        locator = page.locator(c.selector);
      } else {
        continue;
      }
      const count = await locator.count().catch(() => 0);
      if (count < 1) continue;
      const first = locator.first();
      await first.waitFor({ state: "visible", timeout: timeoutMs }).catch(() => null);
      await first.click({ timeout: timeoutMs });
      return { clicked: true, candidate: c };
    } catch (_) {
      continue;
    }
  }
  return { clicked: false, candidate: null };
}

async function waitForColabReady(page, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const text = await page.locator("body").innerText().catch(() => "");
    if (/RAM|Disk|Connected|Busy/i.test(text)) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function ensureConnected(page, timeoutMs) {
  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (/RAM|Disk|Connected/i.test(bodyText) && !/Connect to hosted runtime/i.test(bodyText)) {
    return { connected: true, action: "already_connected" };
  }

  const clickRes = await tryClick(
    page,
    [
      { kind: "role", role: "button", name: /connect/i },
      { kind: "text", text: "Connect", exact: false },
      { kind: "selector", selector: "colab-connect-button button" },
      { kind: "selector", selector: "button[aria-label*='Connect']" }
    ],
    { timeoutMs: 3000 }
  );
  if (!clickRes.clicked) {
    return { connected: false, action: "connect_button_not_found" };
  }

  const ready = await waitForColabReady(page, timeoutMs);
  return { connected: ready, action: "clicked_connect", candidate: clickRes.candidate };
}

async function focusCellByTag(page, tag, timeoutMs) {
  const locators = [
    page.getByText(tag, { exact: false }),
    page.locator(`text=${tag}`)
  ];
  for (const locator of locators) {
    try {
      const count = await locator.count().catch(() => 0);
      if (count < 1) continue;
      const node = locator.first();
      await node.scrollIntoViewIfNeeded().catch(() => {});
      await node.click({ timeout: timeoutMs });
      // Colab cell focus sometimes needs secondary click on surrounding cell area.
      await node.click({ timeout: timeoutMs }).catch(() => {});
      return { ok: true };
    } catch (_) {
      continue;
    }
  }
  return { ok: false };
}

async function runFocusedCell(page) {
  // Colab shortcuts: Ctrl+Enter runs current cell, Shift+Enter runs and moves.
  await page.keyboard.press("Control+Enter").catch(async () => {
    await page.keyboard.press("Meta+Enter");
  });
}

async function executeCellsAndCollectMarkers(page, input, mode, diagnosticsDir, timeoutMs) {
  const executed = [];
  let markers = {};
  const pageTexts = [];

  for (const tag of input.cell_tags || []) {
    const focused = await focusCellByTag(page, tag, timeoutMs);
    if (!focused.ok) {
      throw new Error(`cell tag not found or focus failed: ${tag}`);
    }
    await runFocusedCell(page);
    executed.push(tag);
    // Let the output render; exact completion state is notebook dependent.
    await sleep(1200);

    // Re-snapshot principle from skill: refresh observable state after each significant UI change.
    const bodyText = await page.locator("body").innerText().catch(() => "");
    pageTexts.push(`--- after ${tag} ---\n${bodyText}`);
    markers = { ...markers, ...parseMarkersFromText(bodyText) };
  }

  writeText(path.join(diagnosticsDir, "page_markers_scan.txt"), pageTexts.join("\n\n"));
  let phase = "training";
  if (mode === "stop") {
    phase = "stopped";
  } else if (markers.COLAB_SSH_JSON && !markers.TRAIN_STATUS_JSON) {
    phase = "ssh_ready";
  } else if (markers.TRAIN_STATUS_JSON) {
    phase = markers.TRAIN_STATUS_JSON.phase || "training";
  }
  const lastSuccessCellTag = executed.length ? executed[executed.length - 1] : null;

  return { markers, executed, phase, lastSuccessCellTag };
}

async function openAndInspectColab(input, mode, diagnosticsDir, runtimeOpts) {
  const { chromium } = require("playwright");
  const headless = input.headed === false;
  const launchMode = runtimeOpts.browserChannel === "chrome" ? "persistent" : "ephemeral";
  let browser = null;
  let context = null;
  let page = null;
  if (runtimeOpts.userDataDir) {
    context = await chromium.launchPersistentContext(runtimeOpts.userDataDir, {
      headless,
      channel: runtimeOpts.browserChannel === "chrome" ? "chrome" : undefined,
    });
    page = context.pages()[0] || (await context.newPage());
  } else {
    browser = await chromium.launch({
      headless,
      channel: runtimeOpts.browserChannel === "chrome" ? "chrome" : undefined,
    });
    context = await browser.newContext();
    page = await context.newPage();
  }

  let step = "launch";
  try {
    await page.goto(input.notebook_url, {
      waitUntil: "domcontentloaded",
      timeout: runtimeOpts.timeoutMs || input.timeout_ms || 60000,
    });
    step = "loaded";
    await page.waitForTimeout(1000);

    const title = await page.title();
    const currentUrl = page.url();
    const connectVisible =
      (await page.getByRole("button", { name: /connect/i }).count().catch(() => 0)) > 0;

    let cellTagHits = [];
    if (Array.isArray(input.cell_tags) && input.cell_tags.length > 0) {
      for (const tag of input.cell_tags) {
        const count = await page.getByText(tag, { exact: false }).count().catch(() => 0);
        cellTagHits.push({ tag, count });
      }
    }

    const connectResult = await ensureConnected(page, runtimeOpts.timeoutMs || input.timeout_ms || 60000);
    if (!connectResult.connected) {
      throw new Error(`failed to connect runtime: ${connectResult.action}`);
    }

    const execResult = await executeCellsAndCollectMarkers(
      page,
      input,
      mode,
      diagnosticsDir,
      Math.min(runtimeOpts.timeoutMs || input.timeout_ms || 60000, 5000)
    );

    await captureDiagnostics(page, diagnosticsDir, {
      step: "page_loaded_and_cells_executed",
      title,
      current_url: currentUrl,
      connect_button_visible: connectVisible,
      cell_tag_hits: cellTagHits,
      connect_result: connectResult,
      executed_cells: execResult.executed,
      detected_marker_keys: Object.keys(execResult.markers),
      mode,
      browser_channel: runtimeOpts.browserChannel,
      user_data_dir: runtimeOpts.userDataDir || null,
      launch_mode: launchMode,
    });

    return {
      currentUrl,
      connectVisible,
      cellTagHits,
      pageTitle: title,
      step,
      markers: execResult.markers,
      phase: execResult.phase,
      lastSuccessCellTag: execResult.lastSuccessCellTag,
      connectResult,
      browserChannel: runtimeOpts.browserChannel,
      userDataDir: runtimeOpts.userDataDir || null,
    };
  } catch (e) {
    await captureDiagnostics(page, diagnosticsDir, {
      step,
      error: e && e.message ? e.message : String(e),
      mode,
    });
    throw e;
  } finally {
    await context.close().catch(() => {});
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

function buildResponse(mode, input, diagnosticsDir, runtimeMeta = null, forceStub = false) {
  let markers = {};
  let phase = "training";
  let lastSuccessCellTag = "AGENT_TRAIN_RESUME";

  if (runtimeMeta && runtimeMeta.markers && Object.keys(runtimeMeta.markers).length > 0) {
    markers = runtimeMeta.markers;
    phase = runtimeMeta.phase || (mode === "stop" ? "stopped" : "training");
    lastSuccessCellTag = runtimeMeta.lastSuccessCellTag || lastSuccessCellTag;
  } else if (mode === "stop") {
    phase = "stopped";
    lastSuccessCellTag = "AGENT_SYNC_AND_STOP";
    markers.SYNC_STATUS_JSON = { phase: "sync_done", uploaded: [] };
  } else {
    markers.COLAB_SSH_JSON = {
      version: 1,
      hostname: "stub.example.invalid",
      ssh_user: "root",
      proxy_command: "cloudflared access ssh --hostname %h",
      ssh_key_path_hint: "~/.ssh/solafune_colab",
      source_notebook_url: input.notebook_url,
      generated_at: isoNow(),
    };
    markers.TRAIN_STATUS_JSON = {
      phase: "training",
      run_id: input.run_id,
      resume_from: null,
      note: "stub response",
    };
  }

  return {
    ok: true,
    phase,
    markers,
    last_success_cell_tag: lastSuccessCellTag,
    diagnostics_dir: diagnosticsDir,
    current_url: (runtimeMeta && runtimeMeta.currentUrl) || input.notebook_url,
    error: null,
    stub: forceStub || !(runtimeMeta && runtimeMeta.markers && Object.keys(runtimeMeta.markers).length > 0),
    runtime_meta: runtimeMeta,
  };
}

function main() {
  try {
    const parsed = parseArgs(process.argv);
    const { mode } = parsed;
    const input = loadInput(parsed);
    validateInput(input, mode);
    const diagnosticsDir = createDiagnostics(input.diag_dir, mode, input);
    (async () => {
      let runtimeMeta = null;
      if (!(parsed.forceStub || process.env.COLAB_CONTROL_FORCE_STUB)) {
        try {
          runtimeMeta = await openAndInspectColab(input, mode, diagnosticsDir, {
            userDataDir: parsed.userDataDir,
            browserChannel: parsed.browserChannel,
            timeoutMs: parsed.timeoutMs ? Number(parsed.timeoutMs) : undefined,
          });
        } catch (e) {
          // Playwright未導入/認証不足/UI変動などで失敗しても診断を残して返す。
          const msg = e && e.message ? e.message : String(e);
          await captureDiagnostics(null, diagnosticsDir, {
            step: "open_and_inspect_failed",
            error: msg,
            mode,
          });
          const payload = {
            ok: false,
            phase: "error",
            markers: {},
            diagnostics_dir: diagnosticsDir,
            current_url: input.notebook_url,
            error: msg,
            stub: false,
          };
          if (parsed.outputFile) writeJson(parsed.outputFile, payload);
          process.stdout.write(JSON.stringify(payload));
          process.exit(1);
          return;
        }
      }
      const result = buildResponse(mode, input, diagnosticsDir, runtimeMeta, !!(parsed.forceStub || process.env.COLAB_CONTROL_FORCE_STUB));
      if (parsed.outputFile) writeJson(parsed.outputFile, result);
      process.stdout.write(JSON.stringify(result));
    })().catch((e) => {
      const msg = e && e.message ? e.message : String(e);
      const payload = {
        ok: false,
        phase: "error",
        markers: {},
        diagnostics_dir: null,
        current_url: input.notebook_url ?? null,
        error: msg,
      };
      if (parsed.outputFile) writeJson(parsed.outputFile, payload);
      process.stdout.write(JSON.stringify(payload));
      process.exit(1);
    });
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    process.stdout.write(
      JSON.stringify({
        ok: false,
        phase: "error",
        markers: {},
        diagnostics_dir: null,
        current_url: null,
        error: msg,
      })
    );
    process.exit(1);
  }
}

main();
