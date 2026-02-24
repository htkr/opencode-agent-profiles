#!/usr/bin/env node
/**
 * Phase 1 minimal stub for Colab UI control.
 * 実ブラウザ操作は次フェーズで Playwright MCP に置き換える。
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
    "Usage: scripts/colab_control_playwright.ts <start|resume|stop> --input-json '<json>'"
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
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input-json") {
      inputJson = argv[++i] || "";
    } else if (a === "-h" || a === "--help") {
      usage();
      process.exit(0);
    } else {
      console.error(`ERROR: unknown arg: ${a}`);
      usage();
      process.exit(1);
    }
  }
  if (!inputJson) {
    console.error("ERROR: --input-json is required");
    process.exit(1);
  }
  return { mode, inputJson };
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

async function openAndInspectColab(input, mode, diagnosticsDir) {
  const { chromium } = require("playwright");
  const headless = input.headed === false;
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  let step = "launch";
  try {
    await page.goto(input.notebook_url, { waitUntil: "domcontentloaded", timeout: input.timeout_ms || 60000 });
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

    // Phase 2: 実行ボタン押下とセル実行はここに実装する。現段階では探索結果を返す。
    await captureDiagnostics(page, diagnosticsDir, {
      step: "page_loaded",
      title,
      current_url: currentUrl,
      connect_button_visible: connectVisible,
      cell_tag_hits: cellTagHits,
      mode,
    });

    return {
      currentUrl,
      connectVisible,
      cellTagHits,
      pageTitle: title,
      step,
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
    await browser.close().catch(() => {});
  }
}

function buildStubResponse(mode, input, diagnosticsDir, runtimeMeta = null) {
  const markers = {};
  let phase = "training";
  let lastSuccessCellTag = "AGENT_TRAIN_RESUME";

  if (mode === "stop") {
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
    stub: true,
    runtime_meta: runtimeMeta,
  };
}

function main() {
  try {
    const { mode, inputJson } = parseArgs(process.argv);
    const input = JSON.parse(inputJson);
    validateInput(input, mode);
    const diagnosticsDir = createDiagnostics(input.diag_dir, mode, input);
    (async () => {
      let runtimeMeta = null;
      if (!process.env.COLAB_CONTROL_FORCE_STUB) {
        try {
          runtimeMeta = await openAndInspectColab(input, mode, diagnosticsDir);
        } catch (e) {
          // Playwright未導入/認証不足/UI変動などで失敗しても診断を残して返す。
          const msg = e && e.message ? e.message : String(e);
          await captureDiagnostics(null, diagnosticsDir, {
            step: "open_and_inspect_failed",
            error: msg,
            mode,
          });
          process.stdout.write(
            JSON.stringify({
              ok: false,
              phase: "error",
              markers: {},
              diagnostics_dir: diagnosticsDir,
              current_url: input.notebook_url,
              error: msg,
              stub: false,
            })
          );
          process.exit(1);
          return;
        }
      }
      const result = buildStubResponse(mode, input, diagnosticsDir, runtimeMeta);
      process.stdout.write(JSON.stringify(result));
    })().catch((e) => {
      const msg = e && e.message ? e.message : String(e);
      process.stdout.write(
        JSON.stringify({
          ok: false,
          phase: "error",
          markers: {},
          diagnostics_dir: null,
          current_url: input.notebook_url ?? null,
          error: msg,
        })
      );
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
