import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

const canvas = document.querySelector("#viewport");
const loadingNote = document.querySelector("#loadingNote");
const appShell = document.querySelector(".app-shell");
const fileMenuButton = document.querySelector("#fileMenuButton");
const imageMenuButton = document.querySelector("#imageMenuButton");
const fileMenu = document.querySelector("#fileMenu");
const imageMenu = document.querySelector("#imageMenu");
const modelMenuUpload = document.querySelector("#modelMenuUpload");
const refMenuUpload = document.querySelector("#refMenuUpload");
const modelingButton = document.querySelector("#modelingButton");
const resetTransformButton = document.querySelector("#resetTransformButton");
const helpButton = document.querySelector("#helpButton");
const helpPanel = document.querySelector("#helpPanel");
const helpCloseButton = document.querySelector("#helpCloseButton");
const helpTitle = document.querySelector("[data-help-title]");
const helpList = document.querySelector("#helpList");
const languageButton = document.querySelector("#languageButton");
const renderModeButton = document.querySelector("#renderModeButton");
const modelFileInput = document.querySelector("#modelFileInput");
const modelNameInput = document.querySelector("#modelNameInput");
const refFileInput = document.querySelector("#refFileInput");
const refImage = document.querySelector(".ref-note img");
const refCaption = document.querySelector(".ref-note figcaption");
const modelNameFields = {
  viewport: document.querySelector('[data-model-name="viewport"]'),
  object: document.querySelector('[data-model-name="object"]'),
  modifier: document.querySelector('[data-model-name="modifier"]'),
};
const uploadStatus = document.querySelector("[data-upload-status]");
const modelSourceField = document.querySelector("[data-model-source]");
const refStatus = document.querySelector("[data-ref-status]");
const renderModeLabel = document.querySelector("[data-render-mode-label]");
const renderModeField = document.querySelector("[data-render-mode-field]");
const transformFields = {
  x: document.querySelector('[data-transform-field="x"]'),
  y: document.querySelector('[data-transform-field="y"]'),
  z: document.querySelector('[data-transform-field="z"]'),
  yaw: document.querySelector('[data-transform-field="yaw"]'),
  scale: document.querySelector('[data-transform-field="scale"]'),
  tool: document.querySelector('[data-transform-field="tool"]'),
};
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfffefa);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(-3.8, 2.25, 5.1);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0xfffefa, 1);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1.32, 0);
controls.minDistance = 2.8;
controls.maxDistance = 8.8;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI - 0.14;
controls.enablePan = false;

scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2ff, 2.85));

const key = new THREE.DirectionalLight(0xffffff, 1.55);
key.position.set(3.2, 5.2, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xe4edff, 0.95);
fill.position.set(-4.2, 2.8, -2.4);
scene.add(fill);

const ink = new THREE.Color(0x4c54a8);
const paperWhite = new THREE.Color(0xfffdf8);
const toonGradient = makeToonGradient();
const modelRig = new THREE.Group();
const initialModelYaw = -0.14;
let modelYaw = initialModelYaw;
let modelScale = 1;
modelRig.rotation.y = modelYaw;
scene.add(modelRig);

let loadedModel = null;
let mixer = null;
let isDragging = false;
let lastStatsWrite = 0;
let viewportMode = "";
let activeTool = "view";
let transformDrag = null;
let activeLocalObjectUrls = [];
let activeRefObjectUrl = "";
let renderMode = "sketch";
let hasCustomRef = false;
let uploadedModelSlot = null;
let activeModelKind = "sample";
let currentLanguage = "en";
let customModelName = "";
const clock = new THREE.Clock();
const pencilLines = [];

const lineMaterial = new THREE.LineBasicMaterial({
  color: ink,
  transparent: true,
  opacity: 0.52,
});

const faintLineMaterial = new THREE.LineBasicMaterial({
  color: ink,
  transparent: true,
  opacity: 0.25,
});

const TEXT = {
  en: {
    dropHint: "drop model or ref image",
    file: "File",
    help: "Help",
    helpItems: [
      "File > Upload model, or drop a .glb/.gltf/.obj/.fbx/.stl model onto the view.",
      "Image > Reference, or drop an image onto the view.",
      "Use Move, Rotate, and Scale on the left toolbar.",
      "Use sketch view / normal view to switch rendering.",
      "Use Reset to restore the model position, direction, and scale.",
    ],
    helpTitle: "Quick guide",
    image: "Image",
    language: "EN",
    modeling: "Modeling",
    normalView: "normal view",
    reference: "Reference",
    renderNormal: "normal",
    renderSketch: "sketch",
    sketchView: "sketch view",
    upload: "Upload model",
  },
  ja: {
    dropHint: "モデルか参考画像をドロップ",
    file: "ファイル",
    help: "ヘルプ",
    helpItems: [
      "ファイル > モデル読込、または .glb/.gltf/.obj/.fbx/.stl を画面にドロップします。",
      "Image > Reference、または画像をビューにドロップします。",
      "左ツールバーで移動、回転、拡大縮小を操作します。",
      "sketch view / normal view で表示を切り替えます。",
      "Reset でモデルの位置、向き、拡大縮小を元に戻します。",
    ],
    helpTitle: "操作ガイド",
    image: "画像",
    language: "日本語",
    modeling: "Modeling",
    normalView: "normal view",
    reference: "Reference",
    renderNormal: "normal",
    renderSketch: "sketch",
    sketchView: "sketch view",
    upload: "モデル読込",
  },
};

