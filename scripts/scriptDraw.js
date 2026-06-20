const socket = window.socket; // Torna o socket acessível no arquivo todo
const AVATAR_PADRAO = 'imgs/pfp anon.svg';

window.addEventListener('load', () => {
    iniciarAvatar(); 
});

function iniciarAvatar() {
    const avatarImg = document.getElementById('avatar');
    if (!avatarImg) return; 

    const loadAvatar = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            avatarImg.src = AVATAR_PADRAO;
            return;
        }

        try {
            const response = await axios.get(`${base_url}/profile/me?token=${token}`);
            const userProfile = response.data;

            if (userProfile.imageUrl) {
                const correctedUrl = userProfile.imageUrl.replace(/^(http:\/\/)+/g, 'http://');
                avatarImg.src = correctedUrl;
            } else {
                avatarImg.src = AVATAR_PADRAO;
            }
        } catch (error) {
            console.error('scriptAvatar: erro ao carregar foto de perfil:', error);
            avatarImg.src = AVATAR_PADRAO;
        }
    };

    loadAvatar();

    window.addEventListener('storage', (event) => {
        if (event.key === 'avatarUpdatedAt') {
            loadAvatar();
        }
    });
}

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

// ════════════════════════════════════════════════════════════
// Canvas + Contextos (4 camadas empilhadas via CSS)
// ════════════════════════════════════════════════════════════
const canvas = document.getElementById('canvas');           // camada ativa (onde se desenha)
const ctx = canvas.getContext('2d');

const canvasFundo = document.getElementById('canvasfundo'); // cor de fundo + onion skin
const ctxFundo = canvasFundo.getContext('2d');

const canvasBelow = document.getElementById('canvasBelow'); // composição das camadas abaixo da atual
const ctxBelow = canvasBelow.getContext('2d');

const canvasAbove = document.getElementById('canvasAbove'); // composição das camadas acima da atual
const ctxAbove = canvasAbove.getContext('2d');


const sizeButtons = document.querySelectorAll(".button_size");

// Configurações da Canvas
// Configurações da Canvas
function updateCanvas() {
    const larguraAtual = localStorage.getItem('larguracanvas');
    const alturaAtual = localStorage.getItem('alturacanvas');

    canvas.width = parseInt(larguraAtual, 10) || 800;
    canvas.height = parseInt(alturaAtual, 10) || 600;

    canvasFundo.width = canvas.width;
    canvasFundo.height = canvas.height;

    canvasBelow.width = canvas.width;
    canvasBelow.height = canvas.height;

    canvasAbove.width = canvas.width;
    canvasAbove.height = canvas.height;

    desenharFundo();
    salvarEstado();
}

// ════════════════════════════════════════════════════════════
// Sistema de Camadas e Frames
// ════════════════════════════════════════════════════════════

const FUNDO_LAYER_ID = '00000000-0000-0000-0000-000000000000';

let layers = {};            // { layerId: { id, name, opacity, visible, locked, frames: [frameId, ...] } }
let layerCanvases = {};     // { layerId: { frameId: <canvas> } }
let layerOrder = [];        // ordem de empilhamento — índice 0 = mais ao fundo
let currentLayerId = null;
let currentFrameId = null;
let currentFrameIndex = 0;  // posição (índice) na timeline, compartilhada entre camadas

function generateId(prefix = 'id') {
    // Ignoramos o prefixo e forçamos um UUID válido para não quebrar o Java
    return crypto.randomUUID();
}

function createBlankCanvas() {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    return c;
}

