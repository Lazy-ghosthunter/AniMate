//Conecta ao servidor socket.io após toda a página estar carregada
window.addEventListener('load', () => {
    const socket = window.socket;
    
    if (!socket) {
        console.error('Socket não encontrado!');
        return;
    }

});

// Chat funcionalidades
const chatIcon = document.getElementById('chat');
const chatContainer = document.getElementById('chatcontainer');
const mensagens = document.getElementById('mensagens');
const espacoMsg = document.getElementById('espacomsg');
const enviarBtn = document.getElementById('enviar');
const fecharBtn = document.getElementById('fechar');

// Enviar mensagem
function sendMessage() {
    const message = espacoMsg.value.trim();
    if (!message) return;

    // Emitir para o servidor
    socket.emit('message', message);

    // Adicionar no próprio chat
    renderMessage('Você', message, true);

    espacoMsg.value = '';
}

// Receber mensagem
socket.on('receive_message', (data) => {
    if (data.authorId === socket.id) return; // Já renderiza na função sendMessage
    renderMessage(data.authorId, data.text, false);
});

// Renderiza mensagens
function renderMessage(author, text, isSender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('mensagem');
    msgDiv.classList.add(isSender ? 'sender' : 'receiver');

    msgDiv.innerHTML = `<strong>${author}:</strong> ${text}`;
    mensagens.appendChild(msgDiv);

    // Scroll automático para a última mensagem
    mensagens.scrollTop = mensagens.scrollHeight;
}

// Eventos
enviarBtn.addEventListener('click', sendMessage);

espacoMsg.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Adiciona o evento de mouse enter para mostrar o chat-container
chatIcon.addEventListener('click', function() {
    chatContainer.style.display = 'block';
});

//Função para fechar o chat
document.getElementById('fechar').addEventListener('click', () => {
    chatContainer.style.display = 'none';
})