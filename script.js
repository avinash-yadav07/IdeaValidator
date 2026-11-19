const form = document.getElementById("validation-form");
const fields = {
  ideaName: document.getElementById("idea-name"),
  problem: document.getElementById("problem"),
  audience: document.getElementById("audience"),
  solution: document.getElementById("solution"),
  alternatives: document.getElementById("alternatives"),
  market: document.getElementById("market")
};
const scoreNumber = document.getElementById("score-number");
const scoreGauge = document.getElementById("score-gauge");
const scoreTitle = document.getElementById("score-title");
const scoreDescription = document.getElementById("score-description");
const scoreTip = document.getElementById("score-tip");
const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");
const progressLabel = document.getElementById("progress-label");
const savedStatus = document.getElementById("saved-status");
const evidenceChecks = Array.from(form.querySelectorAll('input[name="evidence"]'));
const storageKey = "ideaproof-validation-progress";

function getScore() {
  const problemText = fields.problem.value.trim();
  const audienceText = fields.audience.value.trim();
  const solutionText = fields.solution.value.trim();
  const problem = problemText.length >= 25 ? 25 : problemText.length >= 10 ? 15 : problemText ? 7 : 0;
  const audience = audienceText.length >= 12 ? 25 : audienceText ? 12 : 0;
  const solution = solutionText.length >= 20 ? 25 : solutionText ? 12 : 0;
  const research = evidenceChecks.filter((checkbox) => checkbox.checked).length * 10;
  const alternatives = fields.alternatives.value.trim() ? 5 : 0;
  const market = fields.market.value && fields.market.value !== "unknown" ? 5 : 0;
  const total = Math.min(100, problem + audience + solution + research + alternatives + market);
  return {
    total,
    problem: Math.round(problem / 25 * 100),
    audience: Math.round(audience / 25 * 100),
    solution: Math.round(solution / 25 * 100),
    evidence: Math.round(Math.min(30, research + alternatives + market) / 40 * 100)
  };
}

function updateMetric(name, value) {
  document.getElementById(`${name}-score`).textContent = `${value}%`;
  document.getElementById(`${name}-track`).style.width = `${value}%`;
}

function updateScore() {
  const result = getScore();
  scoreNumber.textContent = result.total;
  scoreGauge.style.background = `conic-gradient(#7466e3 ${result.total * 3.6}deg, #e9e9f1 ${result.total * 3.6}deg)`;
  updateMetric("problem", result.problem);
  updateMetric("audience", result.audience);
  updateMetric("solution", result.solution);
  updateMetric("evidence", result.evidence);

  const filled = [fields.problem, fields.audience, fields.solution, fields.alternatives, fields.market].filter((field) => field.value.trim()).length + evidenceChecks.filter((checkbox) => checkbox.checked).length;
  const progress = Math.round(filled / 8 * 100);
  progressBar.style.width = `${progress}%`;
  progressPercent.textContent = `${progress}%`;
  progressLabel.textContent = progress === 0 ? "A few thoughtful answers are all it takes to get started." : progress === 100 ? "You've completed your validation snapshot." : "Keep going — each answer brings your idea into focus.";

  if (result.total >= 75) {
    scoreTitle.textContent = "Promising potential";
    scoreDescription.textContent = "You've got encouraging signals. Keep testing with real customers.";
    scoreTip.textContent = "Great momentum. Keep talking to customers and test whether they'll pay.";
  } else if (result.total >= 45) {
    scoreTitle.textContent = "A good start";
    scoreDescription.textContent = "There's something here. A little more research can sharpen it.";
    scoreTip.textContent = "Try to find real evidence that your target customers want this solution.";
  } else if (result.total > 0) {
    scoreTitle.textContent = "Taking shape";
    scoreDescription.textContent = "You're starting to build a picture. Keep adding detail.";
    scoreTip.textContent = "Get specific about who feels this problem most and how they solve it today.";
  } else {
    scoreTitle.textContent = "Your idea starts here";
    scoreDescription.textContent = "Answer a few questions to see how your idea is shaping up.";
    scoreTip.textContent = "Start by describing the problem in one clear, specific sentence.";
  }

  for (const [fieldId, field] of Object.entries(fields)) {
    const counter = document.querySelector(`[data-count="${fieldId}"]`);
    if (counter) counter.textContent = `${field.value.length} / 500`;
  }
}

function saveProgress(showMessage) {
  const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
  data.evidence = evidenceChecks.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
  localStorage.setItem(storageKey, JSON.stringify(data));
  if (showMessage) {
    savedStatus.textContent = "Saved just now";
    window.setTimeout(() => { savedStatus.textContent = ""; }, 2500);
  }
}

function restoreProgress() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    for (const [key, field] of Object.entries(fields)) {
      if (typeof data[key] === "string") field.value = data[key];
    }
    if (Array.isArray(data.evidence)) {
      evidenceChecks.forEach((checkbox) => { checkbox.checked = data.evidence.includes(checkbox.value); });
    }
  } catch (error) {
    localStorage.removeItem(storageKey);
    console.error("Could not restore saved validation progress:", error);
  }
}

form.addEventListener("input", updateScore);
form.addEventListener("change", updateScore);
document.getElementById("save-button").addEventListener("click", () => saveProgress(true));
document.getElementById("next-button").addEventListener("click", () => {
  const firstMissingField = [fields.problem, fields.audience, fields.solution].find((field) => !field.value.trim());
  if (firstMissingField) {
    firstMissingField.focus();
    firstMissingField.reportValidity();
    return;
  }
  document.querySelector(".score-card").scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("reset-button").addEventListener("click", () => {
  form.reset();
  localStorage.removeItem(storageKey);
  savedStatus.textContent = "";
  updateScore();
  fields.ideaName.focus();
});

restoreProgress();
updateScore();
