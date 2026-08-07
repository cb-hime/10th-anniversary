const startScreen = document.querySelector("#startScreen");
const loadingScreen = document.querySelector("#loadingScreen");
const startButton = document.querySelector("#startButton");
const scanUI = document.querySelector("#scanUI");
const countdownOverlay = document.querySelector("#countdownOverlay");
const countdownNumber = document.querySelector("#countdownNumber");
const videoOverlay = document.querySelector("#videoOverlay");
const birthdayVideo = document.querySelector("#birthdayVideo");
const closeVideo = document.querySelector("#closeVideo");
const tapToPlay = document.querySelector("#tapToPlay");
const playButton = document.querySelector("#playButton");
const messageOverlay = document.querySelector("#messageOverlay");
const scanAgainButton = document.querySelector("#scanAgainButton");
const errorBox = document.querySelector("#errorBox");
const arScene = document.querySelector("#arScene");
const imageTarget = document.querySelector("#imageTarget");

let arStarted = false;
let videoShown = false;
let targetIsVisible = false;
let countdownRunning = false;

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showError(message) {
  errorBox.textContent = message;
  show(errorBox);
}

function hideError() {
  hide(errorBox);
}

function resetVideo() {
  birthdayVideo.pause();
  try { birthdayVideo.currentTime = 0; } catch (_) {}
  hide(tapToPlay);
}

async function primeVideoForIOS() {
  birthdayVideo.muted = true;
  try {
    await birthdayVideo.play();
    birthdayVideo.pause();
    birthdayVideo.currentTime = 0;
  } catch (_) {}
  birthdayVideo.muted = false;
}

async function startAR() {
  hideError();
  hide(startScreen);
  show(loadingScreen);

  try {
    await primeVideoForIOS();

    const arSystem = arScene.systems["mindar-image-system"];
    if (!arSystem) throw new Error("MindAR system not ready");

    await arSystem.start();
    arStarted = true;

    setTimeout(() => {
      hide(loadingScreen);
      show(scanUI);
    }, 250);
  } catch (error) {
    console.error(error);
    hide(loadingScreen);
    show(startScreen);
    showError("カメラを開始できませんでした。Safariのカメラ許可を確認して、ページを再読み込みしてください。");
  }
}

async function runCountdown() {
  if (countdownRunning || videoShown) return;

  countdownRunning = true;
  hide(scanUI);
  show(countdownOverlay);

  for (const n of ["3", "2", "1"]) {
    countdownNumber.textContent = n;
    countdownNumber.style.animation = "none";
    void countdownNumber.offsetWidth;
    countdownNumber.style.animation = "countdownPop .72s ease both";
    await wait(760);
  }

  hide(countdownOverlay);
  countdownRunning = false;

  // Only start if the target is still in view after the countdown.
  if (targetIsVisible) {
    await playBirthdayVideo();
  } else {
    show(scanUI);
  }
}

async function playBirthdayVideo() {
  if (videoShown) return;
  videoShown = true;

  hide(scanUI);
  hide(countdownOverlay);
  show(videoOverlay);
  birthdayVideo.currentTime = 0;

  try {
    await birthdayVideo.play();
  } catch (error) {
    console.warn("Autoplay blocked:", error);
    show(tapToPlay);
  }
}

function closeBirthdayVideo() {
  resetVideo();
  hide(videoOverlay);
  videoShown = false;

  if (!targetIsVisible) show(scanUI);
}

function finishBirthdayVideo() {
  resetVideo();
  hide(videoOverlay);
  show(messageOverlay);
}

startButton.addEventListener("click", startAR);

imageTarget.addEventListener("targetFound", () => {
  targetIsVisible = true;
  if (!videoShown && !countdownRunning && messageOverlay.classList.contains("hidden")) {
    runCountdown();
  }
});

imageTarget.addEventListener("targetLost", () => {
  targetIsVisible = false;

  if (!videoShown && !countdownRunning && messageOverlay.classList.contains("hidden")) {
    show(scanUI);
  }
});

playButton.addEventListener("click", async () => {
  hide(tapToPlay);
  try {
    await birthdayVideo.play();
  } catch (error) {
    console.error(error);
    show(tapToPlay);
    showError("動画を再生できませんでした。movie.mp4 の形式を確認してください。");
  }
});

closeVideo.addEventListener("click", closeBirthdayVideo);
birthdayVideo.addEventListener("ended", finishBirthdayVideo);

birthdayVideo.addEventListener("error", () => {
  showError("movie.mp4 を読み込めませんでした。MP4（H.264映像＋AAC音声）で書き出しているか確認してください。");
});

scanAgainButton.addEventListener("click", () => {
  hide(messageOverlay);
  videoShown = false;

  if (!targetIsVisible) {
    show(scanUI);
  } else {
    showError("もう一度見る場合は、一度Tシャツからカメラを外してから再度向けてください。");
  }
});

window.addEventListener("pagehide", () => {
  if (!arStarted) return;
  try {
    const arSystem = arScene.systems["mindar-image-system"];
    arSystem?.stop();
  } catch (_) {}
});
