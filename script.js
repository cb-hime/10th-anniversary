
const startScreen=document.querySelector("#startScreen");
const loadingScreen=document.querySelector("#loadingScreen");
const startButton=document.querySelector("#startButton");
const scanUI=document.querySelector("#scanUI");
const countdownOverlay=document.querySelector("#countdownOverlay");
const countdownNumber=document.querySelector("#countdownNumber");
const videoOverlay=document.querySelector("#videoOverlay");
const birthdayVideo=document.querySelector("#birthdayVideo");
const closeVideo=document.querySelector("#closeVideo");
const tapToPlay=document.querySelector("#tapToPlay");
const playButton=document.querySelector("#playButton");
const messageOverlay=document.querySelector("#messageOverlay");
const messageLines=[...document.querySelectorAll(".message-line")];
const cameraButton=document.querySelector("#cameraButton");
const errorBox=document.querySelector("#errorBox");
const arScene=document.querySelector("#arScene");
const imageTarget=document.querySelector("#imageTarget");

let arStarted=false;
let videoShown=false;
let targetIsVisible=false;
let countdownRunning=false;
let countdownRunId=0;
let messageRunId=0;
let requireTargetLeaveBeforeReplay=false;

function show(el){el.classList.remove("hidden")}
function hide(el){el.classList.add("hidden")}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function showError(message){errorBox.textContent=message;show(errorBox)}
function hideError(){hide(errorBox)}
function resetVideo(){birthdayVideo.pause();try{birthdayVideo.currentTime=0}catch(_){}hide(tapToPlay)}

function resetMessageScreen(){
  messageRunId++;
  messageLines.forEach(line=>line.classList.remove("is-visible"));
  cameraButton.classList.remove("is-visible");
  hide(cameraButton);
}

async function primeVideoForIOS(){
  birthdayVideo.muted=true;
  try{
    await birthdayVideo.play();
    birthdayVideo.pause();
    birthdayVideo.currentTime=0;
  }catch(_){}
  birthdayVideo.muted=false;
}

async function startAR(){
  hideError();
  show(loadingScreen);
  try{
    await primeVideoForIOS();
    const arSystem=arScene.systems["mindar-image-system"];
    if(!arSystem) throw new Error("MindAR system not ready");
    await arSystem.start();
    arStarted=true;
    await wait(500);
    hide(startScreen);
    hide(loadingScreen);
    show(scanUI);
  }catch(error){
    console.error(error);
    hide(loadingScreen);
    show(startScreen);
    showError("カメラを開始できませんでした。Safariのカメラ許可を確認して、ページを再読み込みしてください。");
  }
}

function cancelCountdown(){
  countdownRunId++;
  countdownRunning=false;
  countdownNumber.classList.remove("is-animating");
  hide(countdownOverlay);
  if(!videoShown && messageOverlay.classList.contains("hidden")) show(scanUI);
}

async function runCountdown(){
  if(countdownRunning||videoShown||!targetIsVisible||!messageOverlay.classList.contains("hidden")||requireTargetLeaveBeforeReplay) return;
  countdownRunning=true;
  const myRunId=++countdownRunId;
  hide(scanUI);
  show(countdownOverlay);

  for(const n of ["3","2","1"]){
    if(myRunId!==countdownRunId||!targetIsVisible){cancelCountdown();return}
    countdownNumber.textContent=n;
    countdownNumber.classList.remove("is-animating");
    void countdownNumber.offsetWidth;
    countdownNumber.classList.add("is-animating");
    await wait(760);
    if(myRunId!==countdownRunId||!targetIsVisible){cancelCountdown();return}
  }

  hide(countdownOverlay);
  countdownRunning=false;
  if(myRunId===countdownRunId&&targetIsVisible) await playBirthdayVideo();
  else show(scanUI);
}

async function playBirthdayVideo(){
  if(videoShown) return;
  videoShown=true;
  hide(scanUI);
  hide(countdownOverlay);
  show(videoOverlay);
  try{
    birthdayVideo.currentTime=0;
    await birthdayVideo.play();
  }catch(error){
    console.warn("Autoplay blocked:",error);
    show(tapToPlay);
  }
}

function closeBirthdayVideo(){
  resetVideo();
  hide(videoOverlay);
  videoShown=false;
  requireTargetLeaveBeforeReplay=targetIsVisible;
  if(!targetIsVisible) show(scanUI);
}

async function showMessageSequence(){
  resetVideo();
  hide(videoOverlay);
  videoShown=false;
  hide(scanUI);
  hide(countdownOverlay);

  resetMessageScreen();
  show(messageOverlay);

  const myRunId=++messageRunId;
  for(const line of messageLines){
    if(myRunId!==messageRunId) return;
    line.classList.add("is-visible");
    await wait(1500);
  }

  if(myRunId!==messageRunId) return;
  await wait(450);
  show(cameraButton);
  requestAnimationFrame(()=>cameraButton.classList.add("is-visible"));
}

function returnToCamera(){
  resetMessageScreen();
  hide(messageOverlay);
  hideError();
  requireTargetLeaveBeforeReplay=targetIsVisible;
  show(scanUI);
}

startButton.addEventListener("click",startAR);

imageTarget.addEventListener("targetFound",()=>{
  targetIsVisible=true;
  if(!requireTargetLeaveBeforeReplay&&!videoShown&&!countdownRunning&&messageOverlay.classList.contains("hidden")){
    runCountdown();
  }
});

