// Keep this local URL for testing. Replace it with your deployed backend URL before publishing the frontend.
const API_URL = "http://127.0.0.1:8000";
const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");

function addMessage(text, role, isTyping = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = role === "user" ? "YOU" : "HIREMEAI";
  const time = document.createElement("span");
  time.textContent = " · NOW";
  meta.appendChild(time);
  wrapper.appendChild(meta);

  if (isTyping) {
    const dots = document.createElement("div");
    dots.className = "typing-dots";
    dots.setAttribute("aria-label", "HireMeAI is thinking");
    for (let i = 0; i < 3; i++)
      dots.appendChild(document.createElement("span"));
    wrapper.appendChild(dots);
  } else {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    wrapper.appendChild(paragraph);
  }

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrapper;
}

async function askQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion || sendButton.disabled) return;

  document.querySelector(".suggestion-heading")?.remove();
  document.querySelector(".suggestions")?.remove();
  addMessage(cleanQuestion, "user");

  questionInput.value = "";
  questionInput.style.height = "auto";
  sendButton.disabled = true;
  sendButton.querySelector("span").textContent = "Thinking";

  const loadingMessage = addMessage("", "assistant", true);

  try {
    // Matches the POST /chat endpoint in your FastAPI main.py.
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: cleanQuestion,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data.detail || `Server returned status ${response.status}.`,
      );
    }

    loadingMessage.querySelector(".typing-dots")?.remove();
    const rawAnswer =
      data.answer ||
      "I couldn't find an answer in the response. Please try asking another question.";

    const answer = document.createElement("p");
    answer.textContent = rawAnswer
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
    loadingMessage.appendChild(answer);
  } catch (error) {
    console.error("HireMeAI error:", error);
    loadingMessage.querySelector(".typing-dots")?.remove();
    const errorText = document.createElement("p");
    errorText.textContent =
      "I couldn't connect to HireMeAI's backend. Please try again in a moment.";
    loadingMessage.appendChild(errorText);
  } finally {
    sendButton.disabled = false;
    sendButton.querySelector("span").textContent = "Send";
    chatMessages.scrollTop = chatMessages.scrollHeight;
    questionInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askQuestion(questionInput.value);
});

questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

questionInput.addEventListener("input", () => {
  questionInput.style.height = "auto";
  questionInput.style.height = `${Math.min(questionInput.scrollHeight, 120)}px`;
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => askQuestion(button.dataset.question));
});