// Cria o projeto com as 2 camadas padrão: Fundo (travada) + Camada 1 (editável)
function initializeDefaultLayers() {
    layers = {};
    layerCanvases = {};
    layerOrder = [];

    // Camada de fundo — permanente, não editável, não selecionável
    const fundoFrameId = generateId('frame');
    layers[FUNDO_LAYER_ID] = {
        id: FUNDO_LAYER_ID,
        name: 'Fundo',
        opacity: 1.0,
        visible: true,
        locked: true,
        frames: [fundoFrameId]
    };
    layerCanvases[FUNDO_LAYER_ID] = { [fundoFrameId]: createBlankCanvas() };
    layerOrder.push(FUNDO_LAYER_ID);

    // Camada 1 — editável, é a camada inicial ativa
    const layer1Id = generateId('layer');
    const layer1FrameId = generateId('frame');
    layers[layer1Id] = {
        id: layer1Id,
        name: 'Camada 1',
        opacity: 1.0,
        visible: true,
        locked: false,
        frames: [layer1FrameId]
    };
    layerCanvases[layer1Id] = { [layer1FrameId]: createBlankCanvas() };
    layerOrder.push(layer1Id);

    currentLayerId = layer1Id;
    currentFrameId = layer1FrameId;
    currentFrameIndex = 0;
}

// Retorna o id do frame de uma camada numa posição (clampado ao tamanho da própria camada,
// permitindo que cada camada tenha uma quantidade diferente de frames)
function getFrameIdAtIndex(layerId, index) {
    const layer = layers[layerId];
    if (!layer || !layer.frames.length) return null;
    const clamped = Math.min(Math.max(index, 0), layer.frames.length - 1);
    return layer.frames[clamped];
}

// Salva os pixels do canvas ativo no frame atual da camada atual
function saveFrame() {
    if (!currentLayerId || !currentFrameId) return;
    const layer = layers[currentLayerId];
    if (!layer || layer.locked) return;

    const canvasEl = layerCanvases[currentLayerId][currentFrameId];
    if (!canvasEl) return;

    const c = canvasEl.getContext('2d');
    c.clearRect(0, 0, canvasEl.width, canvasEl.height);
    c.drawImage(canvas, 0, 0);
}

// Recompõe as camadas abaixo/acima da atual (cada uma com sua própria opacidade)
function renderLayerStacks() {
    if (!currentLayerId) return;
    const idx = layerOrder.indexOf(currentLayerId);

    ctxBelow.clearRect(0, 0, canvasBelow.width, canvasBelow.height);
    for (let i = 0; i < idx; i++) {
        const layerId = layerOrder[i];
        if (layerId === FUNDO_LAYER_ID) continue; // fundo é tratado por desenharFundo()
        const layer = layers[layerId];
        if (!layer.visible) continue;

        const frameId = getFrameIdAtIndex(layerId, currentFrameIndex);
        const frameCanvas = frameId ? layerCanvases[layerId][frameId] : null;
        if (frameCanvas) {
            ctxBelow.globalAlpha = layer.opacity;
            ctxBelow.drawImage(frameCanvas, 0, 0);
            ctxBelow.globalAlpha = 1;
        }
    }

    ctxAbove.clearRect(0, 0, canvasAbove.width, canvasAbove.height);
    for (let i = idx + 1; i < layerOrder.length; i++) {
        const layerId = layerOrder[i];
        const layer = layers[layerId];
        if (!layer.visible) continue;

        const frameId = getFrameIdAtIndex(layerId, currentFrameIndex);
        const frameCanvas = frameId ? layerCanvases[layerId][frameId] : null;
        if (frameCanvas) {
            ctxAbove.globalAlpha = layer.opacity;
            ctxAbove.drawImage(frameCanvas, 0, 0);
            ctxAbove.globalAlpha = 1;
        }
    }
}

// Carrega o frame atual no canvas ativo + recompõe o restante da pilha
function loadFrame() {
    if (!currentLayerId) return;
    const layer = layers[currentLayerId];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frameCanvas = layerCanvases[currentLayerId][currentFrameId];
    if (frameCanvas) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(frameCanvas, 0, 0);
        ctx.globalAlpha = 1;
    }

    // Feedback visual de camada oculta: continua editável, mas fica esmaecida
    canvas.style.opacity = layer.visible ? '1' : '0.35';

    renderLayerStacks();
    desenharFundo();
}