makeGround(scene);
loadModel();
setupToolButtons();
setupMenus();
setupModelUpload();
setupReferenceUpload();
setupDropUpload();
setupRenderModeButton();
setupModelingButton();
setupResetButton();
setupModelNameEditor();
setupHelpAndLanguage();

canvas.addEventListener("pointerdown", (event) => {
  isDragging = true;
  if (activeTool === "move" || activeTool === "rotate" || activeTool === "scale") {
    startTransformDrag(event);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (transformDrag) {
    updateTransformDrag(event);
  }
});

window.addEventListener("pointerup", (event) => {
  if (transformDrag) {
    updateTransformDrag(event);
    transformDrag = null;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    writeTransformState();
  }
  isDragging = false;
});

function setupToolButtons() {
  const buttons = document.querySelectorAll("[data-tool]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const nextTool = button.dataset.tool;
      setActiveTool(activeTool === nextTool && nextTool !== "view" ? "view" : nextTool);
    });
  }
  setActiveTool("view");
}

function setupMenus() {
  fileMenuButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu("file");
  });

  imageMenuButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu("image");
  });

  document.addEventListener("click", () => closeMenus());
  fileMenu?.addEventListener("click", (event) => event.stopPropagation());
  imageMenu?.addEventListener("click", (event) => event.stopPropagation());
}

function toggleMenu(menu) {
  const openFile = menu === "file" && fileMenu?.hidden;
  const openImage = menu === "image" && imageMenu?.hidden;
  closeMenus();

  if (openFile && fileMenu) {
    fileMenu.hidden = false;
    fileMenuButton?.classList.add("is-open");
  }

  if (openImage && imageMenu) {
    imageMenu.hidden = false;
    imageMenuButton?.classList.add("is-open");
  }
}

function closeMenus() {
  if (fileMenu) fileMenu.hidden = true;
  if (imageMenu) imageMenu.hidden = true;
  fileMenuButton?.classList.remove("is-open");
  imageMenuButton?.classList.remove("is-open");
}

function setupModelUpload() {
  modelMenuUpload?.addEventListener("click", () => {
    closeMenus();
    modelFileInput?.click();
  });

  modelFileInput?.addEventListener("change", () => {
    const files = Array.from(modelFileInput.files || []);
    if (files.length > 0) {
      loadLocalModelFiles(files);
    }
    modelFileInput.value = "";
  });
}

function setupReferenceUpload() {
  refMenuUpload?.addEventListener("click", () => {
    closeMenus();
    refFileInput?.click();
  });

  refFileInput?.addEventListener("change", () => {
    const [file] = Array.from(refFileInput.files || []);
    if (file) loadReferenceImage(file);
    refFileInput.value = "";
  });
}

function setupDropUpload() {
  const target = appShell || document.body;
  const showDrop = (event) => {
    if (!hasFileItems(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    document.body.classList.add("is-file-dragging");
  };

  target.addEventListener("dragenter", showDrop);
  target.addEventListener("dragover", showDrop);
  target.addEventListener("dragleave", (event) => {
    if (event.relatedTarget && target.contains(event.relatedTarget)) return;
    document.body.classList.remove("is-file-dragging");
  });
  target.addEventListener("drop", (event) => {
    if (!hasFileItems(event.dataTransfer)) return;
    event.preventDefault();
    document.body.classList.remove("is-file-dragging");
    handleDroppedFiles(Array.from(event.dataTransfer.files || []));
  });
  window.addEventListener("dragover", (event) => {
    if (!hasFileItems(event.dataTransfer)) return;
    event.preventDefault();
  });
  window.addEventListener("drop", (event) => {
    if (!hasFileItems(event.dataTransfer) || target.contains(event.target)) return;
    event.preventDefault();
    document.body.classList.remove("is-file-dragging");
    handleDroppedFiles(Array.from(event.dataTransfer.files || []));
  });
}

function hasFileItems(dataTransfer) {
  return Array.from(dataTransfer?.items || []).some((item) => item.kind === "file");
}

function handleDroppedFiles(files) {
  if (files.some(isModelFile)) {
    loadLocalModelFiles(files);
    return;
  }

  const imageFile = files.find(isImageFile);
  if (imageFile) {
    loadReferenceImage(imageFile);
  }
}

function setupRenderModeButton() {
  renderModeButton?.addEventListener("click", () => {
    setRenderMode(renderMode === "sketch" ? "normal" : "sketch");
  });
  updateRenderModeUI();
}

function setupModelingButton() {
  modelingButton?.addEventListener("click", () => {
    showUploadedModel();
  });
}

function setupResetButton() {
  resetTransformButton?.addEventListener("click", () => {
    resetTransforms();
  });
}

function setupModelNameEditor() {
  if (!modelNameInput) return;
  modelNameInput.addEventListener("focus", () => {
    if (modelNameInput.value === "Name") {
      modelNameInput.select();
    }
  });
  modelNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      modelNameInput.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      updateModelNameField();
      modelNameInput.blur();
    }
  });
  modelNameInput.addEventListener("blur", () => {
    saveCustomModelName(modelNameInput.value);
  });
}

