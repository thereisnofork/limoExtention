const hBtn = document.getElementById("h-btn");
const cBtn = document.getElementById("c-btn");
const offerTokenEl = document.getElementById("offer-token");
const answerTokenEl = document.getElementsByClassName("answer-token")[0];
const bodyEl = document.getElementsByTagName("body")[0];

const showSuccessUI = () => {
  bodyEl.innerText = "conention completion";
};

const tryParseJSONObject = (jsonString) => {
  try {
    const o = JSON.parse(jsonString);

    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return false;
};

const copy = (value) => {
  navigator.clipboard.writeText(value);
};

let isHost = false;

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

hBtn.addEventListener("click", () => {
  isHost = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "click",
      value: "hostClicked",
    });
  });

  hBtn.parentElement.style.display = "none";
  answerTokenEl.style.display = "block";

  answerTokenEl.onkeydown = (e) => {
    if (e.key !== "Enter" || !tryParseJSONObject(e.target.value)) {
      return;
    }

    e.preventDefault();
    answerTokenEl.disabled = true;

    const recivedAnswer = JSON.parse(e.target.value);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "recivedAnswer",
        value: recivedAnswer,
      });
    });
  };
});

///////

cBtn.addEventListener("click", () => {
  isHost = false;

  cBtn.parentElement.style.display = "none";
  answerTokenEl.style.display = "block";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "click",
      value: "clientClicked",
    });
  });

  answerTokenEl.onkeydown = (e) => {
    if (e.key !== "Enter" || !tryParseJSONObject(e.target.value)) {
      return;
    }
    answerTokenEl.disabled = true;

    e.preventDefault();
    const recivedOffer = JSON.parse(e.target.value);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "recivedOffer",
        value: recivedOffer,
      });
    });
  };
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("🚀  chrome.runtime.onMessage.addListener  request:", request);

  if (request.type === "offerToken" || request.type === "answerToken") {
    offerTokenEl.style.display = "block";
    offerTokenEl.innerText = request.value;
  }

  copy(request.value);
});
