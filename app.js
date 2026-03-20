const groupTitles = {
  chest: "Грудь",
  shoulders: "Плечи",
  arms: "Руки",
  core: "Пресс и корпус",
  back: "Спина",
  glutes: "Ягодицы",
  legs: "Ноги",
  calves: "Голени",
};

const loads = {
  chest: 52,
  shoulders: 46,
  arms: 63,
  core: 58,
  back: 55,
  glutes: 49,
  legs: 69,
  calves: 43,
};

const viewButtons = [...document.querySelectorAll(".view-btn")];
const bodyViews = [...document.querySelectorAll(".body-svg")];
const muscles = [...document.querySelectorAll(".muscle")];
const sliders = [...document.querySelectorAll("[data-group-slider]")];
const outputs = [...document.querySelectorAll("[data-group-output]")];
const focusMuscle = document.getElementById("focus-muscle");
const focusGroup = document.getElementById("focus-group");
const focusLoad = document.getElementById("focus-load");

let selectedMuscleId = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function interpolateColor(stops, t) {
  const level = clamp(t, 0, 1);
  const scaled = level * (stops.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(stops.length - 1, index + 1);
  const localT = scaled - index;
  const [r1, g1, b1] = stops[index];
  const [r2, g2, b2] = stops[nextIndex];

  const r = Math.round(r1 + (r2 - r1) * localT);
  const g = Math.round(g1 + (g2 - g1) * localT);
  const b = Math.round(b1 + (b2 - b1) * localT);
  return `rgb(${r}, ${g}, ${b})`;
}

function muscleColor(loadLevel) {
  const normalized = clamp(loadLevel / 100, 0, 1);
  const palette = [
    [112, 121, 132],
    [97, 143, 178],
    [92, 196, 241],
    [255, 168, 95],
    [255, 88, 88],
  ];
  return interpolateColor(palette, normalized);
}

function applyMuscleVisual(path, loadLevel) {
  const normalized = clamp(loadLevel / 100, 0, 1);
  path.style.fill = muscleColor(loadLevel);
  path.style.fillOpacity = (0.3 + normalized * 0.68).toFixed(2);
}

function refreshAllMuscles() {
  muscles.forEach((path) => {
    const group = path.dataset.group;
    const level = loads[group] ?? 0;
    applyMuscleVisual(path, level);
  });
}

function refreshOutputs() {
  outputs.forEach((output) => {
    const group = output.dataset.groupOutput;
    output.textContent = `${loads[group]}%`;
  });
}

function setView(nextView) {
  viewButtons.forEach((button) => {
    const active = button.dataset.view === nextView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  bodyViews.forEach((svg) => {
    const active = svg.id === `body-${nextView}`;
    svg.classList.toggle("is-active", active);
  });
}

function clearSelection() {
  muscles.forEach((path) => path.classList.remove("is-selected"));
}

function updateFocusByPath(path) {
  if (!path) {
    focusMuscle.textContent = "Нажмите на мышцу";
    focusGroup.textContent = "Группа: -";
    focusLoad.textContent = "Нагрузка: -";
    return;
  }

  const muscleName = path.dataset.name;
  const group = path.dataset.group;
  const level = loads[group] ?? 0;

  focusMuscle.textContent = muscleName;
  focusGroup.textContent = `Группа: ${groupTitles[group] ?? group}`;
  focusLoad.textContent = `Нагрузка: ${level}%`;
}

function selectMuscle(path) {
  clearSelection();
  selectedMuscleId = path.id;
  path.classList.add("is-selected");
  updateFocusByPath(path);
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.view);
  });
});

sliders.forEach((slider) => {
  slider.addEventListener("input", (event) => {
    const group = event.currentTarget.dataset.groupSlider;
    const value = Number(event.currentTarget.value);
    loads[group] = clamp(value, 0, 100);
    refreshAllMuscles();
    refreshOutputs();

    if (selectedMuscleId) {
      const selected = document.getElementById(selectedMuscleId);
      updateFocusByPath(selected);
    }
  });
});

muscles.forEach((path) => {
  path.addEventListener("click", () => {
    selectMuscle(path);
  });

  path.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectMuscle(path);
    }
  });

  path.setAttribute("tabindex", "0");
  path.setAttribute("role", "button");
});

refreshOutputs();
refreshAllMuscles();
updateFocusByPath(null);