// Troca de frame dentro da MESMA camada
function switchFrame(frameId) {
    if (!currentLayerId) return;
    const layer = layers[currentLayerId];
    const idx = layer.frames.indexOf(frameId);
    if (idx === -1 || frameId === currentFrameId) return;

    saveFrame();
    currentFrameIndex = idx;
    currentFrameId = frameId;
    loadFrame();
    renderFrames();
}

// Troca de camada ativa (a camada de fundo nunca pode ser selecionada)
function switchLayer(layerId) {
    if (layerId === currentLayerId) return;
    const layer = layers[layerId];
    if (!layer || layer.locked) return;

    saveFrame();
    currentLayerId = layerId;
    currentFrameId = getFrameIdAtIndex(layerId, currentFrameIndex);

    const labelLayer = document.getElementById('layer');
    labelLayer.textContent = layer.name;

    loadFrame();
    renderFrames();
    renderLayersDropdown();
}

// ════════════════════════════════════════════════════════════
// Renderização da timeline (frames da camada atual, em ordem)
// ════════════════════════════════════════════════════════════
function renderFrames() {
    const frameContainer = document.getElementById('frameS1');
    const maisFrame = document.getElementById('maisframe');
    if (!frameContainer || !currentLayerId) return;

    frameContainer.querySelectorAll('.frame').forEach(el => el.remove());

    const layer = layers[currentLayerId];
    layer.frames.forEach((frameId, index) => {
        const frameEl = document.createElement('div');
        frameEl.className = 'frame';
        frameEl.dataset.frameId = frameId;
        frameEl.textContent = index + 1;
        if (frameId === currentFrameId) {
            frameEl.classList.add('frameativa');
        }
        frameEl.addEventListener('click', () => switchFrame(frameId));
        frameContainer.insertBefore(frameEl, maisFrame);
    });
}

// ════════════════════════════════════════════════════════════
// Renderização do dropdown de camadas (#listLayers)
// ════════════════════════════════════════════════════════════
function renderLayersDropdown() {
    const scrollArea = document.getElementById('layersScrollArea');
    if (!scrollArea) return;
    scrollArea.innerHTML = '';

    // Topo da pilha aparece primeiro na lista (convenção comum de editores de camadas)
    for (let i = layerOrder.length - 1; i >= 0; i--) {
        const layerId = layerOrder[i];
        const layer = layers[layerId];

        const item = document.createElement('div');
        item.className = 'itemCamada';
        item.dataset.id = layerId;
        if (layerId === currentLayerId) item.classList.add('ativa');
        if (layer.locked) item.classList.add('locked');

        const nome = document.createElement('span');
        nome.className = 'itemCamadaNome';
        nome.textContent = layer.name;
        item.appendChild(nome);

        if (layer.locked) {
            const lock = document.createElement('span');
            lock.className = 'lockIcon';
            item.title = 'Camada de fundo — fixa, não editável';
            item.appendChild(lock);
        } else {
            if (!layer.visible) {
                const hidden = document.createElement('span');
                hidden.className = 'hiddenIcon';
                item.appendChild(hidden);
            }
            item.addEventListener('click', () => {
                switchLayer(layerId);
                fecharDropdownCamadas();
            });
        }

        scrollArea.appendChild(item);
    }
}

// ════════════════════════════════════════════════════════════
// Dropdown: seleção de camadas (abre com a seta para baixo)
// ════════════════════════════════════════════════════════════
const btnEscolherCamada = document.getElementById('escolher_Camada');
const listLayers = document.getElementById('listLayers');

function abrirDropdownCamadas() {
    renderLayersDropdown();
    listLayers.classList.add('open');
    fecharLayerSettings();
}

function fecharDropdownCamadas() {
    listLayers.classList.remove('open');
}

function toggleDropdownCamadas() {
    if (listLayers.classList.contains('open')) {
        fecharDropdownCamadas();
    } else {
        abrirDropdownCamadas();
    }
}

btnEscolherCamada.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdownCamadas();
});

