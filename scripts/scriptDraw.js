//Conecta ao servidor socket.io
const socket = io();

// Chat funcionalidades
const chatIcon = document.getElementById('chat');
const chatContainer = document.getElementById('chatcontainer');

        // Adiciona o evento de mouse enter para mostrar o chat-container
        chatIcon.addEventListener('mouseenter', function() {
            chatContainer.style.display = 'block';
        });

//Função para fechar o chat
document.getElementById('fechar').addEventListener('click', () => {
    chatContainer.style.display = 'none';
})

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        // Carregar configurações salvas
        const larguraC = localStorage.getItem('larguracanvas');
        const alturaC = localStorage.getItem('alturacanvas');
        const cor = localStorage.getItem('corCanvas');

        // Configurações da Canvas
        function updateCanvas() {
            canvas.width = parseInt(larguraC, 10);
            canvas.height = parseInt(alturaC, 10);
            ctx.fillStyle = cor || '#ffffff'; // Cor padrão caso não esteja no localStorage
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Configuração inicial ao carregar a página
window.onload = () => {
    updateCanvas();
    switchFrame('frame1'); // Define o frame inicial
    const corSalva = localStorage.getItem('corr'); //Aplica a cor ao carregar a página
    if(corSalva) {
        pintar = corSalva;
        corPincel.value = corSalva;
    }
};

// Variáveis para desenho
let isDrawing = false;
let lastX = null;
let lastY = null;
let pintar = '#000000'; // Cor padrão do pincel

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 2) // apenas botão esquerdo e direito
        isDrawing = true;
});

//Não abre o menu do navegador ao estar desenhando com o botão direito
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

canvas.addEventListener('mouseup', () => { 
    isDrawing = false;
    lastX = null;
    lastY = null;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
    lastX = null;
    lastY = null;
});

//Desenhar apenas quando o botão estiver se mexendo e sendo pressionando
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) {
        // Quando o mouse se mover sem o botão estar pressionado
        lastX = e.clientX - canvas.getBoundingClientRect().left;
        lastY = e.clientY - canvas.getBoundingClientRect().top;
        return; 
    }

    // isDrawing vira verdadeiro apenas quando o botão está sendo pressionado
    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = pintar; 
    ctx.lineWidth = 2; 
    ctx.stroke();
    ctx.closePath();

        // Envia o desenho se realmente estiver desenhando
        socket.emit('draw', {
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            color: pintar,
            lineWidth: 2,
        });
    
    lastX = x;
    lastY = y;
});

// Alterar cor do pincel
const corPincel = document.getElementById('corr');
corPincel.addEventListener('input', () => {
    pintar = corPincel.value;
    localStorage.setItem('corr', pintar);
});

//Pegar a cor selecionada pelo usuário
const colorPicker = document.getElementById('corr');
const color = colorPicker.value;

        // Variáveis da timeline
        let currentFrame = 'frame1'; // Frame inicial
        const frames = {}; // Armazena os desenhos dos frames

        // Salvar estado do canvas em um frame
        function saveFrame(frameId) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = canvas.width;
            frameCanvas.height = canvas.height;
            const frameCtx = frameCanvas.getContext('2d');
            frameCtx.drawImage(canvas, 0, 0);
            frames[frameId] = frameCanvas;
        }

        // Restaurar estado de um frame no canvas
        function loadFrame(frameId) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Se Onion Skin estiver ativado, desenha o frame anterior ou próximo semitransparente
            if (onionSkinEnabled) {
                const frameIds = Array.from(document.querySelectorAll('.frame')).map(frame => frame.id);
                const currentIndex = frameIds.indexOf(frameId);

                if (currentIndex > 0) {
                    // Desenha o frame anterior com semitransparência
                    ctx.globalAlpha = 0.5; // 50% de transparência
                    ctx.drawImage(frames[frameIds[currentIndex - 1]], 0, 0);
                    ctx.globalAlpha = 1; // Resetando a transparência
                }
                if (currentIndex < frameIds.length - 1) {
                    // Desenha o frame seguinte com semitransparência
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(frames[frameIds[currentIndex + 1]], 0, 0);
                    ctx.globalAlpha = 1;
                }
            }

            // Desenha o frame atual
            if (frames[frameId]) {
                ctx.drawImage(frames[frameId], 0, 0);
            } else {
                updateCanvas();
            }
        }

        // Alternar frames
        function switchFrame(frameId) {
            saveFrame(currentFrame); // Salva o estado do frame atual
            loadFrame(frameId); // Carrega o próximo frame
            currentFrame = frameId; // Atualiza o frame atual

            // Atualizar estilos de destaque
            document.querySelectorAll('.frame').forEach(frame => frame.classList.remove('frameativa'));
            document.getElementById(frameId).classList.add('frameativa');
        }

        // Eventos nos frames
        document.querySelectorAll('.frame').forEach(frame => {
            frame.addEventListener('click', () => switchFrame(frame.id));
        });

        // Controle de animação
        let isPlaying = false;
        let animationInterval;

        // Reproduzir animação
        function playAnimation() {
            if (isPlaying) return;

            isPlaying = true;
            const frameIds = Array.from(document.querySelectorAll('.frame')).map(frame => frame.id);
            let currentIndex = frameIds.indexOf(currentFrame);

            // Alteração do tempo para 12 FPS (aproximadamente 83ms por quadro)
            animationInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % frameIds.length;
                switchFrame(frameIds[currentIndex]);
            }, 1000 / 12); // 12 FPS
        }

        // Pausar animação
        function pauseAnimation() {
            if (!isPlaying) return;

            isPlaying = false;
            clearInterval(animationInterval);
        }

        // Eventos dos botões Play e Pause
        const playButton = document.getElementById('play');
        const pauseButton = document.getElementById('pause');

        playButton.addEventListener('click', playAnimation);
        pauseButton.addEventListener('click', pauseAnimation);

        // Variável para controle do Onion Skin
        let onionSkinEnabled = false;

        // Alternar Onion Skin
        const onionSkinButton = document.getElementById('onionskin');
        onionSkinButton.addEventListener('click', () => {
            onionSkinEnabled = !onionSkinEnabled;
            onionSkinButton.style.opacity = onionSkinEnabled ? 1 : 0.5; // Alterar a opacidade para indicar se está ativado
        });

socket.on('draw', ({ lastX, lastY, currentX, currentY, color, lineWidth }) => {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();
});

/*
// Suporte para dispositivos móveis
canvas.addEventListener('touchstart', (e) => {
    isDrawing = true;
    e.preventDefault();
    [lastX, lastY] = [e.touches[0].clientX, e.touches[0].clientY];
});

canvas.addEventListener('touchend', () => isDrawing = false);
canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(touch.clientX, touch.clientY);
    ctx.strokeStyle = pintar;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
    [lastX, lastY] = [touch.clientX, touch.clientY];
});
*/