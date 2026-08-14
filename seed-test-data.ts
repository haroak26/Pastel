import { storage } from "./server/storage";
import { hashPassword } from "./server/auth";
import { createRun, persistDoc, persistFile, updateRun, mergeManifest, emitEvent } from "./server/lib/maxi-agent/run-store";
import type { BrandKit } from "./server/lib/maxi-agent/types";

const email = "canvas-test@example.com";
const password = "TestPass123!";

async function main() {
  let user = await storage.getUserByEmail(email);
  if (!user) {
    const hashed = await hashPassword(password);
    user = await storage.createUser({
      username: "canvastest",
      email,
      password: hashed,
      emailVerified: true,
      displayName: "Canvas Test",
    });
    console.log("created user", user.id);
  } else {
    console.log("existing user", user.id);
  }

  const workspaces = await storage.listWorkspaces(user.id);
  let ws = workspaces[0];
  if (!ws) {
    ws = await storage.createWorkspace(user.id, { name: "Test WS", slug: `test-${Date.now().toString(36)}` });
    console.log("created workspace", ws.id);
  }

  let project = (await storage.listProjects(ws.id))?.find((p) => p.name === "Canvas Test Project");
  if (!project) {
    project = await storage.createProject(user.id, ws.id, { name: "Canvas Test Project", description: "test" });
    console.log("created project", project.id);
  } else {
    console.log("existing project", project.id);
  }

  const latest = await (await import("./server/lib/maxi-agent/run-store")).getLatestRunForProject(project.id);
  let runId: string;
  if (latest && latest.run.status === "done") {
    runId = latest.run.id;
    console.log("reusing run", runId);
  } else {
    const run = await createRun({ projectId: project.id, userId: user.id, prompt: "Test canvas interactions", answers: {} });
    runId = run.id;
    console.log("created run", runId);
  }

  const screens = ["home", "pricing"];
  const brandKit: BrandKit = {
    colors: { Primary: "#0B99FF", Secondary: "#7C3AED", Accent: "#F59E0B", Background: "#FFFFFF", Text: "#1A1A1A" },
    fonts: { Heading: "Inter", Subheading: "Inter", Body: "Inter" },
    sizes: { H1: "32px", H2: "24px", H3: "20px", Body: "14px", Small: "12px" },
    radius: { Small: 4, Medium: 8, Large: 12, "Extra Large": 20 },
  };

  await mergeManifest(runId, {
    screens,
    brandKit,
    failedScreens: [],
    phases: {
      brief: "done", wireframe: "done", content: "done", architecture: "done",
      components: "done", screens: "done", review: "done", tokens: "done", motion: "done", assemble: "done", build: "done", present: "done",
    },
  });
  await updateRun(runId, { status: "done", title: "Canvas Test Project" });

  const homeBundle = `
(function () {
  window.__maxiMounted = true;
  var root = document.getElementById("root");
  var html = [
    '<header style="display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:#fff;border-bottom:1px solid #eee">',
    '<div style="font-weight:700;font-size:18px;color:#1A1A1A">Pastel</div>',
    '<nav style="display:flex;gap:20px;color:#555;font-size:13px">',
    '<span>Features</span><span>Pricing</span><span>Docs</span><span>Contact</span>',
    '</nav>',
    '<button style="background:#0B99FF;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px">Get Started</button>',
    '</header>',
    '<section style="padding:72px 32px;text-align:center;background:linear-gradient(180deg,#f8fbff,#fff)">',
    '<h1 style="font-size:40px;color:#1A1A1A;margin-bottom:12px">Build beautiful software</h1>',
    '<p style="font-size:16px;color:#666;max-width:560px;margin:0 auto 28px">Design, prototype and ship interfaces your users love — all from a single canvas.</p>',
    '<div style="display:flex;gap:12px;justify-content:center">',
    '<button style="background:#0B99FF;color:#fff;border:none;border-radius:8px;padding:12px 24px;font-size:14px">Start building</button>',
    '<button style="background:#fff;color:#1A1A1A;border:1px solid #ddd;border-radius:8px;padding:12px 24px;font-size:14px">View demo</button>',
    '</div>',
    '</section>',
    '<section style="display:flex;gap:24px;padding:48px 32px">',
    '<div style="flex:1;border:1px solid #eee;border-radius:12px;padding:24px;text-align:center"><h3 style="font-size:18px;color:#1A1A1A">Fast</h3><p style="font-size:13px;color:#777">Lightning-quick renders</p></div>',
    '<div style="flex:1;border:1px solid #eee;border-radius:12px;padding:24px;text-align:center"><h3 style="font-size:18px;color:#1A1A1A">Simple</h3><p style="font-size:13px;color:#777">No config required</p></div>',
    '<div style="flex:1;border:1px solid #eee;border-radius:12px;padding:24px;text-align:center"><h3 style="font-size:18px;color:#1A1A1A">Flexible</h3><p style="font-size:13px;color:#777">Anything you can imagine</p></div>',
    '</section>',
    '<footer style="padding:24px 32px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee">© 2026 Pastel</footer>'
  ].join("");
  root.innerHTML = html;
})();
`;

  const pricingBundle = `
(function () {
  window.__maxiMounted = true;
  var root = document.getElementById("root");
  var html = [
    '<header style="display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:#fff;border-bottom:1px solid #eee">',
    '<div style="font-weight:700;font-size:18px;color:#1A1A1A">Pastel</div>',
    '<nav style="display:flex;gap:20px;color:#555;font-size:13px">',
    '<span>Features</span><span style="color:#0B99FF">Pricing</span><span>Docs</span><span>Contact</span>',
    '</nav>',
    '</header>',
    '<section style="padding:56px 32px;text-align:center">',
    '<h1 style="font-size:32px;color:#1A1A1A">Simple pricing</h1>',
    '<p style="font-size:14px;color:#666;margin:8px 0 32px">Start free, upgrade when you grow.</p>',
    '<div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap">',
    '<div style="width:240px;border:1px solid #eee;border-radius:12px;padding:24px"><h3 style="font-size:16px">Free</h3><p style="font-size:28px;font-weight:700">$0</p><p style="font-size:12px;color:#777">For side projects</p><button style="margin-top:16px;width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff">Get started</button></div>',
    '<div style="width:240px;border:1px solid #0B99FF;border-radius:12px;padding:24px"><h3 style="font-size:16px">Pro</h3><p style="font-size:28px;font-weight:700">$19</p><p style="font-size:12px;color:#777">For professionals</p><button style="margin-top:16px;width:100%;padding:10px;border:none;border-radius:8px;background:#0B99FF;color:#fff">Get started</button></div>',
    '<div style="width:240px;border:1px solid #eee;border-radius:12px;padding:24px"><h3 style="font-size:16px">Team</h3><p style="font-size:28px;font-weight:700">$49</p><p style="font-size:12px;color:#777">For teams</p><button style="margin-top:16px;width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff">Get started</button></div>',
    '</div>',
    '</section>'
  ].join("");
  root.innerHTML = html;
})();
`;

  const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', -apple-system, sans-serif; background: #fff; }
`;

  await persistDoc(runId, { path: "docs/screens/home.md", title: "Home", kind: "screen-spec", content: "# Home screen" });
  await persistDoc(runId, { path: "docs/screens/pricing.md", title: "Pricing", kind: "screen-spec", content: "# Pricing screen" });
  await persistDoc(runId, { path: "docs/brief.md", title: "Brief", kind: "brief", content: "# Brief" });
  await persistFile(runId, { path: ".build/home.js", kind: "build", content: homeBundle });
  await persistFile(runId, { path: ".build/pricing.js", kind: "build", content: pricingBundle });
  await persistFile(runId, { path: "src/styles.css", kind: "source", content: styles });
  await persistFile(runId, { path: "src/components/Header.jsx", kind: "source", content: "export default function Header(){return null}" });
  await persistFile(runId, { path: "src/components/Hero.jsx", kind: "source", content: "export default function Hero(){return null}" });

  for (const p of ["brief", "wireframe", "content", "architecture", "components", "screens", "review", "tokens", "motion", "assemble", "build", "present"]) {
    emitEvent(runId, { type: "phase", phase: p, status: "done" });
  }
  emitEvent(runId, { type: "done", runId });

  console.log("DONE runId=", runId, "projectId=", project.id);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
