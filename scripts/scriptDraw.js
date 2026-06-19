//Conecta ao servidor socket.io após toda a página estar carregada
window.addEventListener('load', () => {
    const socket = window.socket;

    if (!socket) {
        console.error('❌ Socket não encontrado!');
        return;
    }

});

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

const canvasFundo = document.getElementById('canvasfundo');
const ctxFundo = canvasFundo.getContext('2d');

// Carregar configurações salvas
const larguraC = localStorage.getItem('larguracanvas');
const alturaC = localStorage.getItem('alturacanvas');
const cor = localStorage.getItem('corCanvas');
const sizeButtons = document.querySelectorAll(".button_size");

// Configurações da Canvas
function updateCanvas() {

    canvas.width = parseInt(larguraC, 10);
    canvas.height = parseInt(alturaC, 10);

    canvasFundo.width = canvas.width;
    canvasFundo.height = canvas.height;

    desenharFundo(currentFrame);

    salvarEstado();
}

// Configuração inicial ao carregar a página
window.addEventListener('load', () => {
    const pendingData = localStorage.getItem('pendingDrawingData');
    const restoreFlag = window.__drawingRestored || false;

    if (pendingData || restoreFlag) {
        console.log('⏳ Restauração de desenho pendente detectada, pulando reset inicial do canvas');
        menuTamanho.style.display = 'none';
        const corSalva = localStorage.getItem('corr'); //Aplica a cor ao carregar a página
        if (corSalva) {
            pintar = corSalva;
            corPincel.value = corSalva;
        }
        return;
    }

    updateCanvas();
    switchFrame('frame1'); // Define o frame inicial
    menuTamanho.style.display = 'none';
    const corSalva = localStorage.getItem('corr'); //Aplica a cor ao carregar a página
    if (corSalva) {
        pintar = corSalva;
        corPincel.value = corSalva;
    }
});



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
const selectTool = ({ target }) => {

    const selectedTool = target;
    const action = selectedTool.getAttribute("data-action");

    if (action) {

        ferramentas.forEach((tool) => tool.classList.remove("active"));
        selectedTool.classList.add("active");
        activeTool = action;
        atualizarCursor();
    }

}

// NOVO: troca o ícone do cursor conforme a ferramenta ativa
function atualizarCursor() {
    if (activeTool === "apagar") {
        canvas.style.cursor = `url("data:image/svg+xml;utf8,<svg width='15' height='25' viewBox='0 0 15 25' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12.8351 23.0954C12.4814 23.6689 11.8481 24.0511 11.125 24.048L2.87503 24.0122C2.15189 24.0091 1.52194 23.6214 1.17315 23.0449L12.8351 23.0954ZM13.1374 21.1807C13.1094 21.1781 13.0811 21.1765 13.0524 21.1764L0.972482 21.1241C0.943843 21.1239 0.915517 21.1253 0.887505 21.1276L0.949918 6.71857C0.977941 6.72115 1.00618 6.72369 1.03486 6.72382L13.1148 6.77614C13.1435 6.77626 13.1718 6.77397 13.1998 6.77163L13.1374 21.1807ZM11.2289 0.0481822C12.3335 0.0529666 13.225 0.952267 13.2202 2.05683L13.2081 4.86051C13.1801 4.85793 13.1518 4.85636 13.1231 4.85624L1.04317 4.80391C1.01454 4.80379 0.9862 4.80512 0.958197 4.80745L0.970341 2.00377C0.975125 0.899206 1.87443 0.00766275 2.97899 0.0124472L11.2289 0.0481822Z' fill='black'/><rect x='0.0791016' y='5.75995' width='14' height='16.32' rx='1' transform='rotate(0.248178 0.0791016 5.75995)' fill='black'/></svg>") 7 12, auto`;
    } else if (activeTool === "traçar") {
        canvas.style.cursor = ''; // remove o estilo inline → volta a usar o cursor do CSS (pincel)
    }
    // Para "mudartam", "ir", "voltar" não fazemos nada — o cursor permanece como estava
}

// Troca do tamanho das ferramentas
const selectSize = ({ target }) => {

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
    if (isDrawing) salvarEstado();
    isDrawing = false;
    lastX = null;
    lastY = null;
});

document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

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
    } else if (activeTool == "apagar") {

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

    if (frames[frameId]) {
        ctx.drawImage(frames[frameId], 0, 0);
    }
    // se não existir ainda, o canvas já fica transparente — frame novo em branco

    desenharFundo(frameId);
}

// Alternar frames
function switchFrame(frameId) {
    if (frameId !== currentFrame) {
        // Durante a restauração inicial, não sobrescrever o frame atual
        if (window.__drawingRestored) {
            console.log('switchFrame: restauração pendente — pulando saveFrame para evitar sobrescrever frames restaurados');
            // limpar a flag para que próximas trocas funcionem normalmente
            window.__drawingRestored = false;
        } else {
            saveFrame(currentFrame); // Salva o estado do frame atual
        }
    }

    loadFrame(frameId); // Carrega o próximo frame
    currentFrame = frameId; // Atualiza o frame atual

    // Atualizar estilos de destaque
    document.querySelectorAll('.frame').forEach(frame => frame.classList.remove('frameativa'));
    const frameEl = document.getElementById(frameId);
    if (frameEl) {
        frameEl.classList.add('frameativa');
    }
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
    desenharFundo(currentFrame); // mostra ou esconde o fantasma imediatamente
});

//Função responsável pelo que aparece ao fundo da canva
const ONION_SKIN_ALPHA = 0.4; // ajuste à vontade: 0 (invisível) até 1 (opaco)

function desenharFundo(frameId) {
    // Limpa e repinta a cor de fundo
    ctxFundo.clearRect(0, 0, canvasFundo.width, canvasFundo.height);
    ctxFundo.fillStyle = cor || '#ffffff';
    ctxFundo.fillRect(0, 0, canvasFundo.width, canvasFundo.height);

    if (!onionSkinEnabled) return; // sem fantasma, já terminou

    const frameIds = Array.from(document.querySelectorAll('.frame')).map(f => f.id);
    const currentIndex = frameIds.indexOf(frameId);

    if (currentIndex > 0) {
        const frameAnterior = frames[frameIds[currentIndex - 1]];
        if (frameAnterior) {
            ctxFundo.globalAlpha = ONION_SKIN_ALPHA;
            ctxFundo.drawImage(frameAnterior, 0, 0);
            ctxFundo.globalAlpha = 1; // sempre resetar depois!
        }
    }
}

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

// Histórico para undo/redo
const historico = [];
let historicoIndex = -1;

// Salva o estado atual do canvas no histórico
function salvarEstado() {
    // Remove tudo que vem depois do index atual (ao desenhar após um undo)
    historico.splice(historicoIndex + 1);
    historico.push(canvas.toDataURL());
    historicoIndex++;
}

// Undo
function undo() {
    if (historicoIndex <= 0) return;
    historicoIndex--;
    restaurarEstado(historico[historicoIndex]);
}

// Redo
function redo() {
    if (historicoIndex >= historico.length - 1) return;
    historicoIndex++;
    restaurarEstado(historico[historicoIndex]);
}

function restaurarEstado(dataURL) {
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

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