// Botão "+ Nova camada" dentro do dropdown
document.getElementById('btnAddLayer').addEventListener('click', (event) => {
    event.stopPropagation();
    addLayer();
});

// ════════════════════════════════════════════════════════════
// Dropdown: configurações da camada (sparkle) — auto-save
// ════════════════════════════════════════════════════════════
const configCamadaBtn = document.getElementById('config_Camada');
const layerSettingsPanel = document.getElementById('layerSettings');
const layerNameInput = document.getElementById('layerNameInput');
const layerOpacitySlider = document.getElementById('layerOpacitySlider');
const opacityValueLabel = document.getElementById('opacityValue');
const layerVisibleToggle = document.getElementById('layerVisibleToggle');

function populateLayerSettings() {
    const layer = layers[currentLayerId];
    if (!layer) return;
    layerNameInput.value = layer.name;
    layerOpacitySlider.value = Math.round(layer.opacity * 100);
    opacityValueLabel.textContent = `${Math.round(layer.opacity * 100)}%`;
    layerVisibleToggle.checked = layer.visible;
}

function abrirLayerSettings() {
    if (!currentLayerId || layers[currentLayerId].locked) return; // fundo não tem configurações
    populateLayerSettings();
    layerSettingsPanel.classList.add('open');
    fecharDropdownCamadas();
}

function fecharLayerSettings() {
    layerSettingsPanel.classList.remove('open');
}

function toggleLayerSettings() {
    if (layerSettingsPanel.classList.contains('open')) {
        fecharLayerSettings();
    } else {
        abrirLayerSettings();
    }
}

configCamadaBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleLayerSettings();
});

// Nome — salva a cada digitação
layerNameInput.addEventListener('input', () => {
    if (!currentLayerId || layers[currentLayerId].locked) return;
    const value = layerNameInput.value.trim();
    if (!value) return; // evita nome vazio enquanto digita
    layers[currentLayerId].name = value;
    document.getElementById('layer').textContent = value;
    renderLayersDropdown();
});

// Garante que o nome nunca fique vazio ao sair do campo
layerNameInput.addEventListener('blur', () => {
    if (!currentLayerId) return;
    if (!layerNameInput.value.trim()) {
        layerNameInput.value = layers[currentLayerId].name;
    }
});

// Opacidade — salva em tempo real (slider horizontal)
layerOpacitySlider.addEventListener('input', () => {
    if (!currentLayerId || layers[currentLayerId].locked) return;
    const opacity = parseInt(layerOpacitySlider.value, 10) / 100;
    layers[currentLayerId].opacity = opacity;
    opacityValueLabel.textContent = `${layerOpacitySlider.value}%`;
    loadFrame();
});

// Visibilidade — salva imediatamente
layerVisibleToggle.addEventListener('change', () => {
    if (!currentLayerId || layers[currentLayerId].locked) return;
    layers[currentLayerId].visible = layerVisibleToggle.checked;
    loadFrame();
    renderLayersDropdown();
});

// ── Adicionar camada ───────────────────────────────────────
function addLayer(name = null) {
    const totalEditaveis = layerOrder.filter(id => id !== FUNDO_LAYER_ID).length;
    const layerName = name || `Camada ${totalEditaveis + 1}`;

    const layerId = generateId('layer');
    const frameId = generateId('frame');

    layers[layerId] = {
        id: layerId,
        name: layerName,
        opacity: 1.0,
        visible: true,
        locked: false,
        frames: [frameId]
    };
    layerCanvases[layerId] = { [frameId]: createBlankCanvas() };
    layerOrder.push(layerId); // nova camada vai para o topo da pilha

    switchLayer(layerId);
    renderLayersDropdown();
}

