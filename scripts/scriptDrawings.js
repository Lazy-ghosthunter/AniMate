// ======================================================
// scriptDrawings.js — Salvar, listar e abrir desenhos
// Usado em: animateperfil.html e canvasAdm.html
// ======================================================

// ── Serializar o canvas atual ─────────────────────────

// ── Serializar o canvas atual (NOVO SISTEMA DE CAMADAS) ─────────
function serializeDrawing() {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return null;

    // Salva o frame ativo na memória antes de exportar
    if (typeof saveFrame === 'function') {
        saveFrame();
    }

    // Varre as camadas e converte as canvas em base64
    const serializedCanvases = {};
    if (typeof layerCanvases !== 'undefined') {
        for (const lId in layerCanvases) {
            serializedCanvases[lId] = {};
            for (const fId in layerCanvases[lId]) {
                const c = layerCanvases[lId][fId];
                if (c) {
                    serializedCanvases[lId][fId] = {
                        dataUrl: c.toDataURL('image/png'),
                        duration: c.frameDuration || 100 // Preserva o tempo do frame
                    };
                }
            }
        }
    }

    return JSON.stringify({
        version: 3, // Atualizado para refletir suporte a layers
        width: canvasEl.width,
        height: canvasEl.height,
        backgroundColor: localStorage.getItem('corCanvas') || '#ffffff',
        layers: typeof layers !== 'undefined' ? layers : {},
        layerOrder: typeof layerOrder !== 'undefined' ? layerOrder : [],
        currentLayerId: typeof currentLayerId !== 'undefined' ? currentLayerId : null,
        currentFrameIndex: typeof currentFrameIndex !== 'undefined' ? currentFrameIndex : 0,
        canvases: serializedCanvases
    });
}

// ── Restaurar desenho no canvas (NOVO SISTEMA DE CAMADAS) ───────
//
// IMPORTANTE: esta função NUNCA deve deixar o app num estado "vazio"
// (sem layers/currentLayerId) se algo der errado no meio do caminho —
// isso é o que fazia os botões pararem de responder depois de reabrir
// um desenho. Por isso ela:
//   1. Valida a estrutura recebida antes de tocar no estado global;
//   2. Dá timeout + onerror em cada imagem, para nunca travar o
//      Promise.all esperando para sempre por um dataURL corrompido;
//   3. Em caso de falha em qualquer etapa, cai num fallback explícito
//      (initializeDefaultLayers) em vez de deixar currentLayerId nulo.
const IMG_LOAD_TIMEOUT_MS = 8000;

function loadImageSafe(dataUrl, timeoutMs = IMG_LOAD_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        if (!dataUrl) {
            reject(new Error('dataUrl vazio'));
            return;
        }
        const img = new Image();
        const timer = setTimeout(() => {
            reject(new Error('Timeout ao carregar frame (dataURL possivelmente corrompido/truncado)'));
        }, timeoutMs);

        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(timer);
            reject(new Error('Falha ao decodificar dataURL do frame'));
        };
        img.src = dataUrl;
    });
}

