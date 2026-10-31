const form = document.getElementById("counter");
const textArea = document.getElementById("text");
const statusEl = document.getElementById("status");
const fields = {
  lines: document.getElementById("lines"),
  words: document.getElementById("words"),
  characters: document.getElementById("characters")
};

let timer;
let lastRequestId = 0;

function render(counts) {
  fields.lines.textContent = String(counts.lines);
  fields.words.textContent = String(counts.words);
  fields.characters.textContent = String(counts.characters);
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function isLatest(requestId) {
  return requestId === lastRequestId;
}

async function update(text) {
  lastRequestId += 1;
  const requestId = lastRequestId;

  try {
    const response = await fetch("/api/count", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`request failed (${response.status})`);
    }

    const counts = await response.json();

    if (!isLatest(requestId)) {
      return;
    }

    render(counts);
    setStatus("Counted by the same rules the CLI uses.");
  } catch (err) {
    if (isLatest(requestId)) {
      setStatus(`Could not reach the server: ${err.message}`, true);
    }
  }
}

form.addEventListener("input", () => {
  clearTimeout(timer);
  const text = textArea.value;
  timer = setTimeout(() => update(text), 150);
});

update(textArea.value);
