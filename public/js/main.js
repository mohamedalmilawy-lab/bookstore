const yearElement = document.getElementById("year");
yearElement.textContent = new Date().getFullYear();

const chatCircle = document.getElementById('chat-circle');
const chatBox = document.getElementById('chat-box');
const closeChat = document.getElementById('close-chat');

chatCircle.onclick = () => chatBox.classList.toggle('d-none');
closeChat.onclick = () => chatBox.classList.add('d-none');

document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const message = inputField.value.trim();
    
    if (!message) return;

    appendMessage('user', message);
    inputField.value = '';

    const botMessageDiv = appendMessage('bot', ''); 
    const textContainer = botMessageDiv.querySelector('.message-text');
    textContainer.innerHTML = '<i>جاري التفكير... ✍️</i>';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        textContainer.innerHTML = '';
        typeWriter(textContainer, data.reply);

    } catch (error) {
        textContainer.innerHTML = '<span class="text-danger small">عذراً، فشل الاتصال.</span>';
    }
}

function typeWriter(element, text, i = 0) {
    if (i < text.length) {
        element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
        i++;
        setTimeout(() => typeWriter(element, text, i), 20);
        
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function appendMessage(type, text) {
    const chatMessages = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = type === 'user' ? "text-end mb-3" : "text-start mb-3";
    wrapper.setAttribute('dir', 'rtl');
    
    const bgClass = type === 'user' ? "bg-primary text-white" : "bg-white text-dark border";
    
    wrapper.innerHTML = `
        <div class="d-inline-block p-2 px-3 rounded-3 shadow-sm ${bgClass}" style="max-width: 85%; font-size: 0.9rem;">
            <span class="message-text">${text}</span>
        </div>
    `;
    
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return wrapper; 
}