async function deserializeDrawing(canvasDataJson) {
    let data;
    try {
        data = JSON.parse(canvasDataJson);
    } catch (e) {
        console.error('deserializeDrawing: JSON inválido/corrompido (possível truncamento no backend):', e);
        throw e; // quem chamou decide o fallback
    }

    // Validação mínima da estrutura — sem isso, seguir adiante só
    // espalha o problema (currentLayerId acaba apontando para nada).
    if (!data || typeof data !== 'object' || !data.layerOrder || !data.layerOrder.length || !data.layers) {
        throw new Error('deserializeDrawing: estrutura de dados incompleta (layers/layerOrder ausentes)');
    }

    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;

    const width = parseInt(data.width, 10) || 800;
    const height = parseInt(data.height, 10) || 600;

    // Configura tamanho e fundo
    canvasEl.width = width;
    canvasEl.height = height;
    localStorage.setItem('larguracanvas', width);
    localStorage.setItem('alturacanvas', height);
    localStorage.setItem('corCanvas', data.backgroundColor || '#ffffff');

    // Estado temporário — só substitui o estado global (layers/layerOrder/
    // layerCanvases) depois que TUDO carregou com sucesso. Assim, se algo
    // falhar no meio, o estado atual da página não fica pela metade.
    const newLayers = data.layers;
    const newLayerOrder = data.layerOrder;
    const newLayerCanvases = {};

    const loadJobs = [];

    if (data.canvases) {
        for (const lId in data.canvases) {
            newLayerCanvases[lId] = {};
            for (const fId in data.canvases[lId]) {
                const frameData = data.canvases[lId][fId];

                // Lida com a nova versão (com duração) ou versão antiga
                const dataUrl = typeof frameData === 'string' ? frameData : frameData?.dataUrl;
                const duration = typeof frameData === 'object' ? frameData.duration : 100;

                const job = loadImageSafe(dataUrl)
                    .then((img) => {
                        const fc = document.createElement('canvas');
                        fc.width = width;
                        fc.height = height;
                        fc.frameDuration = duration;
                        fc.getContext('2d').drawImage(img, 0, 0);
                        newLayerCanvases[lId][fId] = fc;
                    })
                    .catch((err) => {
                        // Um frame corrompido não pode travar a restauração inteira:
                        // loga o problema e segue com uma canvas em branco no lugar.
                        console.error(`deserializeDrawing: frame ${lId}/${fId} falhou ao carregar:`, err);
                        const fc = document.createElement('canvas');
                        fc.width = width;
                        fc.height = height;
                        fc.frameDuration = duration;
                        newLayerCanvases[lId][fId] = fc;
                    });

                loadJobs.push(job);
            }
        }
    }

    // Cada job já trata seu próprio erro internamente (.catch acima), então
    // este Promise.all sempre resolve — nunca fica pendurado esperando
    // para sempre por um dataURL inválido.
    await Promise.all(loadJobs);

    // Só agora, com tudo pronto, substitui o estado global de fato
    // (sem "window." — layers/layerOrder/layerCanvases são `let` no topo de
    // scriptDraw.js; escrever em window.X cria uma propriedade separada que
    // as funções de desenho nunca leem)
    layers = newLayers;
    layerOrder = newLayerOrder;
    layerCanvases = newLayerCanvases;

    currentLayerId = data.currentLayerId && layers[data.currentLayerId]
        ? data.currentLayerId
        : layerOrder[layerOrder.length - 1];
    currentFrameIndex = data.currentFrameIndex || 0;

    if (typeof getFrameIdAtIndex === 'function') {
        currentFrameId = getFrameIdAtIndex(currentLayerId, currentFrameIndex);
    }

    // Atualiza a UI
    const layerLabel = document.getElementById('layer');
    if (layerLabel && layers[currentLayerId]) {
        layerLabel.textContent = layers[currentLayerId].name;
    }

    // updateCanvas() PRIMEIRO: ele redimensiona canvasFundo/Below/Above,
    // e redimensionar uma canvas limpa o conteúdo dela. Se rodasse depois
    // de loadFrame(), apagaria tudo que acabou de ser desenhado.
    if (typeof updateCanvas === 'function') updateCanvas();
    if (typeof renderLayersDropdown === 'function') renderLayersDropdown();
    if (typeof renderFrames === 'function') renderFrames();
    if (typeof loadFrame === 'function') loadFrame();
}

// ── Salvar novo desenho ───────────────────────────────

