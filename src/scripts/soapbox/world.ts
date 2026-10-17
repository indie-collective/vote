// The 3D soapbox course: a sunny downhill road with a wooden start ramp, hay bales, bunting,
// a cheering crowd and a checkered finish arch; one wooden cart per Game, each with a floating
// sign showing the Game's image and live rank; and a podium stage past the finish line.
//
// Course coordinates ("hill space"): x across the lanes, z down the hill (start ramp at
// z < 0, finish line at z = TRACK_LENGTH), y up from the road. The hill group tilts it all.

import * as THREE from "three";

export const LANE_WIDTH = 2.6;
export const TRACK_LENGTH = 150;
/** Where carts wait: on top of the start ramp. */
export const START_Z = -9;
const RAMP_TOP = 1.4;
const RAMP_LENGTH = 6;
const SLOPE = Math.atan(0.1);
const PODIUM_Z = TRACK_LENGTH + 48;

// Festival palette (stunfest.com 2026) plus extra cart colours.
const PALETTE = [0xffd348, 0xcec5ff, 0xd8613c, 0xb1c5a4, 0x8ed1fc, 0xf78da7, 0x7bdcb5, 0xffffff];
const CART_COLOURS = [
  0xd8613c, 0x3f7cd8, 0xffd348, 0x9b51e0, 0x2fa36b, 0xf78da7, 0x1b998b, 0xe63946, 0x8ed1fc, 0xff9f1c,
  0x6a4c93, 0xcec5ff, 0x588157, 0xef476f, 0x118ab2, 0xb1c5a4, 0xf4a261, 0x264653, 0xffb4a2, 0x06d6a0,
];

export type LaneGame = { id: string; title: string; image: string };
export type PodiumStep = { place: number; rank: number; gameIds: string[] };

type Cart = {
  id: string;
  title: string;
  group: THREE.Group;
  wheels: THREE.Object3D[];
  flag: THREE.Object3D;
  sign: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; image: HTMLImageElement; key: string };
  laneX: number;
  z: number;
};

type Step = {
  place: number;
  rank: number;
  group: THREE.Group;
  carts: Cart[];
  /** Point above the block, for positioning the HTML label. */
  anchor: THREE.Vector3;
  revealedAt: number | null;
};

/** Height and pitch of the road at z (the start ramp, then flat in hill space). */
function roadProfile(z: number): { y: number; pitch: number } {
  if (z <= -RAMP_LENGTH) return { y: RAMP_TOP, pitch: 0 };
  if (z < 0) return { y: RAMP_TOP * (-z / RAMP_LENGTH), pitch: Math.atan(RAMP_TOP / RAMP_LENGTH) };
  return { y: 0, pitch: 0 };
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function checker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, size: number) {
  for (let i = 0; i * size < w; i++) {
    for (let j = 0; j * size < h; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#000" : "#fff";
      ctx.fillRect(x + i * size, y + j * size, size, size);
    }
  }
}