function setupHelpAndLanguage() {
  helpButton?.addEventListener("click", () => {
    if (!helpPanel) return;
    helpPanel.hidden = !helpPanel.hidden;
  });

  helpCloseButton?.addEventListener("click", () => {
    if (helpPanel) helpPanel.hidden = true;
  });

  languageButton?.addEventListener("click", () => {
    const order = ["en", "ja"];
    const nextIndex = (order.indexOf(currentLanguage) + 1) % order.length;
    currentLanguage = order[nextIndex];
    applyLanguage();
  });

  applyLanguage();
}

function resetTransforms() {
  modelRig.position.set(0, 0, 0);
  modelScale = 1;
  modelRig.scale.setScalar(modelScale);
  modelYaw = initialModelYaw;
  modelRig.rotation.y = modelYaw;
  setActiveTool("view");
  controls.update();
  writeTransformState();
  setUploadStatus("reset");
}

function saveCustomModelName(value) {
  const nextName = value.trim();
  customModelName = nextName === "Name" ? "" : nextName;
  updateModelLabels(loadedModel?.name || "sample-simple.glb", {
    sourceLabel: modelSourceField?.textContent || "",
    uploadLabel: uploadStatus?.textContent || "",
  });
  const modelData = JSON.parse(canvas.dataset.model || "{}");
  modelData.displayName = customModelName || modelData.name || "";
  canvas.dataset.model = JSON.stringify(modelData);
}

function updateModelNameField() {
  if (modelNameInput) modelNameInput.value = customModelName || "Name";
}

function applyLanguage() {
  const text = getText();
  document.documentElement.lang = currentLanguage;
  if (fileMenuButton) fileMenuButton.textContent = text.file;
  if (imageMenuButton) imageMenuButton.textContent = text.image;
  if (helpButton) helpButton.textContent = text.help;
  if (languageButton) languageButton.textContent = text.language;
  if (modelMenuUpload?.querySelector("span:last-child")) modelMenuUpload.querySelector("span:last-child").textContent = text.upload;
  if (refMenuUpload?.querySelector("span:last-child")) refMenuUpload.querySelector("span:last-child").textContent = text.reference;
  if (modelingButton) modelingButton.textContent = text.modeling;
  const dropHint = document.querySelector("#dropHint");
  if (dropHint) dropHint.textContent = text.dropHint;
  if (helpTitle) helpTitle.textContent = text.helpTitle;
  if (helpList) {
    helpList.replaceChildren(...text.helpItems.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }));
  }
  updateRenderModeUI();
}

function getText() {
  return TEXT[currentLanguage] || TEXT.en;
}

function setActiveTool(tool) {
  if (loadedModel && activeTool === "view" && tool !== "view") {
    modelYaw = modelRig.rotation.y;
  }
  activeTool = tool;
  controls.enabled = tool === "view";
  document.body.classList.toggle("tool-move", tool === "move");
  document.body.classList.toggle("tool-rotate", tool === "rotate");
  document.body.classList.toggle("tool-scale", tool === "scale");
  for (const button of document.querySelectorAll("[data-tool]")) {
    button.classList.toggle("is-active", button.dataset.tool === tool);
  }
  canvas.dataset.tool = tool;
  writeTransformState();
}

function startTransformDrag(event) {
  if (!loadedModel) return;
  controls.enabled = false;
  canvas.setPointerCapture?.(event.pointerId);
  modelYaw = modelRig.rotation.y;
  transformDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startPosition: modelRig.position.clone(),
    startRotationY: modelYaw,
    startScale: modelScale,
    tool: activeTool,
  };
}

function updateTransformDrag(event) {
  if (!transformDrag || event.pointerId !== transformDrag.pointerId) return;

  const dx = event.clientX - transformDrag.startX;
  const dy = event.clientY - transformDrag.startY;
  if (transformDrag.tool === "move") {
    const distance = camera.position.distanceTo(controls.target);
    const scale = distance * 0.00145;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    camera.getWorldDirection(right);
    right.cross(up).normalize();
    modelRig.position.copy(transformDrag.startPosition)
      .addScaledVector(right, dx * scale)
      .addScaledVector(up, -dy * scale);
  }

  if (transformDrag.tool === "rotate") {
    modelYaw = transformDrag.startRotationY + dx * 0.012;
    modelRig.rotation.y = modelYaw;
  }

  if (transformDrag.tool === "scale") {
    const scaleDelta = 1 + (dx - dy) * 0.004;
    modelScale = THREE.MathUtils.clamp(transformDrag.startScale * scaleDelta, 0.18, 3.5);
    modelRig.scale.setScalar(modelScale);
  }
  writeTransformState();
}

function writeTransformState() {
  const state = {
    tool: activeTool,
    x: Number(modelRig.position.x.toFixed(3)),
    y: Number(modelRig.position.y.toFixed(3)),
    z: Number(modelRig.position.z.toFixed(3)),
    yaw: Number(modelYaw.toFixed(3)),
    yawDeg: Number(THREE.MathUtils.radToDeg(modelYaw).toFixed(1)),
    scale: Number(modelScale.toFixed(3)),
  };
  canvas.dataset.transform = JSON.stringify(state);
  updateTransformPanel(state);
}

function updateTransformPanel(state) {
  if (transformFields.x) transformFields.x.textContent = formatMeters(state.x);
  if (transformFields.y) transformFields.y.textContent = formatMeters(state.y);
  if (transformFields.z) transformFields.z.textContent = formatMeters(state.z);
  if (transformFields.yaw) transformFields.yaw.textContent = formatDegrees(state.yawDeg);
  if (transformFields.scale) transformFields.scale.textContent = formatScale(state.scale);
  if (transformFields.tool) transformFields.tool.textContent = state.tool;
}

