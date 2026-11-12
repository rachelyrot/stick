// Builds marketing/ad.html (self-contained) and exports poster PNG + clip MP4 with headless Chrome.
// Usage: node marketing/build.mjs [--export]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "marketing");
const ids = ["bottle", "jar", "mug", "kraft-box"];
const images = Object.fromEntries(ids.map((id) => [id, "data:image/svg+xml;base64," + readFileSync(path.join(root, "public/mockups", id + ".svg")).toString("base64")]));
const html = readFileSync(path.join(out, "ad-template.html"), "utf8").replace("__IMAGES__", JSON.stringify(images));
const htmlPath = path.join(out, "ad.html");
writeFileSync(htmlPath, html);
console.log("wrote", htmlPath);

if (process.argv.includes("--export")) {
  const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const prof = path.join(process.env.TEMP, "stick-chrome-prof");
  mkdirSync(prof, { recursive: true });
  const proc = spawn(chrome, ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${prof}`, "--window-size=1080,1920", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank"], { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 40 && !ws; i++) {
    await sleep(300);
    try {
      const list = await (await fetch("http://127.0.0.1:9333/json")).json();
      const page = list.find((p) => p.type === "page");
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
  }
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

  await send("Page.enable");
  await send("Page.navigate", { url: pathToFileURL(htmlPath).href + "#export" });
  for (let i = 0; i < 100 && !(await evalJs("!!window.ready")); i++) await sleep(200);

  const png = await evalJs(`document.getElementById("poster").toDataURL("image/png").split(",")[1]`);
  writeFileSync(path.join(out, "stick-ad-post-1080x1350.png"), Buffer.from(png, "base64"));
  const cover = await evalJs(`(drawClip(13.6), document.getElementById("clip").toDataURL("image/png").split(",")[1])`);
  writeFileSync(path.join(out, "stick-clip-cover-1080x1920.png"), Buffer.from(cover, "base64"));
  console.log("posters saved; recording clip (15s)...");
  const vid = await evalJs("recordClip(30)");
  const ext = vid.mime.includes("mp4") ? "mp4" : "webm";
  writeFileSync(path.join(out, `stick-clip-1080x1920.${ext}`), Buffer.from(vid.b64, "base64"));
  console.log("clip saved as", ext, vid.mime);
  ws.close();
  proc.kill();
}
