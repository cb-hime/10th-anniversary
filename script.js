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

function resetVideo(){
birthdayVideo.pause();
try{
birthdayVideo.currentTime=0
}catch(\_){}
hide(tapToPlay)
}

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
}catch(\_){}

birthdayVideo.muted=false;
}

// ==================================================
// カメラ関連
// ==================================================

function getCameraVideo(){
return [...document.querySelectorAll("video")]
.find(
video =>
video !== birthdayVideo &&
video.srcObject instanceof MediaStream
);
}

// 対応している端末ではカメラ倍率を1×へ戻す
async function normalizeCameraZoom(){

const cameraVideo=getCameraVideo();

if(!cameraVideo){
return false;
}

const track=
cameraVideo.srcObject
?.getVideoTracks?.()[0];

if(
!track ||
track.readyState!=="live"
){
return false;
}

try{
```
const capabilities=
  track.getCapabilities?.();

if(!capabilities?.zoom){
  return false;
}

const min=
  Number(capabilities.zoom.min);

const max=
  Number(capabilities.zoom.max);

if(
  !Number.isFinite(min) ||
  !Number.isFinite(max)
){
  return false;
}

/*
  基本は1×。
  端末側で1×が使えない場合は、
  対応範囲内で最も近い値を使用。
*/

const desiredZoom=
  Math.min(
    Math.max(1,min),
    max
  );

await track.applyConstraints({
  advanced:[
    {
      zoom:desiredZoom
    }
  ]
});

return true;
```

}catch(error){
```
/*
  zoom APIに対応していないSafari等では
  何もしない。
  AR自体はそのまま動かす。
*/

console.warn(
  "Camera zoom normalization skipped:",
  error
);

return false;
```

}
}

// ==================================================
// カメラ表示サイズ取得
// ==================================================

function getViewportSize(){

const vv=
window\.visualViewport;

const widths=[
window\.innerWidth,
vv?.width,
document.documentElement.clientWidth,
screen?.width
].filter(
value =>
Number.isFinite(value) &&
value>0
);

const heights=[
vv?.height,
window\.innerHeight,
document.documentElement.clientHeight
].filter(
value =>
Number.isFinite(value) &&
value>0
);

const width=
Math.round(
Math.max(...widths)
);

const height=
Math.round(
Math.max(...heights)
);

return {
width,
height
};
}

// ==================================================
// カメラ表示補正
// ==================================================

