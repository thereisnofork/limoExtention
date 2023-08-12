const hBtn = document.getElementById("h-btn");
const cBtn = document.getElementById("c-btn");
const offerTokenEl = document.getElementById("offer-token");
const answerTokenEl = document.getElementsByClassName("answer-token")[0];
const bodyEl = document.getElementsByTagName("body")[0];

const showSuccessUI = () => {
  bodyEl.innerText = "conention completion";
};

function tryParseJSONObject(jsonString) {
  try {
    const o = JSON.parse(jsonString);

    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return false;
}

const copy = (value) => {
  navigator.clipboard.writeText(value);
};

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

hBtn.addEventListener("click", () => {
  hBtn.parentElement.style.display = "none";
  answerTokenEl.style.display = "block";

  const lc = new RTCPeerConnection(servers);
  const dc = lc.createDataChannel("channel");

  dc.onopen = (e) => {
    console.log("🚀  hBtn.  onopen:");
    showSuccessUI();
    window.baser = dc;
  };

  dc.onmessage = (e) => {
    console.log("🚀  hBtn.onmessage  e:", e);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, e.data);
    });
  };

  lc.onicecandidate = (e) => {
    console.log("🚀  hBtn.onicecandidate  e:", e);
    offerTokenEl.style.display = "block";
    offerTokenEl.innerText = JSON.stringify(lc.localDescription);
    copy(JSON.stringify(lc.localDescription));
  };

  lc.createOffer()
    .then((offer) => lc.setLocalDescription(offer))
    .then(() => console.log("set successfully"))
    .catch((err) => console.log(err));

  answerTokenEl.onkeydown = (e) => {
    if (e.key !== "Enter" || !tryParseJSONObject(e.target.value)) {
      return;
    }

    e.preventDefault();

    const recivedAnswer = JSON.parse(e.target.value);

    lc.setRemoteDescription(recivedAnswer)
      .then((e) => {
        console.log("🚀 .then setRemoteDescription e:");
      })
      .catch((err) => console.log(err));
  };

  answerTokenEl.oninput = (e) => {
    e.preventDefault();
    if (tryParseJSONObject(e.target.value)) {
      answerTokenEl.classList.remove("r-border");
      answerTokenEl.classList.add("g-border");
    } else {
      answerTokenEl.classList.remove("g-border");
      answerTokenEl.classList.add("r-border");
    }
    e.target.value = e.target.value.trim();
  };
});

///////

cBtn.addEventListener("click", () => {
  cBtn.parentElement.style.display = "none";
  answerTokenEl.style.display = "block";

  const rc = new RTCPeerConnection(servers);

  rc.onicecandidate = (e) => {
    console.log("🚀  cBtn.onicecandidate  e:", e);
    offerTokenEl.style.display = "block";
    offerTokenEl.innerText = JSON.stringify(rc.localDescription);
    copy(JSON.stringify(rc.localDescription));
  };

  rc.ondatachannel = (e) => {
    console.log("🚀  cBtn.ondatachannel  e:", e);
    rc.dc = e.channel;

    e.channel.onmessage = (e) => {
      console.log("🚀  cBtn.onmessage  e:", e);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, e.data);
      });
    };

    e.channel.onopen = (e) => {
      console.log("🚀  cBtn.onopen  e:", e);
      showSuccessUI();
      window.baser = rc.dc;
    };
  };

  answerTokenEl.onkeydown = (e) => {
    if (e.key !== "Enter" || !tryParseJSONObject(e.target.value)) {
      return;
    }

    e.preventDefault();
    const recivedOffer = JSON.parse(e.target.value);

    rc.setRemoteDescription(recivedOffer)
      .then((e) => {
        console.log("🚀 .setRemoteDescription  e:");
      })
      .catch((err) => console.log(err));

    rc.createAnswer()
      .then((answer) => {
        console.log("🚀  .then  answer:", answer);
        return rc.setLocalDescription(answer);
      })
      .catch((err) => console.log(err));
  };

  answerTokenEl.oninput = (e) => {
    e.preventDefault();
    if (tryParseJSONObject(e.target.value)) {
      answerTokenEl.classList.remove("r-border");
      answerTokenEl.classList.add("g-border");
    } else {
      answerTokenEl.classList.remove("g-border");
      answerTokenEl.classList.add("r-border");
    }
    e.target.value = e.target.value.trim();
  };
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  window.baser.send(request);
});