// ── Duplicar camada ────────────────────────────────────────
function duplicateLayer(layerId) {
    const original = layers[layerId];
    if (!original || original.locked) return;

    saveFrame(); // garante que o frame atual está atualizado antes de copiar

    const newLayerId = generateId('layer');
    const newFrames = [];
    layerCanvases[newLayerId] = {};

    original.frames.forEach(frameId => {
        const newFrameId = generateId('frame');
        const copy = createBlankCanvas();
        const originalCanvas = layerCanvases[layerId][frameId];
        if (originalCanvas) {
            copy.getContext('2d').drawImage(originalCanvas, 0, 0);
            copy.frameDuration = originalCanvas.frameDuration;
        }
        layerCanvases[newLayerId][newFrameId] = copy;
        newFrames.push(newFrameId);
    });

    layers[newLayerId] = {
        id: newLayerId,
        name: original.name + ' (cópia)',
        opacity: original.opacity,
        visible: original.visible,
        locked: false,
        frames: newFrames
    };

    const idx = layerOrder.indexOf(layerId);
    layerOrder.splice(idx + 1, 0, newLayerId); // logo acima da original

    switchLayer(newLayerId);
    fecharLayerSettings();
    renderLayersDropdown();
}

document.getElementById('btnDuplicateLayer').addEventListener('click', () => {
    if (currentLayerId) duplicateLayer(currentLayerId);
});

// ── Excluir camada (com modal de confirmação) ─────────────────
const DELETE_WARNING_KEY = 'animate_skip_layer_delete_warning';
const deleteLayerModal = document.getElementById('deleteLayerModal');

function requestDeleteLayer(layerId) {
    const layer = layers[layerId];
    if (!layer || layer.locked) return;

    const editaveis = layerOrder.filter(id => !layers[id].locked);
    if (editaveis.length === 1) {
        alert('Você precisa ter pelo menos uma camada desenhável além do fundo!');
        return;
    }

    const skipWarning = localStorage.getItem(DELETE_WARNING_KEY) === 'true';
    if (skipWarning) {
        performDeleteLayer(layerId);
        return;
    }

    deleteLayerModal.dataset.layerId = layerId;
    deleteLayerModal.classList.add('open');
}

function closeDeleteModal() {
    deleteLayerModal.classList.remove('open');
    delete deleteLayerModal.dataset.layerId;
}

function performDeleteLayer(layerId) {
    const layer = layers[layerId];
    if (!layer || layer.locked) return;

    delete layers[layerId];
    delete layerCanvases[layerId];
    layerOrder = layerOrder.filter(id => id !== layerId);

    if (currentLayerId === layerId) {
        const proxima = layerOrder.filter(id => !layers[id].locked)[0];
        currentLayerId = null; // força switchLayer a não dar "no-op" por id igual
        switchLayer(proxima);
    }

    fecharLayerSettings();
    renderLayersDropdown();
}

document.getElementById('btnDeleteLayer').addEventListener('click', () => {
    if (currentLayerId) requestDeleteLayer(currentLayerId);
});

document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);

document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    const layerId = deleteLayerModal.dataset.layerId;
    const dontWarnAgain = document.getElementById('dontWarnAgain').checked;
    if (dontWarnAgain) {
        localStorage.setItem(DELETE_WARNING_KEY, 'true');
    }
    closeDeleteModal();
    if (layerId) performDeleteLayer(layerId);
});

// Fecha os dois dropdowns ao clicar fora deles (o modal só fecha pelos botões)
document.addEventListener('click', (event) => {
    const dentroLista = listLayers.contains(event.target) || btnEscolherCamada.contains(event.target);
    const dentroConfig = layerSettingsPanel.contains(event.target) || configCamadaBtn.contains(event.target);

    if (!dentroLista) fecharDropdownCamadas();
    if (!dentroConfig) fecharLayerSettings();
});

// ════════════════════════════════════════════════════════════
// Frame Tools (#frameTools): addBefore / timing / deleteFrame / addAfter
// ════════════════════════════════════════════════════════════

// Insere um novo frame antes ou depois do frame atual, copiando o conteúdo do frame atual
function insertFrame(position) {
    if (!currentLayerId) return;
    const layer = layers[currentLayerId];
    if (layer.locked) return;

    saveFrame();

    const newFrameId = generateId('frame');
    const newCanvas = createBlankCanvas();

    
    layerCanvases[currentLayerId][newFrameId] = newCanvas;

    const idx = layer.frames.indexOf(currentFrameId);
    const insertIndex = position === 'before' ? idx : idx + 1;
    layer.frames.splice(insertIndex, 0, newFrameId);

    switchFrame(newFrameId);
}

