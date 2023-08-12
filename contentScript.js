console.log("🚀   DOMContentLoaded:");

const video = document.getElementsByTagName("video")[0];

video.onpause = (e) => {
  console.log("🚀  onpause  e:", e);
  sendPauseVideos();
};

video.onplay = (e) => {
  console.log("🚀  onplay  e:", e);
  sendSyncVideos();
};

const sendPauseVideos = () => {
  console.log("🚀 sendPauseVideos:");
  chrome.runtime.sendMessage(
    JSON.stringify({ type: "pause", time: video.currentTime })
  );
};

const sendSyncVideos = () => {
  console.log("🚀 sendSyncVideos:");
  chrome.runtime.sendMessage(
    JSON.stringify({ type: "sync", time: video.currentTime })
  );
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("🚀  chrome.runtime.onMessage.", JSON.parse(request), sender);

  const data = JSON.parse(request);

  if (data.type === "pause") {
    video.pause();
    video.currentTime = data.time;
  }
  if (data.type === "sync") {
    getSyncVideos(data.time);
  }
});

const getSyncVideos = (time) => {
  if (Math.abs(time - video.currentTime) >= 4) {
    video.currentTime = time;
    video.play();
  }
};