async function saveDrawing() {
    console.log('saveDrawing() chamado');
    
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Encontrado' : 'Não encontrado');
    if (!token) { alert('Você precisa estar logado para salvar.'); return; }

    const title = prompt('Nome do desenho:', 'Meu desenho') || 'Sem título';
    console.log('Título do novo desenho:', title);
    
    const canvasData = serializeDrawing();
    if (!canvasData) { alert('Canvas não encontrado.'); return; }
    console.log('Canvas serializado com sucesso');

    try {
        console.log('POST para:', `${base_url}/drawings?token=${token}`);
        const response = await axios.post(`${base_url}/drawings?token=${token}`, {
            title,
            canvasData,
        });

        console.log('Resposta do servidor:', response.data);
        
        if (response.data && response.data.id) {
            localStorage.setItem('currentDrawingId',    response.data.id);
            localStorage.setItem('currentDrawingTitle', response.data.title);
            console.log('ID salvo no localStorage:', response.data.id);
            alert(`"${response.data.title}" salvo com sucesso!`);
        } else {
            console.error('Resposta inválida - sem ID:', response.data);
            alert('Erro: O servidor não retornou um ID válido');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        console.error('Detalhes:', error.response?.data || error.message);
        alert('Falha ao salvar: ' + (error.response?.data || error.message));
    }
}

// ── Iniciar novo desenho ──────────────────────────────

function newDrawing() {
    console.log('newDrawing() chamado');
    
    if (!confirm('Descartar o desenho atual e começar um novo?')) return;
    
    // Limpa o ID do desenho atual para que o próximo "Salvar" crie novo
    localStorage.removeItem('currentDrawingId');
    localStorage.removeItem('currentDrawingTitle');
    localStorage.removeItem('pendingDrawingData');

    // Limpa também as configurações de tamanho/cor da canvas anterior.
    // Sem isso, a próxima vez que uma canvas nova for criada (tela de
    // configurações) ela herda largura/altura/cor da canvas antiga, porque
    // updateCanvas() sempre lê esses valores do localStorage e nada os
    // reseta entre uma sessão e outra.
    localStorage.removeItem('larguracanvas');
    localStorage.removeItem('alturacanvas');
    localStorage.removeItem('corCanvas');
    
    console.log('IDs e configurações de canvas removidos do localStorage');
    
    // Limpa o objeto frames
    if (typeof frames !== 'undefined') {
        frames = {};
        console.log('frames limpo');
    }
    
    // Reseta o frame atual
    if (typeof currentFrame !== 'undefined') {
        currentFrame = 'frame1';
        console.log('currentFrame resetado');
    }
    
    // Reseta também o sistema de camadas atual (em uso), além das chaves
    // de localStorage acima — caso contrário layers/currentLayerId desta
    // sessão continuam apontando para o desenho antigo na memória.
    if (typeof initializeDefaultLayers === 'function') {
        initializeDefaultLayers();
        const layerLabelEl = document.getElementById('layer');
        if (layerLabelEl && typeof layers !== 'undefined' && layers[currentLayerId]) {
            layerLabelEl.textContent = layers[currentLayerId].name;
        }
        if (typeof renderFrames === 'function') renderFrames();
        if (typeof renderLayersDropdown === 'function') renderLayersDropdown();
    }

    // Limpa o canvas visível
    const canvas = document.getElementById('canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const bgColor = '#ffffff'; // valor padrão, já que corCanvas foi resetado acima
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas limpo');
    }
    
    // Atualiza o título
    document.title = 'AniMate';
    
    console.log('Novo desenho iniciado - pronto para desenhar!');
}

// ── Atualizar desenho existente ───────────────────────

async function updateDrawing() {
    console.log('updateDrawing() chamado');
    
    const token     = localStorage.getItem('token');
    const drawingId = localStorage.getItem('currentDrawingId');

    console.log('Token:', token ? 'Encontrado' : 'Não encontrado');
    console.log('DrawingId:', drawingId);

    if (!token) { alert('Você precisa estar logado.'); return; }
    
    if (!drawingId) { 
        console.log('Nenhum ID encontrado, chamando saveDrawing() para criar novo');
        return saveDrawing(); 
    }

    const canvasData = serializeDrawing();
    console.log('Canvas serializado com sucesso');

    try {
        console.log('PUT para:', `${base_url}/drawings/${drawingId}?token=${token}`);
        const response = await axios.put(`${base_url}/drawings/${drawingId}?token=${token}`, { canvasData });
        
        console.log('Desenho atualizado:', response.data);
        alert('Desenho atualizado!');
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        console.error('Detalhes:', error.response?.data || error.message);
        alert('Falha ao atualizar: ' + (error.response?.data || error.message));
    }
}

// ── Listar desenhos no perfil ─────────────────────────

async function loadDrawingsList() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const lista = document.querySelector('.lista');
    if (!lista) return;

    try {
        const response = await axios.get(`${base_url}/drawings?token=${token}`);
        const drawings = response.data;

        lista.querySelectorAll('.itens').forEach(el => el.remove());
        lista.querySelectorAll('.empty-msg').forEach(el => el.remove());

        if (drawings.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-msg';
            empty.textContent = 'Nenhum desenho salvo ainda.';
            empty.style.cssText = 'color:#aaa;padding:12px;';
            lista.appendChild(empty);
            return;
        }

        drawings.forEach(drawing => {
            const item = document.createElement('div');
            item.className = 'itens';
            item.dataset.id = drawing.id;
            item.innerHTML = `
                <div class="drawing-item-info">
                    <p class="drawing-title">${drawing.title}</p>
                    <p class="drawing-date">${new Date(drawing.updatedAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="drawing-item-actions">
                    <button class="btn-open-drawing"   data-id="${drawing.id}">Abrir</button>
                    <button class="btn-delete-drawing" data-id="${drawing.id}"><img src="imgs/delete_file.svg" title="Deletar animação"></button>
                </div>
            `;
            lista.appendChild(item);
        });

        lista.querySelectorAll('.btn-open-drawing').forEach(btn => {
            btn.addEventListener('click', e => openDrawing(e.target.dataset.id));
        });

        lista.querySelectorAll('.btn-delete-drawing').forEach(btn => {
            btn.addEventListener('click', async e => {
                await deleteDrawing(e.target.dataset.id);
                await loadDrawingsList();
            });
        });

    } catch (error) {
        console.error('Erro ao carregar lista:', error);
    }
}

