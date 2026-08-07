const startScreen = document.querySelector("#startScreen");
const startButton = document.querySelector("#startButton");
const scanGuide = document.querySelector("#scanGuide");
const videoOverlay = document.querySelector("#videoOverlay");
const video = document.querySelector("#birthdayVideo");
const closeVideo = document.querySelector("#closeVideo");
const imageTarget = document.querySelector("#imageTarget");
const errorMessage = document.querySelector("#errorMessage");
const arScene = document.querySelector("#arScene");

let alreadyPlayed = false;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideVideo() {
  video.pause();
  video.currentTime = 0;
  videoOverlay.classList.add("hidden");
  scanGuide.classList.remove("hidden");
}

startButton.addEventListener("click", async () => {
  try {
    // iPhone/Safari対策: ユーザー操作中に一度videoを触っておく
    video.muted = true;
    try {
      await video.play();
      video.pause();
      video.currentTime = 0;
    } catch (_) {
      // movie.mp4未配置時などはここでは無視
    }
    video.muted = false;

    const arSystem = arScene.systems["mindar-image-system"];
    await arSystem.start();

    startScreen.classList.add("hidden");
    scanGuide.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showError("カメラを開始できませんでした。ブラウザのカメラ許可を確認してください。");
  }
});

imageTarget.addEventListener("targetFound", async () => {
  if (alreadyPlayed) return;
  alreadyPlayed = true;

  scanGuide.classList.add("hidden");
  videoOverlay.classList.remove("hidden");

  try {
    video.currentTime = 0;
    await video.play();
  } catch (err) {
    console.error(err);
    showError("動画を再生できませんでした。画面を一度タップしてから再度お試しください。");
  }
});

video.addEventListener("ended", () => {
  // 1回だけ再生。再度見たい場合はページ再読み込み。
  videoOverlay.classList.add("hidden");
});

closeVideo.addEventListener("click", hideVideo);

video.addEventListener("error", () => {
  showError("movie.mp4 が見つからないか、スマホで再生できない形式です。");
});
