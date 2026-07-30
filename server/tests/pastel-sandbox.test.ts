import test from "node:test";
import assert from "node:assert/strict";

const GOOD_FILES: Record<string, string> = {
  "src/styles.css": `:root { --color-background: #fff; --color-text: #111; --color-accent: #c2553a; --font-body: "Inter", sans-serif; }
* { box-sizing: border-box; margin: 0; padding: 0; }`,
  "src/components/Button.jsx": `export default function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-[10px]">
      {children}
    </button>
  );
}`,
  "src/components/Navbar.jsx": `import Button from "./Button.jsx";
export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-8 py-4">
      <span>Logo</span>
      <Button>Sign in</Button>
    </header>
  );
}`,
  "src/screens/Home.jsx": `import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <main className="px-8 py-24">
        <h1 className="text-[48px] font-semibold">A real headline about the product</h1>
        <p className="mt-4 text-[16px]">Specific, concrete copy that describes the actual thing being sold.</p>
        <Button>See pricing</Button>
      </main>
    </div>
  );
}`,
};

test("sandbox: a valid project verifies and produces bundles for every screen", async () => {
  const { verifyProject } = await import("../lib/pastel-agent/sandbox");
  const result = await verifyProject(GOOD_FILES);
  assert.ok(
    result.ok,
    `expected ok, got errors: ${JSON.stringify(result.errors, null, 2)}`,
  );
  assert.ok(result.bundles.Home, "should have a browser bundle for Home");
  assert.ok(result.bundles.Home.includes("createRoot"), "bundle mounts the app");
  assert.ok(result.bundles.Home.length > 10000, "bundle includes React (is self-contained)");
});

test("sandbox: syntax errors are reported with file and message", async () => {
  const { verifyProject } = await import("../lib/pastel-agent/sandbox");
  const broken = {
    ...GOOD_FILES,
    "src/screens/Home.jsx": `export default function Home() {
  return <div><span>unclosed</div>;
}`,
  };
  const result = await verifyProject(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0, "should report errors");
  assert.ok(
    result.errors.some((e) => e.file?.includes("Home.jsx")),
    `error should name the file: ${JSON.stringify(result.errors)}`,
  );
});

test("sandbox: unresolved imports are reported", async () => {
  const { verifyProject } = await import("../lib/pastel-agent/sandbox");
  const broken = {
    ...GOOD_FILES,
    "src/screens/Home.jsx": `import Sidebar from "../components/Sidebar.jsx";
export default function Home() { return <div><Sidebar /></div>; }`,
  };
  const result = await verifyProject(broken);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /Could not resolve|Sidebar/.test(e.message)),
    `should report the missing import: ${JSON.stringify(result.errors)}`,
  );
});

test("sandbox: runtime errors (undefined component) are caught by smoke render", async () => {
  const { verifyProject } = await import("../lib/pastel-agent/sandbox");
  const broken = {
    ...GOOD_FILES,
    "src/screens/Home.jsx": `export default function Home() {
  const data = null;
  return <div>{data.map((x) => <span key={x}>{x}</span>)}</div>;
}`,
  };
  const result = await verifyProject(broken);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /Runtime error|map/.test(e.message)),
    `should catch the runtime failure: ${JSON.stringify(result.errors)}`,
  );
});

test("sandbox: markdown fences and prose are stripped before compiling", async () => {
  const { verifyProject, sanitizeFileContent } = await import("../lib/pastel-agent/sandbox");

  const fenced = "```jsx\nconst x = 1;\nexport default x;\n```";
  assert.equal(sanitizeFileContent(fenced).startsWith("const x = 1;"), true);

  const withProse = "Here is the code you asked for:\n\nimport Button from \"./Button.jsx\";\nconst x = 1;";
  assert.ok(sanitizeFileContent(withProse).startsWith("import Button"));

  const fencedProject = {
    ...GOOD_FILES,
    "src/screens/Home.jsx": "```jsx\n" + GOOD_FILES["src/screens/Home.jsx"] + "\n```",
  };
  const result = await verifyProject(fencedProject);
  assert.ok(result.ok, `fenced code should still verify: ${JSON.stringify(result.errors)}`);
});

test("sandbox: projects with no screens fail cleanly", async () => {
  const { verifyProject } = await import("../lib/pastel-agent/sandbox");
  const result = await verifyProject({ "src/styles.css": ":root{}" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /No screen files/.test(e.message)));
});

test("sandbox: screens using useState interactivity verify fine", async () => {
  const { verifyProject } = await import("../lib/pastel-agent/sandbox");
  const files = {
    ...GOOD_FILES,
    "src/screens/Home.jsx": `import { useState } from "react";
export default function Home() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen p-8">
      <button onClick={() => setOpen(!open)} className="px-4 py-2 border">Menu</button>
      {open && <nav className="mt-4 p-4 border rounded">Navigation items here</nav>}
    </div>
  );
}`,
  };
  const result = await verifyProject(files);
  assert.ok(result.ok, `useState screen should verify: ${JSON.stringify(result.errors)}`);
});