function formatMeters(value) {
  return `${value.toFixed(2)} m`;
}

function formatDegrees(value) {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return `${wrapped.toFixed(1)} deg`;
}

function formatScale(value) {
  return `${value.toFixed(2)} x`;
}

function loadModel() {
  installModelScene(makeReferenceProxyModel(), {
    name: "sample-simple.glb",
    source: "sample",
    sourceLabel: "sample",
    uploadLabel: "sample",
    kind: "sample",
  });
}

function loadLocalModelFiles(files) {
  const modelFile = files.find(isModelFile);
  if (!modelFile) {
    setUploadStatus("pick model");
    showLoading("Need model file");
    return;
  }

  const localAssetMap = new Map();
  const objectUrls = [];
  for (const file of files) {
    const objectUrl = URL.createObjectURL(file);
    objectUrls.push(objectUrl);
    const names = new Set([
      file.name,
      `./${file.name}`,
      file.webkitRelativePath,
      file.webkitRelativePath ? `./${file.webkitRelativePath}` : "",
    ]);
    for (const name of names) {
      if (name) localAssetMap.set(name, objectUrl);
    }
  }

  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const decoded = decodeURIComponent(url);
    const cleanUrl = decoded.split(/[?#]/)[0];
    const fileName = cleanUrl.split("/").pop();
    return localAssetMap.get(decoded)
      || localAssetMap.get(cleanUrl)
      || localAssetMap.get(fileName)
      || url;
  });

  setUploadStatus("loading");
  const mtlFile = files.find((file) => /\.mtl$/i.test(file.name));
  loadModelFromUrl(localAssetMap.get(modelFile.name), {
    name: modelFile.name,
    source: "local",
    sourceLabel: "browser",
    uploadLabel: "local",
    kind: "user",
    manager,
    mtlUrl: mtlFile ? localAssetMap.get(mtlFile.name) : "",
    objectUrls,
  });
}

function loadModelFromUrl(url, meta) {
  showLoading(`Loading ${meta.name}`);
  const extension = getExtension(meta.name);

  if (extension === "glb" || extension === "gltf") {
    loadGltfModel(url, meta);
    return;
  }

  if (extension === "obj") {
    loadObjModel(url, meta);
    return;
  }

  if (extension === "fbx") {
    loadFbxModel(url, meta);
    return;
  }

  if (extension === "stl") {
    loadStlModel(url, meta);
    return;
  }

  setUploadStatus("unsupported");
  showLoading("Unsupported model");
}

function loadGltfModel(url, meta) {
  const loader = new GLTFLoader(meta.manager);

  loader.load(
    url,
    (gltf) => {
      installModel(gltf, meta);
    },
    (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      showLoading(`Loading ${meta.name} ${progress}%`);
    },
    (error) => {
      console.error(error);
      if (meta.objectUrls) revokeObjectUrls(meta.objectUrls);
      setUploadStatus("failed");
      showLoading(`${meta.name} failed`);
      canvas.dataset.model = JSON.stringify({
        loaded: Boolean(loadedModel),
        error: String(error?.message || error),
        name: loadedModel?.name || "",
      });
    }
  );
}

function loadObjModel(url, meta) {
  const loadObject = (materials = null) => {
    const loader = new OBJLoader(meta.manager);
    if (materials) loader.setMaterials(materials);
    loader.load(
      url,
      (root) => installModelScene(root, meta),
      handleModelProgress(meta),
      (error) => handleModelLoadError(error, meta)
    );
  };

  if (!meta.mtlUrl) {
    loadObject();
    return;
  }

  const mtlLoader = new MTLLoader(meta.manager);
  mtlLoader.load(
    meta.mtlUrl,
    (materials) => {
      materials.preload();
      loadObject(materials);
    },
    undefined,
    () => loadObject()
  );
}

function loadFbxModel(url, meta) {
  const loader = new FBXLoader(meta.manager);
  loader.load(
    url,
    (root) => installModelScene(root, meta, root.animations || []),
    handleModelProgress(meta),
    (error) => handleModelLoadError(error, meta)
  );
}

function loadStlModel(url, meta) {
  const loader = new STLLoader(meta.manager);
  loader.load(
    url,
    (geometry) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0xf7f4ee,
        roughness: 0.78,
        metalness: 0.03,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = meta.name.replace(/\.[^.]+$/, "");
      const root = new THREE.Group();
      root.add(mesh);
      installModelScene(root, meta);
    },
    handleModelProgress(meta),
    (error) => handleModelLoadError(error, meta)
  );
}

function handleModelProgress(meta) {
  return (event) => {
    if (!event.lengthComputable) return;
    const progress = Math.round((event.loaded / event.total) * 100);
    showLoading(`Loading ${meta.name} ${progress}%`);
  };
}

function handleModelLoadError(error, meta) {
  console.error(error);
  if (meta.objectUrls) revokeObjectUrls(meta.objectUrls);
  setUploadStatus("failed");
  showLoading(`${meta.name} failed`);
  canvas.dataset.model = JSON.stringify({
    loaded: Boolean(loadedModel),
    error: String(error?.message || error),
    name: loadedModel?.name || "",
  });
}

