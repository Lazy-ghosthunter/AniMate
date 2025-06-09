//Conecta ao servidor socket.io
const socket = io('http://localhost:3000');

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

// Quadro dos tamanhos do pincel
const botaoTamanho = document.getElementById('tamanho');
const menuTamanho = document.getElementById('tool-size');

botaoTamanho.addEventListener('click', () => {
  if (menuTamanho.style.display === 'flex') {
    menuTamanho.style.display = 'none';
  } else {
    menuTamanho.style.display = 'flex';
  }
});

//Canva + Contexto
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
let isDrawing = false; //Desenhar
let isErasing = false; //Apagar
let lastX = null;
let lastY = null;
let pintar = '#000000'; // Cor padrão do pincel
let brushSize = 10; //Tamanho do pincel/borracha

//Ferramentas de desenho
const ferramentas = document.querySelectorAll(".tool");
let activeTool = "traçar";

//Troca das ferramentas
const selectTool = ({target}) => {
    const selectedTool = target;
    const action = selectedTool.getAttribute("data-action");

    if (action) {
        activeTool = action;
    }
    
}

ferramentas.forEach((tool) => {
    tool.addEventListener("click", selectTool)
});

//Borracha
const erase = (x, y) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(
        x - canvas.offsetLeft,
        y - canvas.offsetTop,
        brushSize / 2,
        0,
        2 * Math.PI
    )
    ctx.fill();
}

// Desenha apenas com os botões esquerdo e direito do mouse
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 2) {
        //Para desenhar
        if (activeTool == "traçar") {
            isDrawing = true;
        } else if (activeTool == "apagar") {
            isErasing = true;
        }
    }
});

//Não abre o menu do navegador dentro da canva ao estar desenhando com o botão direito
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

//Configurações para evitar traços indesejados no desenho
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

//Desenha apenas quando o botão estiver se mexendo enquanto está sendo pressionando
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) {

        // Quando o mouse se mover sem o botão estar pressionado
        lastX = e.clientX - canvas.getBoundingClientRect().left;
        lastY = e.clientY - canvas.getBoundingClientRect().top;
        return; 

    }

    if (activeTool == "traçar") {

        const x = e.clientX - canvas.getBoundingClientRect().left;
        const y = e.clientY - canvas.getBoundingClientRect().top;

        //Coordenadas do desenho
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
            tool: 'traçar'
        });
    

        lastX = x;
        lastY = y;

    } else if (activeTool == "apagar"){ 
        isErasing = true;
        const x = e.clientX - canvas.getBoundingClientRect().left;
        const y = e.clientY - canvas.getBoundingClientRect().top;

        erase(x, y);
        ctx.beginPath();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 4;
        ctx.closePath();

    }    

    // Transmite apagamento
    socket.emit('draw', {
    x: x,
    y: y,
    radius: brushSize / 2,
    tool: 'apagar' 
    });

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

//Recebe os traços enviados pelo outro usuário
socket.on('draw', data => {
    if (data.tool === 'traçar') {
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.stroke();
        ctx.closePath();
    } else if (data.tool === 'apagar') {
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over"; 
        ctx.closePath();
        // Volta ao valor normal da ferramenta
    }
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