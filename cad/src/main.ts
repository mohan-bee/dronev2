import "@fontsource-variable/inter";
import "./style.css";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

type Item = { type: string; [key: string]: any };
type Part = {
  id: string;
  label: string;
  detail: string;
  category: string;
  object: T.Group;
  specs: [string, string][];
  base: number;
  explode: number;
};
const icons: Record<string, string> = {
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const icon = (name: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<header><a class="brand" href="/" aria-label="Drone V2 home">${icon("cube")}<strong>drone<span>v2</span></strong></a><span class="header-divider"></span><h1>Assembly studio</h1><span class="revision">Placement revision A</span><a class="source-link" href="https://github.com/mohan-bee/dronev2" target="_blank" rel="noreferrer">Source ${icon("arrow")}</a></header>
<div class="workspace">
<aside class="sidebar" id="sidebar"><div class="panel-title"><h2>Assembly</h2><span id="part-count">—</span></div><p class="side-description">One PCB. Four motors.<br>A tiny flying machine.</p><label class="search"><span>Find a component</span><input id="search" type="search" placeholder="Search parts or reference…"/></label><div class="tree" id="tree" aria-label="Assembly parts"></div><div class="sidebar-bottom"><span class="status-dot"></span> Placement only · unrouted<a href="https://github.com/mohan-bee/dronev2/blob/pcb/compact-placement/ISSUES.md" target="_blank" rel="noreferrer">Open design issues ${icon("arrow")}</a></div></aside>
<main id="stage"><div class="canvas-heading"><div><h2>Quad-X / 80</h2><p>1S microdrone · two-layer PCB frame</p></div><button class="mobile-toggle" id="parts-toggle">${icon("layers")} Parts</button></div><div id="viewport" tabindex="0" role="img" aria-label="Interactive 3D drone assembly. Drag to orbit, scroll to zoom. Use view buttons for keyboard access."></div><div class="view-toolbar" role="group" aria-label="Camera views"><button data-view="iso" class="active">Perspective</button><button data-view="top">Top</button><button data-view="side">Side</button><button data-view="bottom">Bottom</button><button id="reset" aria-label="Reset view">${icon("reset")}</button></div><div class="loading" id="loading" role="status">Building the assembly…</div><div id="view-status" class="view-status" aria-live="polite"></div><div class="canvas-footer"><span>Drag to orbit <i>·</i> Scroll to zoom <i>·</i> Click to inspect</span><span class="scale">10 mm grid</span></div></main>
<aside class="inspector"><div class="panel-title"><h2>Inspect</h2><span>mm</span></div><section id="selection"><div class="part-marker">${icon("cube")}</div><h3>Complete assembly</h3><p>Select a part in the model or the assembly list to see its dimensions and source.</p><dl><dt>Motor diagonal</dt><dd>80 mm</dd><dt>Propeller diameter</dt><dd>46 mm</dd><dt>Nominal prop gap</dt><dd>10.57 mm</dd><dt>Board construction</dt><dd>2 layers / 1 mm</dd></dl></section><section class="control-section"><h3>Explore the build</h3><label class="range-label" for="explode">Exploded view <output id="explode-value">0%</output></label><input id="explode" type="range" min="0" max="100" value="0"/><div class="range-captions"><span>Assembled</span><span>Separated</span></div><label class="toggle"><input id="guards" type="checkbox" checked/><span>Propeller guards</span></label><label class="toggle"><input id="sweeps" type="checkbox"/><span>Propeller sweep discs</span></label><label class="toggle"><input id="keepouts" type="checkbox"/><span>Antenna clearance guide</span></label><label class="toggle"><input id="spin" type="checkbox"/><span>Animate propellers</span></label></section><section class="model-note"><h3>Know what you’re viewing</h3><p>PCB positions come from tscircuit. Main electronics use imported JLCPCB geometry with approximate display colors. Motors, props, battery and printed parts are dimensional concepts.</p><p>Clearance guides are for review. Physical fit and flight performance are unverified.</p></section><button id="export" class="export">${icon("download")} Export assembly GLB</button><a class="drawing-link" href="/pcb/placement.svg" target="_blank">Open PCB placement ${icon("arrow")}</a><a class="drawing-link" href="/pcb/schematic.svg" target="_blank">Open schematic ${icon("arrow")}</a></aside>
</div><footer class="app-footer"><span id="build-info">Loading PCB source…</span><span>DIMENSIONAL STUDY <span class="footer-separator">/</span> NOT FOR MANUFACTURE</span></footer>`;

const $ = <E extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<E>(s)!;
const parts: Part[] = [];
const propRotors: T.Group[] = [];
const root = new T.Group();
root.name = "Drone V2 assembly (millimetres)";
const scene = new T.Scene();
scene.background = new T.Color("#ecede7");
scene.add(root);
let renderer: T.WebGLRenderer;
try {
  renderer = new T.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
} catch {
  $("#loading").innerHTML =
    '3D requires WebGL. <a href="/pcb/placement.svg">Open the PCB drawing</a> or try a browser with graphics acceleration.';
  throw new Error("WebGL unavailable");
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
$("#viewport").append(renderer.domElement);
const camera = new T.PerspectiveCamera(32, 1, 0.1, 1000);
camera.up.set(0, 0, 1);
camera.position.set(125, -155, 145);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.minDistance = 35;
controls.maxDistance = 700;
controls.maxPolarAngle = Math.PI;
controls.update();
scene.add(new T.HemisphereLight(0xffffff, 0x747d64, 2.6));
const sun = new T.DirectionalLight(0xfff7e8, 3.5);
sun.position.set(-60, -70, 140);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -85,
  right: 85,
  top: 85,
  bottom: -85,
  near: 1,
  far: 300,
});
sun.shadow.normalBias = 0.15;
scene.add(sun);
const fill = new T.DirectionalLight(0xffffff, 1.6);
fill.position.set(60, 70, 90);
scene.add(fill);
const floor = new T.Mesh(
  new T.PlaneGeometry(800, 800),
  new T.ShadowMaterial({ opacity: 0.16 }),
);
floor.position.z = -24;
floor.receiveShadow = true;
scene.add(floor);
const grid = new T.GridHelper(300, 30, 0xc4cabe, 0xd8dcd2);
grid.rotation.x = Math.PI / 2;
grid.position.z = -24.1;
(grid.material as T.Material).transparent = true;
(grid.material as T.Material).opacity = 0.52;
scene.add(grid);
const materials = {
  pcb: new T.MeshStandardMaterial({ color: 0x274b35, roughness: 0.62 }),
  gold: new T.MeshStandardMaterial({
    color: 0xd4b66b,
    metalness: 0.72,
    roughness: 0.3,
  }),
  metal: new T.MeshStandardMaterial({
    color: 0xc3c8ca,
    metalness: 0.75,
    roughness: 0.28,
  }),
  black: new T.MeshStandardMaterial({ color: 0x232723, roughness: 0.65 }),
  plastic: new T.MeshStandardMaterial({ color: 0x69775b, roughness: 0.8 }),
  prop: new T.MeshStandardMaterial({ color: 0xe99047, roughness: 0.43 }),
  propBack: new T.MeshStandardMaterial({ color: 0xe8eadf, roughness: 0.45 }),
  battery: new T.MeshStandardMaterial({
    color: 0xb5b8b3,
    metalness: 0.48,
    roughness: 0.5,
  }),
};
function mesh(
  geometry: T.BufferGeometry,
  material: T.Material,
  parent: T.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const o = new T.Mesh(geometry, material);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function box(
  parent: T.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: T.Material,
) {
  return mesh(new T.BoxGeometry(w, h, d), mat, parent, x, y, z);
}
function cylinder(
  parent: T.Object3D,
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: T.Material,
) {
  const m = mesh(new T.CylinderGeometry(r, r, h, 40), mat, parent, x, y, z);
  m.rotation.x = Math.PI / 2;
  return m;
}
function ring(
  parent: T.Object3D,
  inner: number,
  outer: number,
  height: number,
  x: number,
  y: number,
  z: number,
  material: T.Material,
) {
  const s = new T.Shape();
  s.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new T.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return mesh(
    new T.ExtrudeGeometry(s, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 64,
    }),
    material,
    parent,
    x,
    y,
    z,
  );
}
function addPart(
  id: string,
  label: string,
  detail: string,
  category: string,
  base = 0,
  explode = 0,
  specs: [string, string][] = [],
) {
  const object = new T.Group();
  object.name = `${id} — ${label}`;
  object.position.z = base;
  object.userData.partId = id;
  root.add(object);
  const p = { id, label, detail, category, object, specs, base, explode };
  parts.push(p);
  return p;
}
function textLabel(
  parent: T.Object3D,
  text: string,
  x: number,
  y: number,
  z: number,
  w: number,
  color = "#eceee3",
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.font = "600 52px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.PlaneGeometry(w, w / 4),
    new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const sweeps = new T.Group();
sweeps.name = "Propeller sweep guides";
sweeps.visible = false;
root.add(sweeps);
const keepout = new T.Group();
keepout.name = "Antenna clearance guide (not enforced copper)";
keepout.visible = false;
root.add(keepout);
function syncVisibility() {
  const guards = parts.filter((p) => /^G\d/.test(p.id));
  const visible = guards.filter((p) => p.object.visible).length;
  const input = $<HTMLInputElement>("#guards");
  input.checked = visible === guards.length;
  input.indeterminate = visible > 0 && visible < guards.length;
  if (selectionBox && selected) selectionBox.visible = selected.object.visible;
}
let ready = false;
function fitAssembly() {
  if (!ready) return;
  root.updateMatrixWorld(true);
  const bounds = new T.Box3();
  for (const p of parts)
    if (p.object.visible) bounds.union(new T.Box3().setFromObject(p.object));
  const center = bounds.getCenter(new T.Vector3());
  const direction = camera.position.clone().sub(controls.target).normalize();
  const right = new T.Vector3().crossVectors(camera.up, direction).normalize();
  const up = new T.Vector3().crossVectors(direction, right).normalize();
  const tanV = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  const tanH = tanV * camera.aspect;
  const height = $("#viewport").clientHeight;
  const usable = Math.max(0.45, (height - 185) / height);
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const v = new T.Vector3(x, y, z).sub(center);
        distance = Math.max(
          distance,
          Math.abs(v.dot(right)) / tanH + v.dot(direction),
          Math.abs(v.dot(up)) / (tanV * usable) + v.dot(direction),
        );
      }
  distance *= 1.08;
  center.addScaledVector(up, (distance * tanV * (Math.abs(direction.z) > 0.99 ? 140 : 55)) / height);
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  controls.update();
}
let selected: Part | undefined;
let selectionBox: T.BoxHelper | undefined;
function select(id?: string) {
  selected = parts.find((p) => p.id === id);
  if (selectionBox) {
    scene.remove(selectionBox);
    selectionBox.geometry.dispose();
    (selectionBox.material as T.Material).dispose();
    selectionBox = undefined;
  }
  document
    .querySelectorAll(".part-row")
    .forEach((el) =>
      el.classList.toggle("selected", (el as HTMLElement).dataset.part === id),
    );
  if (!selected) return;
  const p = selected;
  $("#selection").innerHTML =
    `<div class="part-marker">${icon(p.category === "PCB" ? "layers" : "cube")}</div><h3></h3><p></p><dl></dl>`;
  $("#selection h3").textContent = `${p.id} · ${p.label}`;
  $("#selection p").textContent = p.detail;
  for (const [k, v] of p.specs) {
    const dt = document.createElement("dt"),
      dd = document.createElement("dd");
    dt.textContent = k;
    dd.textContent = v;
    $("#selection dl").append(dt, dd);
  }
  selectionBox = new T.BoxHelper(p.object, 0xc66935);
  selectionBox.visible = p.object.visible;
  scene.add(selectionBox);
  $("#view-status").textContent = `${p.id} selected`;
}
function renderTree(query = "") {
  const tree = $("#tree");
  tree.innerHTML = "";
  for (const category of [
    "PCB",
    "Electronics",
    "Propulsion",
    "Battery",
    "Printed parts",
  ]) {
    const filtered = parts.filter(
      (p) =>
        p.category === category &&
        `${p.id} ${p.label}`.toLowerCase().includes(query.toLowerCase()),
    );
    if (!filtered.length) continue;
    const group = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = category;
    group.append(title);
    for (const p of filtered) {
      const row = document.createElement("div");
      row.className = "tree-row";
      const button = document.createElement("button");
      button.className = "part-row" + (selected === p ? " selected" : "");
      button.dataset.part = p.id;
      button.innerHTML = `<span class="part-ref"></span><span class="part-name"></span>`;
      button.querySelector(".part-ref")!.textContent = p.id;
      button.querySelector(".part-name")!.textContent = p.label;
      button.onclick = () => select(p.id);
      const visibility = document.createElement("input");
      visibility.type = "checkbox";
      visibility.checked = p.object.visible;
      visibility.setAttribute("aria-label", `Show ${p.id} ${p.label}`);
      visibility.onchange = () => {
        p.object.visible = visibility.checked;
        syncVisibility();
      };
      row.append(button, visibility);
      group.append(row);
    }
    tree.append(group);
  }
  syncVisibility();
  if (!tree.children.length)
    tree.textContent = "No matching parts. Try a reference such as U1.";
}
async function start() {
  const [circuit, geometry, provenance] = await Promise.all(
    ["/pcb/circuit.json", "/pcb/geometry.json", "/pcb/provenance.json"].map(
      async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Could not load ${url}`);
        return r.json();
      },
    ),
  );
  const data: Item[] = circuit;
  const pcb = addPart(
    "PCB",
    "X-frame board",
    "The board outline, holes and pads are read directly from the tscircuit build. Copper routing is intentionally absent.",
    "PCB",
    0,
    0,
    [
      ["Thickness", "1.0 mm"],
      ["Layers", "2 / top assembly"],
      ["Outline", "68 × 68 mm"],
      ["Material", "FR-4, 1 oz target"],
    ],
  );
  const shape = new T.Shape();
  geometry.outline.forEach(([x, y]: number[], i: number) =>
    i ? shape.lineTo(x, y) : shape.moveTo(x, y),
  );
  shape.closePath();
  for (const h of data.filter((d) => d.type === "pcb_hole")) {
    const path = new T.Path();
    path.absarc(h.x, h.y, h.hole_diameter / 2, 0, Math.PI * 2, true);
    shape.holes.push(path);
  }
  mesh(
    new T.ExtrudeGeometry(shape, {
      depth: geometry.thickness,
      bevelEnabled: false,
    }),
    materials.pcb,
    pcb.object,
    0,
    0,
    -0.5,
  );
  for (const pad of data.filter((d) => d.type === "pcb_smtpad")) {
    let m: T.Mesh;
    if (pad.shape === "circle")
      m = cylinder(
        pcb.object,
        pad.radius ?? pad.width / 2,
        0.035,
        pad.x,
        pad.y,
        0.52,
        materials.gold,
      );
    else
      m = box(
        pcb.object,
        pad.width,
        pad.height,
        0.035,
        pad.x,
        pad.y,
        0.52,
        materials.gold,
      );
    m.rotation.z = T.MathUtils.degToRad(pad.ccw_rotation ?? 0);
  }
  textLabel(pcb.object, "DRONE V2", 4, -14, 0.55, 11);
  const sources = new Map(
    data
      .filter((d) => d.type === "source_component")
      .map((d) => [d.source_component_id, d]),
  );
  const loader = new OBJLoader();
  let modelFailures = 0;
  await Promise.all(
    data
      .filter((d) => d.type === "pcb_component")
      .map(async (c) => {
        const src = sources.get(c.source_component_id)!;
        const cad = data.find(
          (d) =>
            d.type === "cad_component" &&
            d.pcb_component_id === c.pcb_component_id,
        );
        if (
          src.name.startsWith("TP") ||
          src.name.startsWith("BAT") ||
          /^M\d_/.test(src.name)
        )
          return;
        const label =
          src.manufacturer_part_number ?? src.display_value ?? src.name;
        const p = addPart(
          src.name,
          label,
          cad?.model_obj_url
            ? "JLCPCB-imported geometry at the compiled PCB location. Package colors are approximate display materials."
            : "Generic package envelope at the compiled PCB location; verify final supplier part.",
          "Electronics",
          0.5,
          9,
          [
            [
              "Position",
              `${c.center.x.toFixed(2)}, ${c.center.y.toFixed(2)} mm`,
            ],
            ["Rotation", `${c.rotation ?? 0}°`],
            ["Layer", c.layer],
            [
              "Source",
              cad?.model_obj_url ? "JLCPCB geometry" : "Generic envelope",
            ],
          ],
        );
        p.object.position.x = c.center.x;
        p.object.position.y = c.center.y;
        const body = new T.Group();
        body.rotation.z = T.MathUtils.degToRad(c.rotation ?? 0);
        p.object.add(body);
        if (cad?.model_obj_url) {
          try {
            const obj = await loader.loadAsync(
              "/pcb/" + cad.model_obj_url.replace(/^\.\//, ""),
            );
            obj.position.set(
              -(cad.model_origin_position?.x ?? 0),
              -(cad.model_origin_position?.y ?? 0),
              -(cad.model_origin_position?.z ?? 0),
            );
            obj.traverse((child) => {
              if (child instanceof T.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const bodyMaterial =
                  src.name === "U1"
                    ? materials.metal
                    : src.name === "L1"
                      ? materials.black
                      : materials.black;
                child.material = bodyMaterial;
              }
            });
            body.add(obj);
          } catch {
            modelFailures++;
            box(body, c.width, c.height, 1, 0, 0, 0.5, materials.black);
            p.detail =
              "Vendor model failed to load. Showing the compiled footprint envelope.";
            p.specs[p.specs.length - 1] = ["Source", "Fallback envelope"];
          }
        } else {
          const height = src.name.startsWith("C") ? 0.75 : 0.5;
          box(
            body,
            Math.max(0.4, c.width - 0.45),
            Math.max(0.4, c.height - 0.15),
            height,
            0,
            0,
            height / 2,
            src.name.startsWith("C")
              ? new T.MeshStandardMaterial({ color: 0xa68c61, roughness: 0.8 })
              : materials.black,
          );
        }
      }),
  );
  for (const m of geometry.motors) {
    const p = addPart(
      m.name,
      "716 motor",
      `Dimensional motor envelope. ${m.rotation} is the proposed rotation; confirm firmware mixer and physical motor order before flight.`,
      "Propulsion",
      0,
      19,
      [
        ["Body", "Ø7 × 16 mm"],
        ["Shaft", "Ø0.8 mm"],
        ["Position", `${m.x.toFixed(2)}, ${m.y.toFixed(2)} mm`],
        ["GPIO", String(m.gpio)],
      ],
    );
    cylinder(p.object, 3.5, 16, m.x, m.y, 1, materials.metal);
    cylinder(p.object, 3.5, 1.4, m.x, m.y, -6.7, materials.black);
    cylinder(p.object, 0.4, 5, m.x, m.y, 10.5, materials.metal);
    const prop = addPart(
      `P${m.name.slice(1)}`,
      "46 mm propeller",
      "A conceptual two-blade envelope, not a manufacturing model. Use purchased, matched 0.8 mm-bore propellers.",
      "Propulsion",
      12,
      36,
      [
        ["Diameter", "46 mm"],
        ["Bore", "0.8 mm"],
        ["Direction", m.rotation],
      ],
    );
    const rotor = new T.Group();
    rotor.position.set(m.x, m.y, 0);
    prop.object.add(rotor);
    rotor.userData.direction = m.rotation === "CW" ? -1 : 1;
    propRotors.push(rotor);
    const mat = m.y > 0 ? materials.prop : materials.propBack;
    cylinder(rotor, 1.8, 2, 0, 0, 0, mat);
    const blade = new T.Shape();
    blade.moveTo(1, 0);
    blade.bezierCurveTo(5, 2, 13, 5, 20, 3);
    blade.quadraticCurveTo(23, 2, 23, 0);
    blade.bezierCurveTo(17, -2, 6, -2, 1, -0.5);
    blade.closePath();
    for (const angle of [0, Math.PI]) {
      const b = mesh(
        new T.ExtrudeGeometry(blade, {
          depth: 0.45,
          bevelEnabled: true,
          bevelSize: 0.15,
          bevelThickness: 0.12,
          bevelSegments: 2,
        }),
        mat,
        rotor,
      );
      b.rotation.z = angle;
      b.rotation.x = (m.rotation === "CW" ? 1 : -1) * 0.09;
    }
    rotor.rotation.z = m.x * m.y > 0 ? 0.6 : -0.6;
    const collar = addPart(
      `COL${m.name.slice(1)}`,
      "Motor collar",
      "Slip-in collar concept: 7.1 mm bore, 7.5 mm stem, 10 mm retaining flange. Fit-test before printing a full set.",
      "Printed parts",
      0,
      7,
      [
        ["Bore", "7.1 mm"],
        ["Board opening", "7.6 mm"],
        ["Flange", "10 mm"],
      ],
    );
    ring(collar.object, 3.55, 3.75, 4, m.x, m.y, -2, materials.plastic);
    ring(collar.object, 3.55, 5, 1.5, m.x, m.y, 0.6, materials.plastic);
    const guard = addPart(
      `G${m.name.slice(1)}`,
      "Propeller guard",
      "Guard and supports are lightweight visual concepts. Check flex, attachment strength and real prop clearance.",
      "Printed parts",
      0,
      29,
      [
        ["Inner diameter", "51 mm"],
        ["Nominal radial gap", "2.5 mm"],
        ["Status", "Fit unverified"],
      ],
    );
    ring(guard.object, 25.5, 26.3, 2, m.x, m.y, 11, materials.plastic);
    for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
      const start = new T.Vector3(
          m.x + 4.5 * Math.cos(a),
          m.y + 4.5 * Math.sin(a),
          2,
        ),
        end = new T.Vector3(
          m.x + 25.8 * Math.cos(a),
          m.y + 25.8 * Math.sin(a),
          10,
        );
      const curve = new T.LineCurve3(start, end);
      mesh(
        new T.TubeGeometry(curve, 1, 0.55, 6, false),
        materials.plastic,
        guard.object,
      );
    }
    const disc = cylinder(
      sweeps,
      23,
      0.08,
      m.x,
      m.y,
      12.4,
      new T.MeshBasicMaterial({
        color: 0xc66935,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    disc.name = `${m.name} swept disc`;
  }
  const bat = addPart(
    "BAT",
    "1S 400 mAh LiPo",
    "YY702030 battery envelope below the board. Connector identity, polarity and actual pouch dimensions require verification.",
    "Battery",
    -7,
    -24,
    [
      ["Envelope", "20 × 30 × 7 mm"],
      ["Voltage", "3.7 V nominal / 4.2 V max"],
      ["Capacity", "400 mAh"],
      ["Connector", "M.X2.0 — unresolved"],
    ],
  );
  box(bat.object, 20, 30, 7, 0, -1, -3.5, materials.battery);
  box(bat.object, 18, 26, 0.1, 0, -1, 0.06, materials.black);
  textLabel(bat.object, "1S · 400 mAh", 0, -1, 0.13, 17);
  const wireMat = new T.MeshStandardMaterial({
    color: 0xa83c2e,
    roughness: 0.6,
  });
  for (const [offset, mat] of [
    [-1, wireMat],
    [1, materials.black],
  ] as const) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(-8 + offset, -15, -3),
      new T.Vector3(-15 + offset, -18, -1),
      new T.Vector3(-13 + offset, -16, 6),
    ]);
    mesh(new T.TubeGeometry(path, 24, 0.45, 8, false), mat, bat.object);
  }
  const saddle = addPart(
    "SAD",
    "Insulated battery saddle",
    "Perimeter rails leave an open window beneath the IMU. Rounded rail and strap concept; mounting fasteners are not finalized.",
    "Printed parts",
    -4,
    -14,
    [
      ["Battery clearance", "21 × 31 mm"],
      ["Under-IMU contact", "Open window"],
      ["Retention", "Strap concept"],
    ],
  );
  for (const x of [-11, 11])
    box(saddle.object, 1.5, 32, 9, x, -1, -5, materials.plastic);
  for (const y of [-17, 15])
    box(saddle.object, 23, 1.5, 2, 0, y, -9, materials.plastic);
  box(saddle.object, 24, 5, 1, 0, -11, -10, materials.black);
  const canopy = addPart(
    "CAP",
    "Protective canopy",
    "Open-sided cover over the low electronics. Leaves the ESP antenna and programming pads exposed. Conceptual clips need mechanical design.",
    "Printed parts",
    5,
    43,
    [
      ["Envelope", "27 × 20 × 1 mm"],
      ["Status", "Concept envelope"],
    ],
  );
  box(
    canopy.object,
    27,
    20,
    1,
    0,
    -6,
    0,
    new T.MeshStandardMaterial({
      color: 0x899477,
      transparent: true,
      opacity: 0.45,
      roughness: 0.7,
      depthWrite: false,
    }),
  );
  for (const x of [-13, 13])
    box(canopy.object, 1, 2, 4, x, -12, -2, materials.plastic);
  canopy.object.visible = false;
  box(
    keepout,
    45.4,
    15,
    10,
    0,
    25.5,
    6,
    new T.MeshBasicMaterial({
      color: 0xc66935,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  const edges = new T.LineSegments(
    new T.EdgesGeometry(new T.BoxGeometry(45.4, 15, 10)),
    new T.LineBasicMaterial({
      color: 0xb16b38,
      transparent: true,
      opacity: 0.65,
    }),
  );
  edges.position.set(0, 25.5, 6);
  keepout.add(edges);
  ready = true;
  fitAssembly();
  parts.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  renderTree();
  $("#part-count").textContent = `${parts.length} parts`;
  $("#build-info").textContent =
    `PCB ${provenance.sha256.slice(0, 8)} · ${provenance.components} placed components`;
  $("#loading").hidden = true;
  if (modelFailures)
    $("#view-status").textContent =
      `${modelFailures} vendor models unavailable; footprint envelopes shown.`;
}
start().catch((error) => {
  $("#loading").innerHTML =
    'The assembly could not load. <button onclick="location.reload()">Retry</button> or <a href="/pcb/placement.svg">open the PCB drawing</a>.';
  console.error(error);
});
new ResizeObserver(() => {
  const { width, height } = $("#viewport").getBoundingClientRect();
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  fitAssembly();
}).observe($("#viewport"));
const raycaster = new T.Raycaster();
let down = { x: 0, y: 0 };
renderer.domElement.addEventListener("pointerdown", (e) => {
  down = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
  const r = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(
    new T.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    ),
    camera,
  );
  const objects = parts.filter((p) => p.object.visible).map((p) => p.object);
  const hit = raycaster.intersectObjects(objects, true)[0];
  if (hit) {
    let o: T.Object3D | null = hit.object;
    while (o && !o.userData.partId) o = o.parent;
    if (o) select(o.userData.partId);
  }
});
$("#search").addEventListener("input", (e) =>
  renderTree((e.target as HTMLInputElement).value),
);
function view(name: string) {
  const positions: Record<string, [number, number, number]> = {
    iso: [125, -155, 145],
    top: [0, 0, 225],
    side: [0, -225, 0],
    bottom: [0, 0, -225],
  };
  camera.position.set(...positions[name]);
  camera.up.set(
    0,
    name === "top" ? 1 : name === "bottom" ? -1 : 0,
    name === "top" || name === "bottom" ? 0 : 1,
  );
  controls.target.set(0, 0, 0);
  controls.update();
  fitAssembly();
  document
    .querySelectorAll("[data-view]")
    .forEach((b) =>
      b.classList.toggle("active", (b as HTMLElement).dataset.view === name),
    );
  $("#view-status").textContent =
    `${name === "iso" ? "Perspective" : name} view`;
}
document
  .querySelectorAll<HTMLButtonElement>("[data-view]")
  .forEach((b) => (b.onclick = () => view(b.dataset.view!)));
$("#reset").onclick = () => {
  view("iso");
  $<HTMLInputElement>("#explode").value = "0";
  $("#explode").dispatchEvent(new Event("input"));
};
$("#explode").addEventListener("input", (e) => {
  const value = Number((e.target as HTMLInputElement).value) / 100;
  $("#explode-value").textContent = `${Math.round(value * 100)}%`;
  for (const p of parts) p.object.position.z = p.base + p.explode * value;
  sweeps.position.z = 36 * value;
  floor.position.z = -24 - 24 * value;
  grid.position.z = floor.position.z - 0.1;
  fitAssembly();
});
$("#guards").addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  parts
    .filter((p) => /^G\d/.test(p.id))
    .forEach((p) => (p.object.visible = checked));
  renderTree($<HTMLInputElement>("#search").value);
});
$("#sweeps").addEventListener(
  "change",
  (e) => (sweeps.visible = (e.target as HTMLInputElement).checked),
);
$("#keepouts").addEventListener(
  "change",
  (e) => (keepout.visible = (e.target as HTMLInputElement).checked),
);
$("#parts-toggle").onclick = () => {
  const open = $("#sidebar").classList.toggle("open");
  $("#parts-toggle").setAttribute("aria-expanded", String(open));
};
$("#export").onclick = async () => {
  const b = $<HTMLButtonElement>("#export");
  b.disabled = true;
  b.textContent = "Exporting…";
  try {
    const copy = root.clone(true);
    copy.scale.setScalar(0.001);
    const result = await new GLTFExporter().parseAsync(copy, {
      binary: true,
      onlyVisible: true,
    });
    const url = URL.createObjectURL(
      new Blob([result as ArrayBuffer], { type: "model/gltf-binary" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "drone-v2-assembly.glb";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("#view-status").textContent =
      "Exported visible assembly in metres (glTF standard).";
  } catch (error) {
    $("#view-status").textContent =
      "Export failed. Try hiding detailed components and export again.";
    console.error(error);
  } finally {
    b.disabled = false;
    b.innerHTML = icon("download") + " Export assembly GLB";
  }
};
let last = 0;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function frame(time: number) {
  const delta = Math.min((time - last) / 1000, 0.05);
  last = time;
  if ($<HTMLInputElement>("#spin").checked && !reduced)
    propRotors.forEach(
      (p) => (p.rotation.z += p.userData.direction * delta * 12),
    );
  controls.update();
  selectionBox?.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (reduced) {
  $<HTMLInputElement>("#spin").disabled = true;
  $("#spin").parentElement!.title =
    "Animation disabled by reduced-motion preference";
}