function installModel(gltf, meta) {
  installModelScene(gltf.scene, meta, gltf.animations);
}

function installModelScene(root, meta, animations = []) {
  root.name = meta.name;
  const meshCount = prepareModelForRendering(root);
  normalizeModel(root);

  if (meta.kind === "user" && uploadedModelSlot?.root && uploadedModelSlot.root !== loadedModel) {
    disposeObject(uploadedModelSlot.root);
    revokeObjectUrls(uploadedModelSlot.objectUrls || []);
    uploadedModelSlot = null;
  }

  clearLoadedModel();
  activeLocalObjectUrls = meta.objectUrls || [];

  modelRig.add(root);
  loadedModel = root;
  modelRig.position.set(0, 0, 0);
  modelRig.scale.setScalar(1);
  modelScale = 1;
  modelYaw = initialModelYaw;
  modelRig.rotation.y = modelYaw;
  activeModelKind = meta.kind || meta.source;

  setRenderMode(renderMode);

  if (animations.length > 0) {
    mixer = new THREE.AnimationMixer(root);
    for (const clip of animations) {
      mixer.clipAction(clip).play();
    }
  }

  hideLoading();
  setActiveTool("view");
  updateModelLabels(root.name, meta);
  const slot = {
    animations,
    meshCount,
    meta,
    objectUrls: meta.objectUrls || [],
    root,
  };
  if (meta.kind === "user") uploadedModelSlot = slot;
  canvas.dataset.model = JSON.stringify({
    loaded: true,
    meshes: meshCount,
    displayName: customModelName || root.name,
    name: root.name,
    source: meta.source,
    kind: activeModelKind,
  });
}

function clearLoadedModel({ dispose = true } = {}) {
  if (mixer && loadedModel) {
    mixer.stopAllAction();
    mixer.uncacheRoot(loadedModel);
  }
  mixer = null;

  if (loadedModel) {
    const modelToClear = loadedModel;
    modelRig.remove(loadedModel);
    if (dispose) {
      if (uploadedModelSlot?.root === modelToClear) {
        revokeObjectUrls(uploadedModelSlot.objectUrls || []);
        uploadedModelSlot = null;
      }
      disposeObject(modelToClear);
    }
    loadedModel = null;
  }
}

function disposeObject(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry) geometries.add(child.geometry);
    for (const material of materialList(child.material)) {
      if (material) materials.add(material);
    }
    for (const material of materialList(child.userData.originalMaterial)) {
      if (material) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) disposeMaterial(material);
}

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture && value !== toonGradient) value.dispose();
  }
  material.dispose?.();
}

function revokeObjectUrls(urls) {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }
}

function updateModelLabels(name, meta) {
  const displayName = customModelName || name;
  if (modelNameFields.viewport) modelNameFields.viewport.textContent = `(0) ${displayName}`;
  if (modelNameFields.object) modelNameFields.object.textContent = displayName;
  if (modelNameFields.modifier) modelNameFields.modifier.textContent = displayName;
  if (modelSourceField && meta.sourceLabel) modelSourceField.textContent = meta.sourceLabel;
  if (meta.uploadLabel) setUploadStatus(meta.uploadLabel);
  updateModelNameField();
}

function setUploadStatus(text) {
  if (uploadStatus) uploadStatus.textContent = text;
}

function showUploadedModel() {
  if (!uploadedModelSlot) {
    setUploadStatus("need model");
    showLoading("Upload model first");
    window.setTimeout(hideLoading, 1000);
    return;
  }

  if (loadedModel === uploadedModelSlot.root) {
    setUploadStatus("modeling");
    return;
  }

  if (loadedModel) {
    clearLoadedModel({ dispose: loadedModel !== uploadedModelSlot.root });
  }

  const { root, meta, animations, meshCount } = uploadedModelSlot;
  modelRig.add(root);
  loadedModel = root;
  modelRig.position.set(0, 0, 0);
  modelRig.scale.setScalar(1);
  modelScale = 1;
  modelYaw = initialModelYaw;
  modelRig.rotation.y = modelYaw;
  activeModelKind = "user";
  activeLocalObjectUrls = uploadedModelSlot.objectUrls || [];

  setRenderMode(renderMode);
  if (animations.length > 0) {
    mixer = new THREE.AnimationMixer(root);
    for (const clip of animations) mixer.clipAction(clip).play();
  }

  updateModelLabels(root.name, meta);
  setUploadStatus("modeling");
  setActiveTool("view");
  canvas.dataset.model = JSON.stringify({
    loaded: true,
    meshes: meshCount,
    displayName: customModelName || root.name,
    name: root.name,
    source: meta.source,
    kind: activeModelKind,
  });
}

function loadReferenceImage(file) {
  if (!isImageFile(file)) {
    if (refStatus) refStatus.textContent = "pick image";
    showLoading("Need image ref");
    return;
  }

  if (activeRefObjectUrl) URL.revokeObjectURL(activeRefObjectUrl);
  activeRefObjectUrl = URL.createObjectURL(file);
  hasCustomRef = true;

  if (refImage) {
    refImage.src = activeRefObjectUrl;
    refImage.alt = `${file.name} reference image`;
  }
  if (refCaption) {
    refCaption.innerHTML = `<del>refe</del><span class="fix">ref</span> ${escapeText(file.name)}`;
  }
  if (refStatus) refStatus.textContent = file.name;
  hideLoading();
}