document.getElementById('addBefore').addEventListener('click', () => insertFrame('before'));
document.getElementById('addAfter').addEventListener('click', () => insertFrame('after'));

// Remove o frame atual (a camada precisa manter pelo menos 1 frame)
function removeFrame(frameId) {
    if (!currentLayerId) return;
    const layer = layers[currentLayerId];
    if (layer.locked) return;

    if (layer.frames.length === 1) {
        alert('Cada camada precisa ter pelo menos um frame!');
        return;
    }

    const idx = layer.frames.indexOf(frameId);
    if (idx === -1) return;

    layer.frames.splice(idx, 1);
    delete layerCanvases[currentLayerId][frameId];

    const novoIndex = Math.max(0, idx - 1);
    const novoFrameId = layer.frames[novoIndex];

    currentFrameId = null; // evita early-return de switchFrame
    switchFrame(novoFrameId);
}

document.getElementById('deleteFrame').addEventListener('click', () => {
    if (currentFrameId) removeFrame(currentFrameId);
});

// Duração do frame (ms)
function editFrameTiming(frameId) {
    if (!currentLayerId) return;
    const canvasEl = layerCanvases[currentLayerId][frameId];
    if (!canvasEl) return;

    const atual = canvasEl.frameDuration || 100;
    const input = prompt('Duração do frame (em milissegundos):', atual);
    if (input === null) return;

    const valor = parseInt(input, 10);
    if (isNaN(valor) || valor <= 0) {
        alert('Valor inválido. Digite um número maior que zero.');
        return;
    }
    canvasEl.frameDuration = valor;
}

document.getElementById('timing').addEventListener('click', () => {
    if (currentFrameId) editFrameTiming(currentFrameId);
});

// Botão "+" no final da timeline — adiciona frame ao fim da camada atual
document.getElementById('maismais').addEventListener('click', () => {
    if (!currentLayerId) return;
    const layer = layers[currentLayerId];
    if (layer.locked) return;

    saveFrame();

    const newFrameId = generateId('frame');
    const newCanvas = createBlankCanvas();

    

    layerCanvases[currentLayerId][newFrameId] = newCanvas;
    layer.frames.push(newFrameId);

    switchFrame(newFrameId);
});

// ════════════════════════════════════════════════════════════
// Configuração inicial ao carregar a página
// ════════════════════════════════════════════════════════════
window.addEventListener('load', () => {
    const pendingData = localStorage.getItem('pendingDrawingData');
    const restoreFlag = window.__drawingRestored || false;

    if (pendingData || restoreFlag) {
        console.log('⏳ Restauração de desenho pendente detectada, pulando reset inicial do canvas');
        menuTamanho.style.display = 'none';
        const corSalva = localStorage.getItem('corr');
        if (corSalva) {
            pintar = corSalva;
            corPincel.value = corSalva;
        }
        return;
    }

    updateCanvas();
    initializeDefaultLayers();

    document.getElementById('layer').textContent = layers[currentLayerId].name;
    loadFrame();
    renderFrames();
    renderLayersDropdown();

    menuTamanho.style.display = 'none';
    const corSalva = localStorage.getItem('corr');
    if (corSalva) {
        pintar = corSalva;
        corPincel.value = corSalva;
    }
});

// Variáveis para desenho
let isDrawing = false;
let lastX = null;
let lastY = null;
let pintar = '#000000';
let brushSize = 1;

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
        atualizarCursor();
    }
    
}