function banner(text: string) {
  return canvasTexture(2048, 256, (ctx) => {
    checker(ctx, 0, 0, 2048, 40, 20);
    checker(ctx, 0, 216, 2048, 40, 20);
    ctx.fillStyle = "#ffd348";
    ctx.fillRect(0, 40, 2048, 176);
    ctx.fillStyle = "#111";
    ctx.font = '900 120px "Unbounded Variable", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 1024, 132);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function createWorld(canvas: HTMLCanvasElement, lanes: LaneGame[], podiumSteps: PodiumStep[]) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8ed1fc);
  scene.fog = new THREE.Fog(0x8ed1fc, 140, 360);
  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.5, 800);

  scene.add(new THREE.HemisphereLight(0xe8f6ff, 0x5f8a43, 1.2));
  const sun = new THREE.DirectionalLight(0xfff4dd, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 260 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const hill = new THREE.Group();
  hill.rotation.x = SLOPE;
  scene.add(hill);
  const width = lanes.length * LANE_WIDTH;
  const half = width / 2;

  const lambert = (color: number) => new THREE.MeshLambertMaterial({ color });
  const standard = (color: number, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], shadows = true) => {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = shadows;
    m.receiveShadow = true;
    return m;
  };

  // --- Ground, road, ramp and lines ------------------------------------------------------

  const grass = mesh(new THREE.PlaneGeometry(900, 1100), lambert(0x86c35e), false);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.05, 200);
  hill.add(grass);

  const roadLength = TRACK_LENGTH + 80;
  const roadTexture = canvasTexture(1024, 256, (ctx) => {
    ctx.fillStyle = "#5b5b5e";
    ctx.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},0.06)`;
      ctx.fillRect(Math.random() * 1024, Math.random() * 256, 3, 3);
    }
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let lane = 1; lane < lanes.length; lane++) ctx.fillRect((lane / lanes.length) * 1024 - 2, 0, 4, 128);
  });
  roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(1, roadLength / 8);
  const road = mesh(new THREE.PlaneGeometry(width, roadLength), new THREE.MeshLambertMaterial({ map: roadTexture }), false);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, roadLength / 2 - 12);
  hill.add(road);

  const curbTexture = canvasTexture(64, 256, (ctx) => {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? "#ffffff" : "#d8613c";
      ctx.fillRect(0, i * 64, 64, 64);
    }
  });
  curbTexture.wrapT = THREE.RepeatWrapping;
  curbTexture.repeat.set(1, roadLength / 4);
  for (const side of [-1, 1]) {
    const curb = mesh(new THREE.BoxGeometry(0.6, 0.12, roadLength), new THREE.MeshLambertMaterial({ map: curbTexture }), false);
    curb.position.set(side * (half + 0.3), 0.06, roadLength / 2 - 12);
    hill.add(curb);
  }

  const wood = new THREE.MeshStandardMaterial({
    map: canvasTexture(256, 256, (ctx) => {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#c99355" : "#b8803f";
        ctx.fillRect(0, i * 32, 256, 32);
        ctx.fillStyle = "rgba(60,30,10,0.35)";
        ctx.fillRect(0, i * 32 + 30, 256, 2);
      }
    }),
    roughness: 0.9,
  });
  const rampTop = mesh(new THREE.BoxGeometry(width + 2, RAMP_TOP, 8), wood);
  rampTop.position.set(0, RAMP_TOP / 2, -RAMP_LENGTH - 4);
  hill.add(rampTop);
  const wedge = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(RAMP_LENGTH, 0), new THREE.Vector2(RAMP_LENGTH, RAMP_TOP)]);
  const ramp = mesh(new THREE.ExtrudeGeometry(wedge, { depth: width + 2, bevelEnabled: false }), wood);
  ramp.rotation.y = Math.PI / 2;
  ramp.position.set(-(width + 2) / 2, 0, 0);
  hill.add(ramp);

  const finishLine = mesh(
    new THREE.PlaneGeometry(width, 1.6),
    new THREE.MeshLambertMaterial({ map: canvasTexture(1024, 64, (ctx) => checker(ctx, 0, 0, 1024, 64, 32)) }),
    false
  );
  finishLine.rotation.x = -Math.PI / 2;
  finishLine.position.set(0, 0.02, TRACK_LENGTH);
  hill.add(finishLine);

  // --- Arches -----------------------------------------------------------------------------

  function arch(z: number, text: string, height: number) {
    const post = new THREE.CylinderGeometry(0.3, 0.3, height, 12);
    for (const side of [-1, 1]) {
      const p = mesh(post, standard(0x111111));
      p.position.set(side * (half + 1.6), height / 2 + roadProfile(z).y, z);
      hill.add(p);
    }
    const sign = mesh(new THREE.BoxGeometry(width + 3.6, 1.8, 0.3), [
      ...Array(4).fill(standard(0x111111)),
      // Unlit, so the banner reads like a printed sign whichever way the sun falls.
      new THREE.MeshBasicMaterial({ map: banner(text) }),
      new THREE.MeshBasicMaterial({ map: banner(text) }),
    ]);
    sign.position.set(0, height - 0.6 + roadProfile(z).y, z);
    hill.add(sign);
  }
  arch(-RAMP_LENGTH - 1, "DÉPART · START", 6.5);
  arch(TRACK_LENGTH, "ARRIVÉE · FINISH", 7.5);

  // --- Hay bales, crowd, trees, bunting --------------------------------------------------

  const dummy = new THREE.Object3D();
  const bales: { x: number; z: number }[] = [];
  for (const side of [-1, 1]) {
    for (let z = -2; z < TRACK_LENGTH + 40; z += 3.2) bales.push({ x: side * (half + 1.4), z });
  }
  const baleMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.85, 1.0), standard(0xe2b65b, 1), bales.length);
  bales.forEach(({ x, z }, i) => {
    dummy.position.set(x, 0.42, z);
    dummy.rotation.set(0, (Math.random() - 0.5) * 0.15, 0);
    dummy.updateMatrix();
    baleMesh.setMatrixAt(i, dummy.matrix);
  });
  baleMesh.castShadow = baleMesh.receiveShadow = true;
  hill.add(baleMesh);

  const crowd: { x: number; z: number; phase: number; speed: number }[] = [];
  for (let i = 0; i < 320; i++) {
    const side = i % 2 ? 1 : -1;
    crowd.push({
      x: side * (half + 3.2 + Math.random() * 5),
      z: 4 + Math.random() * (TRACK_LENGTH + 30),
      phase: Math.random() * Math.PI * 2,
      speed: 6 + Math.random() * 5,
    });
  }
  const bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.28, 0.75, 4, 8), lambert(0xffffff), crowd.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 10, 8), lambert(0xf1c7a5), crowd.length);
  crowd.forEach((_, i) => bodies.setColorAt(i, new THREE.Color(PALETTE[i % PALETTE.length]).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2)));
  bodies.castShadow = true;
  hill.add(bodies, heads);
  let excitement = 0.2;

  const trunks: THREE.Vector3[] = [];
  for (let i = 0; i < 180; i++) {
    const side = i % 2 ? 1 : -1;
    trunks.push(new THREE.Vector3(side * (half + 14 + Math.random() * 70), 0, -40 + Math.random() * (TRACK_LENGTH + 180)));
  }
  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 6), lambert(0x7a5230), trunks.length);
  const leafMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 5, 8), lambert(0xffffff), trunks.length);
  trunks.forEach((position, i) => {
    const scale = 0.7 + Math.random() * 0.8;
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.setScalar(scale);
    dummy.position.set(position.x, scale, position.z);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.set(position.x, 2 * scale + 2.5 * scale, position.z);
    dummy.updateMatrix();
    leafMesh.setMatrixAt(i, dummy.matrix);
    leafMesh.setColorAt(i, new THREE.Color(0x3f8f4a).offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.12));
  });
  dummy.scale.setScalar(1);
  trunkMesh.castShadow = leafMesh.castShadow = true;
  hill.add(trunkMesh, leafMesh);

  // Bunting strung across the road between poles.
  const flags: { position: THREE.Vector3; colour: number }[] = [];
  const poleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 6.5, 8);
  for (const z of [22, 52, 82, 112]) {
    for (const side of [-1, 1]) {
      const pole = mesh(poleGeometry, standard(0xffffff));
      pole.position.set(side * (half + 2.2), 3.25, z);
      hill.add(pole);
    }
    const span = width + 4.4;
    for (let x = -span / 2 + 0.5, i = 0; x < span / 2; x += 0.85, i++) {
      const sag = 1.4 * (1 - (2 * x / span) ** 2);
      flags.push({ position: new THREE.Vector3(x, 6.2 - sag, z), colour: PALETTE[i % 5] });
    }
  }
  const triangle = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.32, 0, 0),
    new THREE.Vector3(0.32, 0, 0),
    new THREE.Vector3(0, -0.55, 0),
  ]);
  triangle.computeVertexNormals();
  const bunting = new THREE.InstancedMesh(triangle, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), flags.length);
  flags.forEach(({ position, colour }, i) => {
    dummy.position.copy(position);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    bunting.setMatrixAt(i, dummy.matrix);
    bunting.setColorAt(i, new THREE.Color(colour));
  });
  hill.add(bunting);

  // --- Carts -----------------------------------------------------------------------------

  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.14, 20).rotateZ(Math.PI / 2);
  const hubGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12).rotateZ(Math.PI / 2);
  const rubber = standard(0x1d1d1d, 0.95);
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.3 });
  const skin = lambert(0xf1c7a5);

  function drawSign(cart: Cart, rank: number | null, leader: boolean) {
    const key = `${rank}|${leader}|${cart.sign.image.complete}`;
    if (key === cart.sign.key) return;
    cart.sign.key = key;
    const ctx = cart.sign.canvas.getContext("2d")!;
    const { width: w, height: h } = cart.sign.canvas;
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 8, 8, w - 16, h - 16, 22);
    ctx.fillStyle = leader ? "#ffd348" : "#f9f9f9";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#000";
    ctx.stroke();
    const imageBox = { x: 24, y: 24, w: w - 48, h: (w - 48) * (9 / 16) };
    if (cart.sign.image.complete && cart.sign.image.naturalWidth) {
      const { naturalWidth: iw, naturalHeight: ih } = cart.sign.image;
      const scale = Math.max(imageBox.w / iw, imageBox.h / ih);
      const sw = imageBox.w / scale;
      const sh = imageBox.h / scale;
      ctx.save();
      roundRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, 12);
      ctx.clip();
      ctx.drawImage(cart.sign.image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, imageBox.x, imageBox.y, imageBox.w, imageBox.h);
      ctx.restore();
    }
    ctx.fillStyle = "#111";
    ctx.font = '800 38px "Unbounded Variable", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let title = cart.title;
    while (ctx.measureText(title).width > w - 60 && title.length > 4) title = `${title.slice(0, -2)}…`;
    ctx.fillText(title, w / 2, imageBox.y + imageBox.h + 40);
    if (rank !== null) {
      ctx.beginPath();
      ctx.arc(w - 52, 52, 44, 0, Math.PI * 2);
      ctx.fillStyle = leader ? "#d8613c" : "#ffd348";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = leader ? "#fff" : "#000";
      ctx.font = '900 46px "Unbounded Variable", system-ui, sans-serif';
      ctx.fillText(String(rank), w - 52, 55);
    }
    cart.sign.texture.needsUpdate = true;
  }

  const carts = new Map<string, Cart>();
  lanes.forEach((game, index) => {
    const colour = CART_COLOURS[index % CART_COLOURS.length];
    const paint = standard(colour, 0.5);
    const group = new THREE.Group();

    const body = mesh(new THREE.BoxGeometry(1.1, 0.42, 2.0), wood);
    body.position.y = 0.55;
    const nose = mesh(new THREE.BoxGeometry(1.0, 0.3, 0.6), paint);
    nose.position.set(0, 0.5, 1.2);
    nose.rotation.x = 0.35;
    const stripe = mesh(new THREE.BoxGeometry(1.12, 0.12, 2.02), paint);
    stripe.position.y = 0.62;
    group.add(body, nose, stripe);

    const wheels: THREE.Object3D[] = [];
    for (const [x, z] of [[-0.62, 0.7], [0.62, 0.7], [-0.62, -0.7], [0.62, -0.7]]) {
      const wheel = new THREE.Group();
      wheel.add(mesh(wheelGeometry, rubber), mesh(hubGeometry, chrome));
      wheel.position.set(x, 0.3, z);
      wheels.push(wheel);
      group.add(wheel);
    }

    const torso = mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.55, 12), paint);
    torso.position.set(0, 1.02, -0.3);
    const head = mesh(new THREE.SphereGeometry(0.2, 16, 12), skin);
    head.position.set(0, 1.45, -0.28);
    const helmet = mesh(new THREE.SphereGeometry(0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), standard(0xffffff, 0.4));
    helmet.position.set(0, 1.47, -0.3);
    group.add(torso, head, helmet);

    const flag = new THREE.Group();
    const pole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), chrome);
    pole.position.y = 0.8;
    const pennant = mesh(triangle, new THREE.MeshLambertMaterial({ color: colour, side: THREE.DoubleSide }));
    pennant.rotation.z = Math.PI / 2;
    pennant.position.set(0, 1.55, 0);
    flag.add(pole, pennant);
    flag.position.set(0.45, 0.7, -0.95);
    group.add(flag);

    const signCanvas = document.createElement("canvas");
    signCanvas.width = 512;
    signCanvas.height = 380;
    const texture = new THREE.CanvasTexture(signCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(2.9, 2.15, 1);
    sprite.position.set(0, 3.0, 0);
    group.add(sprite);

    const image = new Image();
    const cart: Cart = {
      id: game.id,
      title: game.title,
      group,
      wheels,
      flag,
      sign: { canvas: signCanvas, texture, image, key: "" },
      laneX: -half + LANE_WIDTH * (index + 0.5),
      z: START_Z,
    };
    image.onload = () => drawSign(cart, null, false);
    image.src = game.image;
    drawSign(cart, null, false);
    carts.set(game.id, cart);
    hill.add(group);
  });

  function placeOnCourse(cart: Cart, z: number) {
    const wheelTurn = (z - cart.z) / 0.3;
    for (const wheel of cart.wheels) wheel.rotation.x += wheelTurn;
    cart.z = z;
    const { y, pitch } = roadProfile(z);
    cart.group.position.set(cart.laneX, y, z);
    cart.group.rotation.set(pitch, 0, 0);
    cart.group.scale.setScalar(1);
  }

  // --- Podium stage past the finish (flat, so it sits in world space) --------------------

  const podium = new THREE.Group();
  podium.position.copy(hill.localToWorld(new THREE.Vector3(0, 0, PODIUM_Z)));
  scene.add(podium);
  const stage = mesh(new THREE.BoxGeometry(36, 6, 14), wood);
  stage.position.y = -2.4;
  podium.add(stage);
  /** Front face of a podium block, drawn at the block's proportions so the number isn't stretched. */
  const numberTexture = (label: string, colour: string, aspect: number) =>
    canvasTexture(Math.round(256 * aspect), 256, (ctx) => {
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, ctx.canvas.width, 256);
      ctx.fillStyle = "#111";
      ctx.font = '900 170px "Unbounded Variable", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, ctx.canvas.width / 2, 140);
    });

  const steps: Step[] = podiumSteps.map(({ place, rank, gameIds }) => {
    const x = [0, -9.5, 9.5][place];
    const height = [3.2, 2.2, 1.4][place];
    const blockWidth = Math.max(5, gameIds.length * 3.4);
    const colour = place === 0 ? "#cec5ff" : "#f9f9f9";
    const group = new THREE.Group();
    group.position.set(x, 0.6, 0);
    const face = new THREE.MeshStandardMaterial({ map: numberTexture(String(rank), colour, blockWidth / height), roughness: 0.6 });
    const plain = standard(new THREE.Color(colour).getHex(), 0.6);
    // Faces: +x, –x, +y, –y, +z, –z. The camera looks at the podium from –z.
    const block = mesh(new THREE.BoxGeometry(blockWidth, height, 4), [plain, plain, plain, plain, plain, face]);
    block.position.y = height / 2;
    group.add(block);
    podium.add(group);
    const stepCarts = gameIds.map((id) => carts.get(id)!);
    return {
      place,
      rank,
      group,
      carts: stepCarts,
      anchor: new THREE.Vector3(x, 0.6 + height + (place === 0 ? 6.2 : 4.6), 0).add(podium.position),
      revealedAt: null,
    };
  });

  // Confetti for the winner.
  const confettiCount = 600;
  const confetti = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.16, 0.28),
    new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }),
    confettiCount
  );
  const pieces = Array.from({ length: confettiCount }, (_, i) => {
    confetti.setColorAt(i, new THREE.Color(PALETTE[i % 6]));
    return { position: new THREE.Vector3(), velocity: new THREE.Vector3(), spin: new THREE.Vector3(), rotation: new THREE.Euler() };
  });
  confetti.visible = false;
  confetti.frustumCulled = false;
  podium.add(confetti);
  let confettiUntil = 0;

  // --- API -------------------------------------------------------------------------------

  let elapsed = 0;

  return {
    renderer,
    scene,
    camera,
    width,

    /** Hill-space point to world space (for camera placement). */
    toWorld(x: number, y: number, z: number) {
      return hill.localToWorld(new THREE.Vector3(x, y, z));
    },
    podiumCentre: podium.position.clone(),

    resetCarts() {
      for (const cart of carts.values()) {
        cart.group.visible = true;
        hill.add(cart.group);
        cart.z = START_Z;
        placeOnCourse(cart, START_Z);
        drawSign(cart, null, false);
      }
      for (const step of steps) step.revealedAt = null;
      confetti.visible = false;
    },

    /** Moves a cart to `fraction` of the course (0 = start ramp, 1 = finish line). */
    setProgress(id: string, fraction: number) {
      placeOnCourse(carts.get(id)!, START_Z + fraction * (TRACK_LENGTH - START_Z));
    },

    setRank(id: string, rank: number | null, leader: boolean) {
      drawSign(carts.get(id)!, rank, leader);
    },

    /** Hill-space z of the leading and median carts, for the camera. */
    pack() {
      const zs = [...carts.values()].map((cart) => cart.z).sort((a, b) => a - b);
      return { leader: zs[zs.length - 1], median: zs[Math.floor(zs.length / 2)] };
    },

    setExcitement(value: number) {
      excitement = value;
    },

    /** Moves the podium Games onto their steps, hidden until revealed; hides the others. */
    showPodium() {
      const podiumIds = new Set(steps.flatMap((step) => step.carts.map((cart) => cart.id)));
      for (const cart of carts.values()) cart.group.visible = podiumIds.has(cart.id);
      for (const step of steps) {
        step.carts.forEach((cart, i) => {
          step.group.add(cart.group);
          const height = [3.2, 2.2, 1.4][step.place];
          cart.group.position.set((i - (step.carts.length - 1) / 2) * 3.2, height, 0);
          cart.group.rotation.set(0, Math.PI, 0);
          cart.group.scale.setScalar(0);
          drawSign(cart, step.rank, step.place === 0);
        });
      }
    },

    /** Reveals podium step `place` (0 = 1st) with a bounce; confetti for 1st. */
    reveal(place: number) {
      const step = steps.find((candidate) => candidate.place === place);
      if (!step) return;
      step.revealedAt = elapsed;
      if (place === 0) {
        confetti.visible = true;
        confettiUntil = elapsed + 12;
        for (const piece of pieces) {
          piece.position.set((Math.random() - 0.5) * 16, 10 + Math.random() * 10, (Math.random() - 0.5) * 8);
          piece.velocity.set((Math.random() - 0.5) * 2, -1.5 - Math.random() * 2, (Math.random() - 0.5) * 2);
          piece.spin.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        }
      }
    },

    steps,

    update(dt: number) {
      elapsed += dt;

      crowd.forEach((person, i) => {
        const jump = Math.max(0, Math.sin(elapsed * person.speed + person.phase)) * 0.45 * excitement;
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(person.x, 0.65 + jump, person.z);
        dummy.updateMatrix();
        bodies.setMatrixAt(i, dummy.matrix);
        dummy.position.y += 0.75;
        dummy.updateMatrix();
        heads.setMatrixAt(i, dummy.matrix);
      });
      bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;

      for (const cart of carts.values()) cart.flag.rotation.y = Math.sin(elapsed * 8 + cart.laneX) * 0.35;

      for (const step of steps) {
        if (step.revealedAt === null) continue;
        const t = Math.min(1, (elapsed - step.revealedAt) / 0.7);
        const bounce = 1 + Math.sin(t * Math.PI) * 0.25; // overshoot, then settle at 1
        for (const cart of step.carts) cart.group.scale.setScalar(t * bounce || 0.0001);
      }

      if (confetti.visible) {
        pieces.forEach((piece, i) => {
          piece.position.addScaledVector(piece.velocity, dt);
          piece.position.x += Math.sin(elapsed * 2 + i) * dt * 0.6;
          if (piece.position.y < 0.5 && elapsed < confettiUntil) piece.position.y = 12 + Math.random() * 6;
          piece.rotation.set(piece.rotation.x + piece.spin.x * dt, piece.rotation.y + piece.spin.y * dt, piece.rotation.z + piece.spin.z * dt);
          dummy.position.copy(piece.position);
          dummy.rotation.copy(piece.rotation);
          dummy.updateMatrix();
          confetti.setMatrixAt(i, dummy.matrix);
        });
        confetti.instanceMatrix.needsUpdate = true;
      }
    },

    /** Keeps the sun's shadow box centred on what the camera is looking at. */
    aimSun(target: THREE.Vector3) {
      sun.target.position.copy(target);
      sun.position.copy(target).add(new THREE.Vector3(40, 80, -30));
    },

    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    render() {
      renderer.render(scene, camera);
    },
  };
}

export type World = ReturnType<typeof createWorld>;