function makeReferenceProxyModel() {
  const root = new THREE.Group();
  root.name = "ref-simple.glb";

  const fur = new THREE.MeshStandardMaterial({ color: 0xfffbf3, roughness: 0.82, metalness: 0.02 });
  const innerEar = new THREE.MeshStandardMaterial({ color: 0x92dcff, roughness: 0.76, metalness: 0.02 });
  const blush = new THREE.MeshStandardMaterial({ color: 0xffb8bb, roughness: 0.9, metalness: 0 });
  const hoodie = new THREE.MeshStandardMaterial({ color: 0xf2bd20, roughness: 0.72, metalness: 0.02 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x174574, roughness: 0.66, metalness: 0.06 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x16253d, roughness: 0.54, metalness: 0.12 });
  const red = new THREE.MeshStandardMaterial({ color: 0xff1f1f, roughness: 0.35, metalness: 0.25 });
  const eyeBlue = new THREE.MeshStandardMaterial({ color: 0x20a5ef, roughness: 0.26, metalness: 0.08 });

  addPart(root, new THREE.SphereGeometry(0.72, 32, 20), fur, [0, 2.12, 0], [1.12, 0.9, 0.96], "head");
  addPart(root, new THREE.SphereGeometry(0.19, 16, 12), blush, [-0.44, 1.92, 0.57], [1, 0.5, 0.2], "cheek-left");
  addPart(root, new THREE.SphereGeometry(0.19, 16, 12), blush, [0.44, 1.92, 0.57], [1, 0.5, 0.2], "cheek-right");
  addPart(root, new THREE.SphereGeometry(0.42, 24, 18), fur, [-0.42, 3.02, -0.02], [0.42, 1.52, 0.28], "ear-left", [0, 0, 0.28]);
  addPart(root, new THREE.SphereGeometry(0.42, 24, 18), fur, [0.42, 3.02, -0.02], [0.42, 1.52, 0.28], "ear-right", [0, 0, -0.28]);
  addPart(root, new THREE.SphereGeometry(0.25, 20, 14), innerEar, [-0.42, 3.03, 0.06], [0.32, 1.12, 0.08], "inner-ear-left", [0, 0, 0.28]);
  addPart(root, new THREE.SphereGeometry(0.25, 20, 14), innerEar, [0.42, 3.03, 0.06], [0.32, 1.12, 0.08], "inner-ear-right", [0, 0, -0.28]);
  addPart(root, new THREE.SphereGeometry(0.58, 28, 18), hoodie, [0, 1.1, 0], [0.92, 1.08, 0.66], "hoodie");
  addPart(root, new THREE.BoxGeometry(0.16, 0.72, 0.08), dark, [0, 1.1, 0.6], [1, 1, 1], "zipper");
  addPart(root, new THREE.SphereGeometry(0.24, 18, 12), blue, [-0.28, 0.38, 0], [0.9, 1.1, 0.85], "leg-left");
  addPart(root, new THREE.SphereGeometry(0.24, 18, 12), blue, [0.28, 0.38, 0], [0.9, 1.1, 0.85], "leg-right");
  addPart(root, new THREE.SphereGeometry(0.24, 18, 12), dark, [-0.34, 0.02, 0.14], [1.35, 0.5, 0.82], "shoe-left");
  addPart(root, new THREE.SphereGeometry(0.24, 18, 12), dark, [0.34, 0.02, 0.14], [1.35, 0.5, 0.82], "shoe-right");
  addPart(root, new THREE.SphereGeometry(0.17, 20, 14), dark, [-0.34, 2.08, 0.64], [1.15, 1.15, 0.32], "visor-rim");
  addPart(root, new THREE.SphereGeometry(0.13, 20, 14), red, [-0.34, 2.08, 0.69], [1, 1, 0.24], "red-lens");
  addPart(root, new THREE.SphereGeometry(0.12, 20, 14), eyeBlue, [0.28, 2.1, 0.66], [0.75, 1, 0.24], "blue-eye");

  return root;
}

function addPart(parent, geometry, material, position, scale, name, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function isModelFile(file) {
  return /\.(glb|gltf|obj|fbx|stl)$/i.test(file.name);
}

function isImageFile(file) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

function getExtension(name) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function escapeText(text) {
  const template = document.createElement("template");
  template.textContent = text;
  return template.innerHTML;
}

function prepareModelForRendering(root) {
  const meshes = [];
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.frustumCulled = false;
    child.userData.originalMaterial = cloneMaterialSet(child.material);
    child.userData.sketchOutlines = [];
    meshes.push(child);
  });

  return meshes.length;
}

function setRenderMode(mode) {
  renderMode = mode;
  if (loadedModel) applyRenderMode(loadedModel, renderMode);
  updateRenderModeUI();
  writeTransformState();
}

function applyRenderMode(root, mode) {
  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh && !child.userData.isSketchOutline) meshes.push(child);
  });

  for (const mesh of meshes) {
    removeSketchOutlines(mesh);
    disposeRenderMaterials(mesh.material);

    if (mode === "normal") {
      mesh.material = cloneMaterialSet(mesh.userData.originalMaterial);
      mesh.renderOrder = 1;
    } else {
      mesh.material = Array.isArray(mesh.userData.originalMaterial)
        ? mesh.userData.originalMaterial.map((material) => makeSketchMaterial(material))
        : makeSketchMaterial(mesh.userData.originalMaterial);
      mesh.renderOrder = 2;
      addSketchOutline(mesh);
    }
  }

  return meshes.length;
}