// troca o ícone do cursor conforme a ferramenta ativa
function atualizarCursor() {
    if (activeTool === "apagar") {
        canvas.style.cursor = `url("data:image/svg+xml;utf8,<svg width='15' height='25' viewBox='0 0 15 25' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12.8351 23.0954C12.4814 23.6689 11.8481 24.0511 11.125 24.048L2.87503 24.0122C2.15189 24.0091 1.52194 23.6214 1.17315 23.0449L12.8351 23.0954ZM13.1374 21.1807C13.1094 21.1781 13.0811 21.1765 13.0524 21.1764L0.972482 21.1241C0.943843 21.1239 0.915517 21.1253 0.887505 21.1276L0.949918 6.71857C0.977941 6.72115 1.00618 6.72369 1.03486 6.72382L13.1148 6.77614C13.1435 6.77626 13.1718 6.77397 13.1998 6.77163L13.1374 21.1807ZM11.2289 0.0481822C12.3335 0.0529666 13.225 0.952267 13.2202 2.05683L13.2081 4.86051C13.1801 4.85793 13.1518 4.85636 13.1231 4.85624L1.04317 4.80391C1.01454 4.80379 0.9862 4.80512 0.958197 4.80745L0.970341 2.00377C0.975125 0.899206 1.87443 0.00766275 2.97899 0.0124472L11.2289 0.0481822Z' fill='black'/><rect x='0.0791016' y='5.75995' width='14' height='16.32' rx='1' transform='rotate(0.248178 0.0791016 5.75995)' fill='black'/></svg>") 7 12, auto`;
    } else if (activeTool === "traçar") {
        canvas.style.cursor = '';
    }
}

// Troca do tamanho das ferramentas
const selectSize = ({target}) => {

    const selectedButton = target.closest(".button_size");
    if (!selectedButton) {
        return;
    }

    const size = selectedButton.getAttribute("data-size");

    sizeButtons.forEach((button) => button.classList.remove("active"));
    selectedButton.classList.add("active");

    brushSize = parseInt(size);

    menuTamanho.style.display = 'none';
    
}