// ── Abrir desenho ─────────────────────────────────────

async function openDrawing(drawingId) {
    console.log('openDrawing() chamado com ID:', drawingId);
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        console.log('GET para:', `${base_url}/drawings/${drawingId}?token=${token}`);
        const response = await axios.get(`${base_url}/drawings/${drawingId}?token=${token}`);
        const drawing  = response.data;

        console.log('Desenho carregado:', drawing);

        localStorage.setItem('currentDrawingId',    drawing.id);
        localStorage.setItem('currentDrawingTitle', drawing.title);
        localStorage.setItem('pendingDrawingData',  drawing.canvasData);

        console.log('Dados salvos no localStorage:');
        console.log('  ID:', drawing.id);
        console.log('  Título:', drawing.title);
        
        window.location.href = 'canvasAdm.html';
    } catch (error) {
        console.error('Erro ao abrir:', error);
        console.error('Detalhes:', error.response?.data || error.message);
        alert('Não foi possível abrir o desenho.');
    }
}

// ── Deletar desenho ───────────────────────────────────

async function deleteDrawing(drawingId) {
    if (!confirm('Deletar este desenho?')) return;
    const token = localStorage.getItem('token');
    try {
        await axios.delete(`${base_url}/drawings/${drawingId}?token=${token}`);
    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Falha ao deletar o desenho.');
    }
}

// ── Inicialização ─────────────────────────────────────