function addSketchOutline(mesh) {
  const outline = new THREE.Mesh(mesh.geometry, makeOutlineMaterial(0.72));
  outline.name = "blue-sketch-outline";
  outline.userData.isSketchOutline = true;
  outline.scale.setScalar(1.045);
  outline.renderOrder = 0;
  outline.frustumCulled = false;
  mesh.userData.sketchOutlines = mesh.userData.sketchOutlines || [];
  mesh.userData.sketchOutlines.push(outline);
  mesh.add(outline);
}

function removeSketchOutlines(mesh) {
  for (const outline of mesh.userData.sketchOutlines || []) {
    mesh.remove(outline);
    disposeRenderMaterials(outline.material);
  }
  mesh.userData.sketchOutlines = [];
}

function cloneMaterialSet(material) {
  if (Array.isArray(material)) return material.map((item) => item?.clone?.() || new THREE.MeshStandardMaterial());
  return material?.clone?.() || new THREE.MeshStandardMaterial({ color: paperWhite });
}

function materialList(material) {
  return Array.isArray(material) ? material : [material];
}

function disposeRenderMaterials(material) {
  for (const item of materialList(material)) {
    item?.dispose?.();
  }
}

function updateRenderModeUI() {
  const text = getText();
  if (renderModeLabel) renderModeLabel.textContent = renderMode === "sketch" ? text.sketchView : text.normalView;
  if (renderModeField) renderModeField.textContent = renderMode === "sketch" ? text.renderSketch : text.renderNormal;
  document.body.classList.toggle("render-normal", renderMode === "normal");
}