ferramentas.forEach((tool) => {
    tool.addEventListener("click", selectTool)
});

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
    if (!currentLayerId || layers[currentLayerId].locked) return; // segurança extra

    if (e.button === 0 || e.button === 2) {
        isDrawing = true;

        lastX = e.clientX - canvas.getBoundingClientRect().left;
        lastY = e.clientY - canvas.getBoundingClientRect().top;

        if (activeTool === "apagar") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(lastX, lastY, brushSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
            ctx.globalCompositeOperation = "source-over";
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        salvarEstado();
        saveFrame();
    }
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

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) {
        lastX = e.clientX - canvas.getBoundingClientRect().left;
        lastY = e.clientY - canvas.getBoundingClientRect().top;
        return;
    }

    if (!currentLayerId || layers[currentLayerId].locked) return;

    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;

    if (activeTool == "traçar") {

        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = pintar;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

        socket?.emit('draw', {
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            color: pintar,
            lineWidth: brushSize,
            tool: 'traçar',
            layerId: currentLayerId,
            frameId: currentFrameId
        });

        lastX = x;
        lastY = y;

    } else if (activeTool == "apagar") {

        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

        socket?.emit('draw', {
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            size: brushSize,
            tool: 'apagar',
            layerId: currentLayerId,
            frameId: currentFrameId
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

const colorPicker = document.getElementById('corr');
const color = colorPicker.value;

// ════════════════════════════════════════════════════════════
// Controle de animação (Play / Pause) — respeita a duração de cada frame
// ════════════════════════════════════════════════════════════
let isPlaying = false;
let animationTimeoutId = null;

function playAnimation() {
    if (isPlaying || !currentLayerId) return;
    isPlaying = true;

    const step = () => {
        if (!isPlaying) return;
        const layer = layers[currentLayerId];
        const frameId = layer.frames[currentFrameIndex];
        const frameCanvas = layerCanvases[currentLayerId][frameId];
        const duration = (frameCanvas && frameCanvas.frameDuration) || 100;

        animationTimeoutId = setTimeout(() => {
            currentFrameIndex = (currentFrameIndex + 1) % layer.frames.length;
            currentFrameId = layer.frames[currentFrameIndex];
            loadFrame();
            renderFrames();
            step();
        }, duration);
    };

    step();
}

function pauseAnimation() {
    if (!isPlaying) return;
    isPlaying = false;
    clearTimeout(animationTimeoutId);
}

const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');

playButton.addEventListener('click', playAnimation);
pauseButton.addEventListener('click', pauseAnimation);

// Variável para controle do Onion Skin
let onionSkinEnabled = false;

const onionSkinButton = document.getElementById('onionskin');
onionSkinButton.addEventListener('click', () => {
    onionSkinEnabled = !onionSkinEnabled;
    onionSkinButton.style.opacity = onionSkinEnabled ? 1 : 0.5;
    desenharFundo();
});

const ONION_SKIN_ALPHA = 0.4;

// Pinta a cor de fundo + (opcional) o frame anterior da camada atual como "fantasma"
function desenharFundo() {
    const corAtual = localStorage.getItem('corCanvas') || '#ffffff';
    
    ctxFundo.clearRect(0, 0, canvasFundo.width, canvasFundo.height);
    ctxFundo.fillStyle = corAtual;
    ctxFundo.fillRect(0, 0, canvasFundo.width, canvasFundo.height);

    if (!onionSkinEnabled || !currentLayerId) return;

    if (currentFrameIndex > 0) {
        const prevFrameId = getFrameIdAtIndex(currentLayerId, currentFrameIndex - 1);
        const prevCanvas = prevFrameId ? layerCanvases[currentLayerId][prevFrameId] : null;
        if (prevCanvas) {
            ctxFundo.globalAlpha = ONION_SKIN_ALPHA;
            ctxFundo.drawImage(prevCanvas, 0, 0);
            ctxFundo.globalAlpha = 1;
        }
    }
}

// ════════════════════════════════════════════════════════════
// Recebe traços/apagamentos de outros usuários (colaborativo)
// ════════════════════════════════════════════════════════════
if (socket) {
    socket.on('draw', (data) => {

        const targetCanvas = (data.layerId && data.frameId && layerCanvases[data.layerId])
            ? layerCanvases[data.layerId][data.frameId]
            : null;

        if (!targetCanvas) return;

        const tctx = targetCanvas.getContext('2d');

        if (data.tool === 'traçar') {
            tctx.globalCompositeOperation = "source-over";
            tctx.beginPath();
            tctx.moveTo(data.x0, data.y0);
            tctx.lineTo(data.x1, data.y1);
            tctx.strokeStyle = data.color;
            tctx.lineWidth = data.lineWidth;
            tctx.lineCap = "round";
            tctx.stroke();
            tctx.closePath();

        } else if (data.tool === 'apagar') {
            tctx.globalCompositeOperation = "destination-out";
            tctx.beginPath();
            tctx.moveTo(data.x0, data.y0);
            tctx.lineTo(data.x1, data.y1);
            tctx.strokeStyle = '#000000';
            tctx.lineWidth = data.size;
            tctx.lineCap = "round";
            tctx.stroke();
            tctx.closePath();
        }

        tctx.globalCompositeOperation = "source-over";

        if (currentLayerId) {
            const frameVisivelAgora = getFrameIdAtIndex(data.layerId, currentFrameIndex) === data.frameId;
            if (frameVisivelAgora) {
                loadFrame();
            }
        }
    });
} else {
    console.warn("Socket não encontrado. O desenho multiplayer está desativado.");
}

// ════════════════════════════════════════════════════════════
// Histórico para undo/redo (opera sobre a camada ativa)
// ════════════════════════════════════════════════════════════
const historico = [];
let historicoIndex = -1;

function salvarEstado() {
    historico.splice(historicoIndex + 1);
    historico.push(canvas.toDataURL());
    historicoIndex++;
}

function undo() {
    if (historicoIndex <= 0) return;
    historicoIndex--;
    restaurarEstado(historico[historicoIndex]);
}

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
        saveFrame(); // garante que o undo/redo também fique persistido na camada
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