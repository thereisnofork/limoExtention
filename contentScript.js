console.log("🚀   DOMContentLoaded:");

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);
let dc = null;
let isHost = false;

pc.onconnectionstatechange = (e) => {
  console.log(
    "🚀--------->  pc.iceConnectionState: ------>",
    pc.iceConnectionState
  );
};

const video = document.getElementsByTagName("video")[0];

if (video) {
  video.onpause = (e) => {
    console.log("🚀  onpause  e:", e);
    sendPauseVideos();
  };

  video.onplay = (e) => {
    console.log("🚀  onplay  e:", e);
    sendSyncVideos();
  };
}

const sendPauseVideos = () => {
  console.log("🚀 sendPauseVideos:");
  dc?.send(JSON.stringify({ type: "pause", time: video.currentTime }));
};

const getPauseVideos = (time) => {
  video.pause();
  video.currentTime = time;
};

const sendSyncVideos = () => {
  console.log("🚀  sendSyncVideos  dc:", dc);
  dc?.send(JSON.stringify({ type: "sync", time: video.currentTime }));
};

const getSyncVideos = (time) => {
  if (Math.abs(time - video.currentTime) >= 3) {
    video.currentTime = time;
  }
  video.play();
};

const getWEBRTCmsg = (req) => {
  const request = JSON.parse(req.data);
  console.log("🚀  getWEBRTCmsg  request:", request);

  if (request.type === "pause") {
    getPauseVideos(request.time);
  }
  if (request.type === "sync") {
    getSyncVideos(request.time);
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("🚀  chrome.runtime.onMessage.addListener  request:", request);

  if (request.type === "click") {
    if (request.value === "hostClicked") {
      isHost = true;

      dc = pc.createDataChannel("channel");

      dc.onopen = (e) => {
        console.log("🚀  hBtn.  onopen:");
        chrome.runtime.sendMessage({ type: "ui", value: "showSuccessUI" });
      };

      dc.onmessage = getWEBRTCmsg;

      pc.onicecandidate = (e) => {
        console.log("🚀  hBtn.onicecandidate  e:", e);
        const tokenJSON = JSON.stringify(pc.localDescription);
        chrome.runtime.sendMessage({ type: "offerToken", value: tokenJSON });
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => console.log("set successfully"))
        .catch((err) => console.log(err));
    } else if (request.value === "clientClicked") {
      isHost = false;

      pc.onicecandidate = (e) => {
        console.log("🚀  cBtn.onicecandidate  e:", e);
        const tokenJSON = JSON.stringify(pc.localDescription);
        chrome.runtime.sendMessage({ type: "answerToken", value: tokenJSON });
      };

      pc.ondatachannel = (e) => {
        console.log("🚀  cBtn.ondatachannel  e:", e);
        dc = e.channel;

        e.channel.onmessage = getWEBRTCmsg;

        e.channel.onopen = (e) => {
          console.log("🚀  cBtn.onopen  e:", e);
          chrome.runtime.sendMessage({ type: "ui", value: "showSuccessUI" });
        };
      };
    }
  } else if (request.type === "recivedAnswer") {
    pc.setRemoteDescription(request.value)
      .then((e) => {
        console.log("🚀 .then setRemoteDescription e:");
      })
      .catch((err) => console.log(err));
  } else if (request.type === "recivedOffer") {
    pc.setRemoteDescription(request.value)
      .then((e) => {
        console.log("🚀 .setRemoteDescription  e:");
      })
      .catch((err) => console.log(err));

    pc.createAnswer()
      .then((answer) => {
        console.log("🚀  .then  answer:", answer);

        const tokenJSON = JSON.stringify(pc.localDescription);
        chrome.runtime.sendMessage({ type: "answerToken", value: tokenJSON });
        return pc.setLocalDescription(answer);
      })
      .catch((err) => console.log(err));
  }
});
