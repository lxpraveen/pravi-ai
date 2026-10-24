const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const sendBtn = document.querySelector("#sendBtn");
const messagesEl = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const historyList = document.querySelector("#historyList");
const toast = document.querySelector("#toast");
const sidebar = document.querySelector("#sidebar");

let messages = [];
let chats = [];
let busy = false;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function basicFormat(text) {
  // Safe, small formatting subset; HTML is escaped before formatting.
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function addMessage(role, content) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "assistant" ? "✦" : "P";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = basicFormat(content);
  row.append(avatar, bubble);
  messagesEl.appendChild(row);
  row.scrollIntoView({ behavior: "smooth", block: "end" });
  return row;
}

function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  input.disabled = value;
  sendBtn.innerHTML = value ? "…" : "<span>↑</span>";
}

function renderHistory() {
  historyList.replaceChildren();
  if (!chats.length) {
    const empty = document.createElement("div");
    empty.className = "empty-history";
    empty.textContent = "Your recent chats will appear here.";
    historyList.appendChild(empty);
    return;
  }
  chats.slice().reverse().forEach((chat) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.textContent = chat.title;
    button.title = chat.title;
    button.addEventListener("click", () => {
      messages = chat.messages.map((m) => ({ ...m }));
      renderMessages();
      sidebar.classList.remove("open");
    });
    historyList.appendChild(button);
  });
}

function saveCurrentChat() {
  if (!messages.length) return;
  const title = (messages.find((m) => m.role === "user")?.content || "New chat").slice(0, 36);
  const existing = chats.findIndex((c) => c.id === currentChatId);
  const chat = { id: currentChatId, title, messages: messages.map((m) => ({ ...m })) };
  if (existing >= 0) chats[existing] = chat;
  else chats.push(chat);
  chats = chats.slice(-12);
  renderHistory();
}

let currentChatId = crypto.randomUUID();

function renderMessages() {
  messagesEl.replaceChildren();
  welcome.hidden = messages.length > 0;
  messages.forEach((m) => addMessage(m.role, m.content));
}

function newChat() {
  saveCurrentChat();
  messages = [];
  currentChatId = crypto.randomUUID();
  renderMessages();
  input.value = "";
  input.style.height = "auto";
  sidebar.classList.remove("open");
  input.focus();
}

async function sendMessage(text) {
  const content = text.trim();
  if (!content || busy) return;
  welcome.hidden = true;
  messages.push({ role: "user", content });
  addMessage("user", content);
  input.value = "";
  input.style.height = "auto";
  setBusy(true);

  const typingRow = document.createElement("div");
  typingRow.className = "message assistant";
  typingRow.innerHTML = '<div class="avatar">✦</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  messagesEl.appendChild(typingRow);
  typingRow.scrollIntoView({ behavior: "smooth", block: "end" });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) })
    });
    const data = await response.json().catch(() => ({}));
    typingRow.remove();
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    messages.push({ role: "assistant", content: data.answer });
    addMessage("assistant", data.answer);
    saveCurrentChat();
  } catch (error) {
    typingRow.remove();
    const message = error.message || "Could not connect to Pravi AI.";
    addMessage("assistant", `Sorry, ${message}`);
    showToast(message);
    // Keep the user's question in the current conversation, but don't store the error as an AI reply.
    saveCurrentChat();
  } finally {
    setBusy(false);
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelector("#newChatBtn").addEventListener("click", newChat);
document.querySelector("#clearBtn").addEventListener("click", newChat);
document.querySelector("#menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});

renderHistory();
