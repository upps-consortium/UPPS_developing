const apiKeyInput = document.getElementById('apiKey');
const localFileInput = document.getElementById('localFile');
const remoteUrlInput = document.getElementById('remoteUrl');
const fetchRemoteBtn = document.getElementById('fetchRemote');
const loadedDataPre = document.getElementById('loadedData');
const showStateCheckbox = document.getElementById('showState');
const statePanel = document.getElementById('statePanel');
const chatLog = document.getElementById('chatLog');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let personaText = '';
let diseaseText = '';
let messages = [];

showStateCheckbox.addEventListener('change', () => {
  statePanel.style.display = showStateCheckbox.checked ? 'block' : 'none';
});

localFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    personaText = reader.result;
    loadedDataPre.textContent = personaText;
  };
  reader.readAsText(file);
});

fetchRemoteBtn.addEventListener('click', async () => {
  const url = remoteUrlInput.value.trim();
  if (!url) return;
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    diseaseText = text;
    loadedDataPre.textContent = `${personaText}\n${diseaseText}`;
  } catch (err) {
    loadedDataPre.textContent = `Fetch error: ${err}`;
  }
});

function appendMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = `${role}: ${content}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendMessage() {
  const key = apiKeyInput.value.trim();
  const text = userInput.value.trim();
  if (!key || !text) return;

  if (messages.length === 0) {
    const systemParts = [];
    if (personaText) systemParts.push(`# Persona\n${personaText}`);
    if (diseaseText) systemParts.push(`# Condition\n${diseaseText}`);
    if (showStateCheckbox.checked) {
      systemParts.push('# 内部状態\n応答の末尾に<internal>タグを出力し、その中でmood、energy、thoughtsを列挙してください。');
    }
    systemParts.push('You are an assistant that follows the above persona and condition.');
    messages.push({ role: 'system', content: systemParts.join('\n\n') });
  }

  messages.push({ role: 'user', content: text });
  appendMessage('user', text);
  userInput.value = '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages
      })
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '(no response)';
    messages.push({ role: 'assistant', content: reply });
    appendMessage('assistant', reply);
  } catch (err) {
    appendMessage('assistant', `Error: ${err}`);
  }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