// Aguarda TUDO carregar (window.onload do scriptDraw.js incluso)
window.addEventListener('load', async () => {
    console.log('scriptDrawings.js - load event iniciado');

    // --- Página do perfil: carrega lista ---
    if (document.querySelector('.lista')) {
        console.log('Página do perfil detectada - carregando lista de desenhos');
        await loadDrawingsList();
    }

    // --- Canvas: restaura desenho pendente ---
    const pendingData = localStorage.getItem('pendingDrawingData');
    console.log('Dados pendentes encontrados:', pendingData ? 'Sim' : 'Não');
    
    if (pendingData && document.getElementById('canvas')) {
        try {
            console.log('Restaurando desenho pendente...');
            window.__drawingRestored = true;
            await deserializeDrawing(pendingData);
            localStorage.removeItem('pendingDrawingData');

            const title = localStorage.getItem('currentDrawingTitle') || '';
            if (title) document.title = `AniMate — ${title}`;

            const currentId = localStorage.getItem('currentDrawingId');
            console.log('Desenho restaurado com sucesso - ID:', currentId);
        } catch (err) {
            console.error('Erro ao restaurar desenho:', err);

            // Sem este fallback, layers/currentLayerId ficam vazios e TODOS
            // os botões (frames, camadas, undo, etc.) param de responder,
            // porque suas funções fazem "if (!currentLayerId) return;".
            // Melhor degradar para uma canvas em branco utilizável do que
            // deixar a tela "morta".
            alert('Não foi possível restaurar este desenho corretamente. Um novo desenho em branco foi iniciado.');
            localStorage.removeItem('pendingDrawingData');
            localStorage.removeItem('currentDrawingId');
            localStorage.removeItem('currentDrawingTitle');

            if (typeof updateCanvas === 'function') updateCanvas();
            if (typeof initializeDefaultLayers === 'function') initializeDefaultLayers();
            const layerLabelEl = document.getElementById('layer');
            if (layerLabelEl && typeof layers !== 'undefined' && layers[currentLayerId]) {
                layerLabelEl.textContent = layers[currentLayerId].name;
            }
            if (typeof loadFrame === 'function') loadFrame();
            if (typeof renderFrames === 'function') renderFrames();
            if (typeof renderLayersDropdown === 'function') renderLayersDropdown();
        }
    } else {
        console.log('Nenhum desenho pendente ou canvas não encontrado');
    }

    // --- Botão salvar no canvas ---
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        console.log('Botão salvar encontrado');
        btnSave.addEventListener('click', () => {
            const hasId = localStorage.getItem('currentDrawingId');
            console.log('Clique em salvar - ID existente:', hasId ? 'Sim (UPDATE)' : 'Não (CREATE)');
            
            if (hasId) {
                // Se existe um ID, pergunta ao usuário
                const action = confirm('Deseja atualizar o desenho atual?\n\nOK = Atualizar\nCancelar = Criar novo desenho');
                if (action) {
                    updateDrawing();
                } else {
                    localStorage.removeItem('currentDrawingId');
                    localStorage.removeItem('currentDrawingTitle');
                    saveDrawing();
                }
            } else {
                saveDrawing();
            }
        });
    } else {
        console.log('Botão salvar NÃO encontrado');
    }

    // --- Botão salvar novo desenho ---
    const btnSaveNew = document.getElementById('btnSaveNew');
    if (btnSaveNew) {
        console.log('Botão salvar novo encontrado');
        btnSaveNew.addEventListener('click', () => {
            console.log('Clique em salvar novo - removendo ID atual');
            localStorage.removeItem('currentDrawingId');
            localStorage.removeItem('currentDrawingTitle');
            saveDrawing();
        });
    } else {
        console.log('Botão salvar novo NÃO encontrado');
    }

    // --- Botão novo desenho ---
    const btnNew = document.getElementById('btnNew');
    if (btnNew) {
        console.log('Botão novo desenho encontrado');
        btnNew.addEventListener('click', newDrawing);
    } else {
        console.log('Botão novo desenho NÃO encontrado');
    }

    // --- Atalho de teclado: Ctrl+N para novo desenho ---
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            console.log('Atalho Ctrl+N acionado');
            newDrawing();
        }
    });
    console.log('Atalho Ctrl+N registrado');

});