function makeSketchMaterial(source = {}) {
  const color = source.color ? source.color.clone() : paperWhite.clone();
  color.lerp(paperWhite, source.map ? 0.08 : 0.5);

  const material = new THREE.MeshToonMaterial({
    color,
    map: source.map || null,
    normalMap: source.normalMap || null,
    gradientMap: toonGradient,
    transparent: Boolean(source.transparent),
    opacity: source.opacity ?? 1,
    alphaTest: source.alphaTest ?? 0,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  if (material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
  }

  material.name = `sketch-${source.name || "material"}`;
  return material;
}

function makeOutlineMaterial(opacity) {
  return new THREE.MeshBasicMaterial({
    color: ink,
    side: THREE.BackSide,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

function addScribbleMeshLines(mesh) {
  const source = mesh.geometry;
  const position = source?.attributes?.position;
  const index = source?.index;
  if (!position || !index) return;

  const triangleCount = Math.floor(index.count / 3);
  const maxSegments = 6200;
  const stride = Math.max(1, Math.floor(triangleCount / maxSegments));
  const points = [];
  const temp = new THREE.Vector3();

  for (let tri = 0; tri < triangleCount; tri += stride) {
    const a = index.getX(tri * 3);
    const b = index.getX(tri * 3 + 1);
    const c = index.getX(tri * 3 + 2);
    const pick = tri % 3;
    pushEdge(points, position, pick === 0 ? a : b, pick === 0 ? b : c, temp, tri);
    if (tri % (stride * 6 + 1) === 0) {
      pushEdge(points, position, c, a, temp, tri + 19);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

  const material = new THREE.LineBasicMaterial({
    color: ink,
    transparent: true,
    opacity: 0.16,
    depthTest: true,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(geometry, material);
  lines.name = "loose-pencil-lines";
  lines.scale.setScalar(1.004);
  lines.renderOrder = 5;
  lines.frustumCulled = false;
  mesh.add(lines);
}

function pushEdge(points, position, from, to, temp, seed) {
  pushPoint(points, position, from, temp, seed);
  pushPoint(points, position, to, temp, seed + 3);
}

function pushPoint(points, position, vertexIndex, temp, seed) {
  temp.fromBufferAttribute(position, vertexIndex);
  const wobble = 0.0018;
  points.push(
    temp.x + Math.sin(seed * 12.9898) * wobble,
    temp.y + Math.sin(seed * 78.233) * wobble,
    temp.z + Math.sin(seed * 37.719) * wobble
  );
}

function normalizeModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const targetSize = 2.75;
  const scale = targetSize / Math.max(maxDimension, 0.001);

  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

  const scaledBox = new THREE.Box3().setFromObject(root);
  root.position.y -= scaledBox.min.y;

  const finalBox = new THREE.Box3().setFromObject(root);
  const finalSize = finalBox.getSize(new THREE.Vector3());
  const finalCenter = finalBox.getCenter(new THREE.Vector3());

  controls.target.set(finalCenter.x, finalBox.min.y + finalSize.y * 0.54, finalCenter.z);
  fitCameraForViewport(canvas.clientWidth / Math.max(canvas.clientHeight, 1), finalSize);
  controls.update();

  canvas.dataset.bounds = JSON.stringify({
    width: Number(finalSize.x.toFixed(3)),
    height: Number(finalSize.y.toFixed(3)),
    depth: Number(finalSize.z.toFixed(3)),
    scale: Number(scale.toFixed(3)),
  });
}

function makeGround(parent) {
  const ground = new THREE.Group();
  ground.name = "sketch-ground";

  sketchCurve(ground, [[-4.8, 0, 0], [0, 0, 0], [4.8, 0, 0]], lineMaterial, 2);
  sketchCurve(ground, [[0, 0, -4.5], [0, 0, 0], [0, 0, 4.5]], faintLineMaterial, 2);

  for (let i = -2; i <= 2; i += 1) {
    if (i === 0) continue;
    sketchCurve(ground, [[-4.2, 0, i], [0, 0, i], [4.2, 0, i]], faintLineMaterial, 1);
    sketchCurve(ground, [[i, 0, -3.8], [i, 0, 0], [i, 0, 3.8]], faintLineMaterial, 1);
  }

  parent.add(ground);
}

function sketchCurve(parent, points, material, repeats = 1) {
  for (let i = 0; i < repeats; i += 1) {
    const jittered = points.map(([x, y, z], index) => {
      const n = (i + 1) * (index + 2);
      return new THREE.Vector3(
        x + Math.sin(n * 1.8) * 0.012,
        y + Math.cos(n * 1.35) * 0.01,
        z + Math.sin(n * 0.9) * 0.011
      );
    });
    const curve = new THREE.CatmullRomCurve3(jittered);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
    geometry.userData.basePositions = Float32Array.from(geometry.attributes.position.array);
    const line = new THREE.Line(geometry, material.clone());
    line.userData.jitter = 0.0035 + i * 0.0015;
    parent.add(line);
    pencilLines.push(line);
  }
}

function makeToonGradient() {
  const gradient = document.createElement("canvas");
  gradient.width = 5;
  gradient.height = 1;
  const context = gradient.getContext("2d");
  context.fillStyle = "#fffefa";
  context.fillRect(0, 0, 2, 1);
  context.fillStyle = "#eef7ff";
  context.fillRect(2, 0, 1, 1);
  context.fillStyle = "#dfe6f4";
  context.fillRect(3, 0, 1, 1);
  context.fillStyle = "#cfd7ec";
  context.fillRect(4, 0, 1, 1);

  const texture = new THREE.CanvasTexture(gradient);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function resizeRenderer() {
  const { clientWidth, clientHeight } = canvas;
  const width = Math.max(1, clientWidth);
  const height = Math.max(1, clientHeight);
  const pixelRatio = renderer.getPixelRatio();
  const targetWidth = Math.floor(width * pixelRatio);
  const targetHeight = Math.floor(height * pixelRatio);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCameraForViewport(width / height);
    camera.updateProjectionMatrix();
  }
}

function fitCameraForViewport(aspect, size = null) {
  const nextMode = aspect < 0.75 ? "portrait" : "wide";
  if (nextMode === viewportMode && !size) return;
  viewportMode = nextMode;

  const height = size?.y || 2.75;
  if (nextMode === "portrait") {
    camera.position.set(-4.25, height * 0.82 + 0.25, 6.35);
    controls.target.set(0, height * 0.52, 0);
  } else {
    camera.position.set(-3.55, height * 0.78 + 0.25, 4.95);
    controls.target.set(0, height * 0.53, 0);
  }
  controls.update();
}

function jitterPencilLines(seconds) {
  for (const line of pencilLines) {
    const attr = line.geometry.attributes.position;
    const base = line.geometry.userData.basePositions;
    if (!attr || !base) continue;

    const amount = line.userData.jitter ?? 0.002;
    for (let i = 0; i < attr.count; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const z = base[i * 3 + 2];
      attr.setXYZ(
        i,
        x + Math.sin(seconds * 4.2 + i * 1.7) * amount,
        y + Math.cos(seconds * 3.1 + i * 1.2) * amount,
        z + Math.sin(seconds * 3.7 + i * 0.8) * amount
      );
    }
    attr.needsUpdate = true;
  }
}

function showLoading(text) {
  if (!loadingNote) return;
  loadingNote.textContent = text;
  loadingNote.classList.remove("is-hidden");
}

function hideLoading() {
  if (!loadingNote) return;
  loadingNote.classList.add("is-hidden");
}

function animate(time = 0) {
  const seconds = time * 0.001;
  const delta = clock.getDelta();

  resizeRenderer();
  if (mixer) mixer.update(delta);
  if (loadedModel && !isDragging && activeTool === "view") {
    modelRig.rotation.y = modelYaw + Math.sin(seconds * 0.22) * 0.045;
  } else if (loadedModel && !transformDrag) {
    modelRig.rotation.y = modelYaw;
  }
  jitterPencilLines(seconds);
  controls.update();
  renderer.render(scene, camera);

  if (time - lastStatsWrite > 1500) {
    lastStatsWrite = time;
    canvas.dataset.stats = JSON.stringify(window.sketchPreview.canvasStats());
  }

  requestAnimationFrame(animate);
}

window.sketchPreview = {
  canvasStats() {
    const gl = renderer.getContext();
    return {
      ok: Boolean(loadedModel),
      loaded: Boolean(loadedModel),
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      tool: activeTool,
      position: {
        x: Number(modelRig.position.x.toFixed(3)),
        y: Number(modelRig.position.y.toFixed(3)),
        z: Number(modelRig.position.z.toFixed(3)),
      },
      yaw: Number(modelYaw.toFixed(3)),
      scale: Number(modelScale.toFixed(3)),
      renderMode,
      userModelUploaded: Boolean(uploadedModelSlot),
      hasCustomRef,
      activeModelKind,
    };
  },
};

animate();