imageTarget.addEventListener("targetLost",()=>{
  targetIsVisible=false;
  requireTargetLeaveBeforeReplay=false;
  if(countdownRunning){cancelCountdown();return}
  if(!videoShown&&messageOverlay.classList.contains("hidden")) show(scanUI);
});

playButton.addEventListener("click",async()=>{
  hide(tapToPlay);
  try{await birthdayVideo.play()}
  catch(error){
    console.error(error);
    show(tapToPlay);
    showError("動画を再生できませんでした。movie.mp4 の形式を確認してください。");
  }
});

closeVideo.addEventListener("click",closeBirthdayVideo);
birthdayVideo.addEventListener("ended",showMessageSequence);
birthdayVideo.addEventListener("error",()=>showError("movie.mp4 を読み込めませんでした。MP4（H.264映像＋AAC音声）で書き出しているか確認してください。"));
cameraButton.addEventListener("click",returnToCamera);

window.addEventListener("pagehide",()=>{
  if(!arStarted) return;
  try{
    const arSystem=arScene.systems["mindar-image-system"];
    arSystem?.stop();
  }catch(_){}
});


// ===== iPhone / in-app browser camera viewport stabilizer =====
(() => {
  let layoutTimerIds = [];

  const getViewportSize = () => {
    const vv = window.visualViewport;
    const width = Math.round(window.innerWidth || vv?.width || document.documentElement.clientWidth || 0);
    const height = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0);
    return { width, height };
  };

  const applyCameraViewportFix = () => {
    const { width, height } = getViewportSize();
    if (!width || !height) return;

    const root = document.documentElement;
    const body = document.body;

    [root, body].forEach((el) => {
      el.style.setProperty('width', `${width}px`, 'important');
      el.style.setProperty('min-width', `${width}px`, 'important');
      el.style.setProperty('height', `${height}px`, 'important');
      el.style.setProperty('min-height', `${height}px`, 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('padding', '0', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
      el.style.setProperty('background', '#000', 'important');
    });

    document.querySelectorAll('video').forEach((video) => {
      if (video.id === 'birthdayVideo') return;

      video.style.setProperty('position', 'fixed', 'important');
      video.style.setProperty('top', '0', 'important');
      video.style.setProperty('right', '0', 'important');
      video.style.setProperty('bottom', '0', 'important');
      video.style.setProperty('left', '0', 'important');
      video.style.setProperty('width', `${width}px`, 'important');
      video.style.setProperty('min-width', `${width}px`, 'important');
      video.style.setProperty('max-width', 'none', 'important');
      video.style.setProperty('height', `${height}px`, 'important');
      video.style.setProperty('min-height', `${height}px`, 'important');
      video.style.setProperty('max-height', 'none', 'important');
      video.style.setProperty('margin', '0', 'important');
      video.style.setProperty('padding', '0', 'important');
      video.style.setProperty('object-fit', 'cover', 'important');
      video.style.setProperty('object-position', 'center center', 'important');
      video.style.setProperty('transform', 'none', 'important');
      video.style.setProperty('background', '#000', 'important');
    });

    const scene = document.querySelector('#arScene');
    const canvas = document.querySelector('.a-canvas');

    [scene, canvas].forEach((el) => {
      if (!el) return;
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('top', '0', 'important');
      el.style.setProperty('right', '0', 'important');
      el.style.setProperty('bottom', '0', 'important');
      el.style.setProperty('left', '0', 'important');
      el.style.setProperty('width', `${width}px`, 'important');
      el.style.setProperty('min-width', `${width}px`, 'important');
      el.style.setProperty('max-width', 'none', 'important');
      el.style.setProperty('height', `${height}px`, 'important');
      el.style.setProperty('min-height', `${height}px`, 'important');
      el.style.setProperty('max-height', 'none', 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('padding', '0', 'important');
    });

    try {
      if (scene?.renderer) {
        scene.renderer.setSize(width, height, false);
      }
      scene?.resize?.();
    } catch (_) {}
  };

  const scheduleCameraViewportFix = () => {
    layoutTimerIds.forEach(clearTimeout);
    layoutTimerIds = [0, 100, 250, 500, 1000, 1800].map((delay) =>
      setTimeout(applyCameraViewportFix, delay)
    );
  };

  window.addEventListener('resize', scheduleCameraViewportFix, { passive: true });
  window.addEventListener('orientationchange', scheduleCameraViewportFix, { passive: true });
  window.addEventListener('pageshow', scheduleCameraViewportFix, { passive: true });
  window.addEventListener('focus', scheduleCameraViewportFix, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleCameraViewportFix, { passive: true });
    window.visualViewport.addEventListener('scroll', scheduleCameraViewportFix, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleCameraViewportFix();
  });

  document.querySelector('#startButton')?.addEventListener('click', scheduleCameraViewportFix);
  document.querySelector('#cameraButton')?.addEventListener('click', scheduleCameraViewportFix);
  document.querySelector('#closeVideo')?.addEventListener('click', scheduleCameraViewportFix);

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) =>
      [...mutation.addedNodes].some((node) =>
        node.nodeType === 1 &&
        (node.tagName === 'VIDEO' || node.tagName === 'CANVAS' || node.querySelector?.('video, canvas'))
      )
    );
    if (relevant) scheduleCameraViewportFix();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleCameraViewportFix();
})();
