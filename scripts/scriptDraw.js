//Conecta ao servidor socket.io
window.addEventListener('load', () => {
    const socket = window.socket;
    
    if (!socket) {
        console.error('❌ Socket não encontrado!');
        return;
    }

});


// Chat funcionalidades
const chatIcon = document.getElementById('chat');
const chatContainer = document.getElementById('chatcontainer');

// Adiciona o evento de mouse enter para mostrar o chat-container
chatIcon.addEventListener('click', function() {
    chatContainer.style.display = 'block';
});

//Função para fechar o chat
document.getElementById('fechar').addEventListener('click', () => {
    chatContainer.style.display = 'none';
})

// Funções no quadro dos tamanhos do pincel 
const botaoTamanho = document.getElementById('tamanho');
const menuTamanho = document.getElementById('tool-size');

// Mostra o menu de opções
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
const sizeButtons = document.querySelectorAll(".button_size");

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
    menuTamanho.style.display = 'none';
    const corSalva = localStorage.getItem('corr'); //Aplica a cor ao carregar a página
    if(corSalva) {
        pintar = corSalva;
        corPincel.value = corSalva;
    }

};

// Variáveis para desenho
let isDrawing = false; //Desenhar
let lastX = null;
let lastY = null;
let pintar = '#000000'; // Cor padrão do pincel
let brushSize = 1;  //! Tamanho do pincel/borracha

//Ferramentas de desenho
const ferramentas = document.querySelectorAll(".tool");
let activeTool = "traçar";

// Troca entre as ferramentas
const selectTool = ({target}) => {

    const selectedTool = target;
    const action = selectedTool.getAttribute("data-action");

    if (action) {

        ferramentas.forEach((tool) => tool.classList.remove("active"));
        selectedTool.classList.add("active");
        activeTool = action;

    }
    
}

// Troca do tamanho das ferramentas
const selectSize = ({target}) => {

    //Pegar o click próximo ao botão
    const selectedButton = target.closest(".button_size");

    // Evitar caso haja click fora do botão
    if (!selectedButton) {
        return;
    }

    const size = selectedButton.getAttribute("data-size");

    sizeButtons.forEach((button) => button.classList.remove("active"));
    selectedButton.classList.add("active");
    
    //Garante que o valor seja numérico
    brushSize = parseInt(size);

    //Fecha o menu após o click
    menuTamanho.style.display = 'none';
    
}

// Seleciona a ferramenta
ferramentas.forEach((tool) => {
    tool.addEventListener("click", selectTool)
});

//Seleciona os tamanhos (Pincel e borracha)
sizeButtons.forEach((button) => {
    button.addEventListener("click", selectSize)
});

// Funcionalidade da borracha
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

// Desenha e apagar com os botões esquerdo e direito do mouse
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 2) {
        //Para desenhar
        isDrawing = true;

                // Atualiza lastX e lastY no mousedown para o ponto de início exato
        lastX = e.clientX - canvas.getBoundingClientRect().left;
        lastY = e.clientY - canvas.getBoundingClientRect().top;

        // Se for a borracha, faz um "carimbo" inicial no ponto do clique
        // Isso é importante para que o primeiro toque da borracha seja visível
        if (activeTool === "apagar") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(lastX, lastY, brushSize / 2, 0, 2 * Math.PI); // Desenha um círculo no clique inicial
            ctx.fill();
            ctx.closePath();
            ctx.globalCompositeOperation = "source-over"; // Retorna ao modo normal após o "carimbo"
        } else if (activeTool === "traçar") {
            // Se for o pincel, você pode querer um "carimbo" inicial para cliques sem movimento
            // ctx.globalCompositeOperation = "source-over"; // Já é o padrão, mas por clareza
            // ctx.beginPath();
            // ctx.arc(lastX, lastY, brushSize / 2, 0, 2 * Math.PI);
            // ctx.fillStyle = pintar;
            // ctx.fill();
            // ctx.closePath();
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

    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;

    // Funcionalidade desenhar
    if (activeTool == "traçar") {

        //Coordenadas do desenho
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = pintar; 
        ctx.lineWidth = brushSize; 
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

        // Envia o desenho se realmente estiver desenhando
        socket.emit('draw', {
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            color: pintar,
            lineWidth: brushSize,
            tool: 'traçar'
        });
    

        lastX = x;
        lastY = y;

        // Funcionalidade apagar
    }  else if (activeTool == "apagar") {

        // Borracha em formato redondo
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

        // Envia o "apagamento" para os outros usuários
        socket.emit('draw', {
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            size: brushSize,
            tool: 'apagar'
        });

        lastX = x;
        lastY = y;

    }

});

// Alterar a cor do pincel
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
    onionSkinButton.style.opacity = onionSkinEnabled ? 1 : 0.5; 
    // Alterar a opacidade para indicar se está ativado
});

//Recebe e apaga os traços enviados pelos outros usuários
socket.on('draw', (data) => {

    // Recebe o desenhado
    if (data.tool === 'traçar') {

        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

        // Recebe o "apagamento" 
    } else if (data.tool === 'apagar') {

        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0); 
        ctx.lineTo(data.x1, data.y1); 
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = data.size; 
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

    }

    // Volta a operação normal
    ctx.globalCompositeOperation = "source-over";

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