function applyCameraViewportFix(){

const {
width,
height
}=getViewportSize();

if(
!width ||
!height
){
return;
}

// HTML / BODY
const root=
document.documentElement;

const body=
document.body;

[root,body].forEach(el=>{
```
el.style.setProperty(
  "width",
  `${width}px`,
  "important"
);

el.style.setProperty(
  "min-width",
  `${width}px`,
  "important"
);

el.style.setProperty(
  "height",
  `${height}px`,
  "important"
);

el.style.setProperty(
  "min-height",
  `${height}px`,
  "important"
);

el.style.setProperty(
  "margin",
  "0",
  "important"
);

el.style.setProperty(
  "padding",
  "0",
  "important"
);

el.style.setProperty(
  "overflow",
  "hidden",
  "important"
);

el.style.setProperty(
  "background",
  "#000",
  "important"
);
```

});

// ==================================================
// MindARのカメラ映像
// ==================================================

document
.querySelectorAll("video")
.forEach(video=>{
```
  /*
    birthdayVideoは
    お祝い動画なので変更しない
  */

  if(
    video.id==="birthdayVideo"
  ){
    return;
  }


  video.style.setProperty(
    "position",
    "fixed",
    "important"
  );

  video.style.setProperty(
    "top",
    "0",
    "important"
  );

  video.style.setProperty(
    "right",
    "0",
    "important"
  );

  video.style.setProperty(
    "bottom",
    "0",
    "important"
  );

  video.style.setProperty(
    "left",
    "0",
    "important"
  );

  video.style.setProperty(
    "width",
    `${width}px`,
    "important"
  );

  video.style.setProperty(
    "min-width",
    `${width}px`,
    "important"
  );

  video.style.setProperty(
    "max-width",
    "none",
    "important"
  );

  video.style.setProperty(
    "height",
    `${height}px`,
    "important"
  );

  video.style.setProperty(
    "min-height",
    `${height}px`,
    "important"
  );

  video.style.setProperty(
    "max-height",
    "none",
    "important"
  );

  video.style.setProperty(
    "margin",
    "0",
    "important"
  );

  video.style.setProperty(
    "padding",
    "0",
    "important"
  );


  /*
    ★今回の重要変更

    以前：
    object-fit: cover

    ↓

    今回：
    object-fit: contain

    coverは画面いっぱいにするために
    カメラ映像をトリミングするので、
    ズームしたように見える場合があります。

    containにすることで、
    カメラ映像全体を表示します。
  */

  video.style.setProperty(
    "object-fit",
    "contain",
    "important"
  );

  video.style.setProperty(
    "object-position",
    "center center",
    "important"
  );

  video.style.setProperty(
    "transform",
    "none",
    "important"
  );

  video.style.setProperty(
    "background",
    "#000",
    "important"
  );

});
```

// ==================================================
// A-Frame / MindAR Canvas
// ==================================================

const scene=
document.querySelector("#arScene");

const canvas=
document.querySelector(".a-canvas");

[scene,canvas].forEach(el=>{
```
if(!el){
  return;
}

el.style.setProperty(
  "position",
  "fixed",
  "important"
);

el.style.setProperty(
  "top",
  "0",
  "important"
);

el.style.setProperty(
  "right",
  "0",
  "important"
);

el.style.setProperty(
  "bottom",
  "0",
  "important"
);

el.style.setProperty(
  "left",
  "0",
  "important"
);

el.style.setProperty(
  "width",
  `${width}px`,
  "important"
);

el.style.setProperty(
  "min-width",
  `${width}px`,
  "important"
);

el.style.setProperty(
  "max-width",
  "none",
  "important"
);

el.style.setProperty(
  "height",
  `${height}px`,
  "important"
);

el.style.setProperty(
  "min-height",
  `${height}px`,
  "important"
);

el.style.setProperty(
  "max-height",
  "none",
  "important"
);

el.style.setProperty(
  "margin",
  "0",
  "important"
);

el.style.setProperty(
  "padding",
  "0",
  "important"
);
```

});

try{
```
if(scene?.renderer){

  scene.renderer.setSize(
    width,
    height,
    false
  );

}

scene?.resize?.();
```

}catch(\_){}

}

// ==================================================
// カメラ補正を複数回実行
// ==================================================

let layoutTimerIds=[];

function scheduleCameraViewportFix(){

layoutTimerIds
.forEach(clearTimeout);

layoutTimerIds=[
0,
100,
250,
500,
1000,
1800
].map(delay=>
```
setTimeout(()=>{

  applyCameraViewportFix();

  normalizeCameraZoom();

},delay)
```

);

}

// カメラ起動直後の安定化
async function stabilizeCameraAfterStart(){

for(
const delay of [
0,
120,
300,
600,
1000,
1600
]
){
```
if(delay){
  await wait(delay);
}

applyCameraViewportFix();

await normalizeCameraZoom();
```

}

}

// ==================================================
// AR START
// ==================================================

async function startAR(){

hideError();

show(loadingScreen);

try{
```
await primeVideoForIOS();


const arSystem=
  arScene.systems[
    "mindar-image-system"
  ];


if(!arSystem){

  throw new Error(
    "MindAR system not ready"
  );

}


await arSystem.start();

arStarted=true;


/*
  カメラ起動直後に
  表示サイズとズームを補正
*/

scheduleCameraViewportFix();

await stabilizeCameraAfterStart();


/*
  Safariが映像を描画するまで
  少し待つ
*/

await wait(250);


hide(startScreen);

hide(loadingScreen);

show(scanUI);


/*
  表示後にも再補正
*/

scheduleCameraViewportFix();
```

}catch(error){
```
console.error(error);


hide(loadingScreen);

show(startScreen);


showError(
  "カメラを開始できませんでした。Safariのカメラ許可を確認して、ページを再読み込みしてください。"
);
```

}

}

// ==================================================
// カウントダウン
// ==================================================

function cancelCountdown(){

countdownRunId++;

countdownRunning=false;

countdownNumber
.classList
.remove("is-animating");

hide(countdownOverlay);

if(
!videoShown &&
messageOverlay
.classList
.contains("hidden")
){
```
show(scanUI);
```

}

}

async function runCountdown(){

if(
countdownRunning ||
videoShown ||
!targetIsVisible ||
!messageOverlay
.classList
.contains("hidden") ||
requireTargetLeaveBeforeReplay
){
```
return;
```

}

countdownRunning=true;

const myRunId=
++countdownRunId;

hide(scanUI);

show(countdownOverlay);

for(
const n of [
"3",
"2",
"1"
]
){
```
if(
  myRunId!==countdownRunId ||
  !targetIsVisible
){

  cancelCountdown();

  return;

}


countdownNumber.textContent=n;


countdownNumber
  .classList
  .remove("is-animating");


void countdownNumber.offsetWidth;


countdownNumber
  .classList
  .add("is-animating");


await wait(760);


/*
  カウントダウン中に
  画像からカメラが外れたら中止
*/

if(
  myRunId!==countdownRunId ||
  !targetIsVisible
){

  cancelCountdown();

  return;

}
```

}

hide(countdownOverlay);

countdownRunning=false;

if(
myRunId===countdownRunId &&
targetIsVisible
){
```
await playBirthdayVideo();
```

}else{
```
show(scanUI);
```

}

}

// ==================================================
// 動画再生
// ==================================================

async function playBirthdayVideo(){

if(videoShown){
return;
}

videoShown=true;

hide(scanUI);

hide(countdownOverlay);

show(videoOverlay);

try{
```
birthdayVideo.currentTime=0;

await birthdayVideo.play();
```

}catch(error){
```
console.warn(
  "Autoplay blocked:",
  error
);


show(tapToPlay);
```

}

}

function closeBirthdayVideo(){

resetVideo();

hide(videoOverlay);

videoShown=false;

requireTargetLeaveBeforeReplay=
targetIsVisible;

if(!targetIsVisible){
```
show(scanUI);

scheduleCameraViewportFix();
```

}

}

// ==================================================
// 動画終了後メッセージ
// ==================================================

async function showMessageSequence(){

resetVideo();

hide(videoOverlay);

videoShown=false;

hide(scanUI);

hide(countdownOverlay);

resetMessageScreen();

show(messageOverlay);

const myRunId=
++messageRunId;

/\*
1行ずつ表示
```
1500 = 1.5秒間隔
```

\*/

for(
const line of messageLines
){
```
if(
  myRunId!==messageRunId
){

  return;

}


line
  .classList
  .add("is-visible");


await wait(1500);
```

}

if(
myRunId!==messageRunId
){
```
return;
```

}

await wait(450);

show(cameraButton);

requestAnimationFrame(
()=>cameraButton
.classList
.add("is-visible")
);

}

// ==================================================
// 「カメラを起動」
// ==================================================

function returnToCamera(){

resetMessageScreen();

hide(messageOverlay);

hideError();

requireTargetLeaveBeforeReplay=
targetIsVisible;

/\*
カメラに戻る時も
ズームと表示サイズを補正
\*/

applyCameraViewportFix();

normalizeCameraZoom();

show(scanUI);

scheduleCameraViewportFix();

}

// ==================================================
// イベント
// ==================================================

startButton
.addEventListener(
"click",
startAR
);

// 画像認識
imageTarget
.addEventListener(
"targetFound",
()=>{
```
  targetIsVisible=true;


  if(
    !requireTargetLeaveBeforeReplay &&
    !videoShown &&
    !countdownRunning &&
    messageOverlay
      .classList
      .contains("hidden")
  ){

    runCountdown();

  }

}
```

);

// 画像を見失った
imageTarget
.addEventListener(
"targetLost",
()=>{
```
  targetIsVisible=false;


  requireTargetLeaveBeforeReplay=false;


  if(countdownRunning){

    cancelCountdown();

    return;

  }


  if(
    !videoShown &&
    messageOverlay
      .classList
      .contains("hidden")
  ){

    show(scanUI);

    applyCameraViewportFix();

  }

}
```

);

// iPhoneで自動再生できなかった場合
playButton
.addEventListener(
"click",
async()=>{
```
  hide(tapToPlay);


  try{

    await birthdayVideo.play();

  }catch(error){

    console.error(error);


    show(tapToPlay);


    showError(
      "動画を再生できませんでした。movie.mp4 の形式を確認してください。"
    );

  }

}
```

);

closeVideo
.addEventListener(
"click",
closeBirthdayVideo
);

birthdayVideo
.addEventListener(
"ended",
showMessageSequence
);

birthdayVideo
.addEventListener(
"error",
()=>{
```
  showError(
    "movie.mp4 を読み込めませんでした。MP4（H.264映像＋AAC音声）で書き出しているか確認してください。"
  );

}
```

);

cameraButton
.addEventListener(
"click",
returnToCamera
);

// ==================================================
// iPhone / Safari表示変化対策
// ==================================================

window\.addEventListener(
"resize",
scheduleCameraViewportFix,
{
passive:true
}
);

window\.addEventListener(
"orientationchange",
scheduleCameraViewportFix,
{
passive:true
}
);

window\.addEventListener(
"pageshow",
scheduleCameraViewportFix,
{
passive:true
}
);

window\.addEventListener(
"focus",
scheduleCameraViewportFix,
{
passive:true
}
);

if(window\.visualViewport){

window\.visualViewport
.addEventListener(
"resize",
scheduleCameraViewportFix,
{
passive:true
}
);

window\.visualViewport
.addEventListener(
"scroll",
scheduleCameraViewportFix,
{
passive:true
}
);

}

document
.addEventListener(
"visibilitychange",
()=>{
```
  if(!document.hidden){

    scheduleCameraViewportFix();

  }

}
```

);

// ==================================================
// MindARが後からvideo/canvasを作った場合
// ==================================================

const observer=
new MutationObserver(
mutations=>{
```
  const relevant=
    mutations.some(
      mutation=>

        [...mutation.addedNodes]
          .some(
            node=>

              node.nodeType===1 &&

              (
                node.tagName==="VIDEO" ||
                node.tagName==="CANVAS" ||
                node.querySelector?.(
                  "video, canvas"
                )
              )

          )

    );


  if(relevant){

    scheduleCameraViewportFix();

  }

}
```

);

observer.observe(
document.documentElement,
{
childList:true,
subtree:true
}
);

// ==================================================
// ページ終了
// ==================================================

window\.addEventListener(
"pagehide",
()=>{
```
if(!arStarted){
  return;
}


try{

  const arSystem=
    arScene.systems[
      "mindar-image-system"
    ];


  arSystem?.stop();


}catch(_){}
```

}
);

// 初期表示でも補正予約
scheduleCameraViewportFix();
