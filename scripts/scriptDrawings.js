// ======================================================
// scriptDrawings.js — Salvar, listar e abrir desenhos
// Usado em: animateperfil.html e canvasAdm.html
// ======================================================

// ── Serializar o canvas atual ─────────────────────────

function serializeDrawing() {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return null;

    // Pega dimensões REAIS do canvas que está na tela agora
    const width  = canvasEl.width;
    const height = canvasEl.height;

    // Força salvar o frame que está visível agora no objeto frames
    // antes de serializar tudo
    if (typeof currentFrame !== 'undefined' && typeof frames !== 'undefined') {
        const fc = document.createElement('canvas');
        fc.width  = width;
        fc.height = height;
        fc.getContext('2d').drawImage(canvasEl, 0, 0);
        frames[currentFrame] = fc;
    }

    // Serializa cada frame como PNG base64
    const frameIds = Array.from(document.querySelectorAll('.frame')).map(f => f.id);
    const serializedFrames = {};

    frameIds.forEach(id => {
        if (frames && frames[id]) {
            serializedFrames[id] = frames[id].toDataURL('image/png');
        }
    });

    // Se só tem 1 frame e ele é o atual, garante que está incluído
    if (Object.keys(serializedFrames).length === 0 && canvasEl) {
        const activeId = (typeof currentFrame !== 'undefined') ? currentFrame : 'frame1';
        serializedFrames[activeId] = canvasEl.toDataURL('image/png');
    }

    return JSON.stringify({
        version: 2,
        width,
        height,
        backgroundColor: localStorage.getItem('corCanvas') || '#ffffff',
        currentFrame: (typeof currentFrame !== 'undefined') ? currentFrame : 'frame1',
        frameOrder: frameIds.length > 0 ? frameIds : ['frame1'],
        frames: serializedFrames,
    });
}

// ── Restaurar desenho no canvas ───────────────────────

async function deserializeDrawing(canvasDataJson) {
    const data = JSON.parse(canvasDataJson);
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;

    // Aplica o tamanho correto diretamente no elemento canvas
    canvasEl.width  = data.width;
    canvasEl.height = data.height;

    // Também atualiza o localStorage para ficar consistente
    localStorage.setItem('larguracanvas', data.width);
    localStorage.setItem('alturacanvas',  data.height);
    localStorage.setItem('corCanvas',     data.backgroundColor);

    // Restaura cada frame no objeto frames (do scriptDraw.js)
    const loadPromises = Object.entries(data.frames).map(([frameId, dataUrl]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const fc = document.createElement('canvas');
                fc.width  = data.width;
                fc.height = data.height;
                fc.getContext('2d').drawImage(img, 0, 0);
                if (typeof frames !== 'undefined') {
                    frames[frameId] = fc;
                }
                resolve();
            };
            img.src = dataUrl;
        });
    });

    await Promise.all(loadPromises);

    // Carrega o frame ativo no canvas visível
    const targetFrame = data.currentFrame || 'frame1';
    if (typeof switchFrame === 'function') {
        switchFrame(targetFrame);
    } else {
        // Fallback: desenha direto
        const ctx = canvasEl.getContext('2d');
        if (typeof frames !== 'undefined' && frames[targetFrame]) {
            ctx.drawImage(frames[targetFrame], 0, 0);
        }
    }
}

// ── Salvar novo desenho ───────────────────────────────

async function saveDrawing() {
    console.log('🔵 saveDrawing() chamado');
    
    const token = localStorage.getItem('token');
    console.log('Token:', token ? '✓ Encontrado' : '✗ Não encontrado');
    if (!token) { alert('Você precisa estar logado para salvar.'); return; }

    const title = prompt('Nome do desenho:', 'Meu desenho') || 'Sem título';
    console.log('Título do novo desenho:', title);
    
    const canvasData = serializeDrawing();
    if (!canvasData) { alert('Canvas não encontrado.'); return; }
    console.log('Canvas serializado com sucesso');

    try {
        console.log('📤 POST para:', `${base_url}/drawings?token=${token}`);
        const response = await axios.post(`${base_url}/drawings?token=${token}`, {
            title,
            canvasData,
        });

        console.log('✅ Resposta do servidor:', response.data);
        
        if (response.data && response.data.id) {
            localStorage.setItem('currentDrawingId',    response.data.id);
            localStorage.setItem('currentDrawingTitle', response.data.title);
            console.log('💾 ID salvo no localStorage:', response.data.id);
            alert(`"${response.data.title}" salvo com sucesso!`);
        } else {
            console.error('❌ Resposta inválida - sem ID:', response.data);
            alert('Erro: O servidor não retornou um ID válido');
        }
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        console.error('Detalhes:', error.response?.data || error.message);
        alert('Falha ao salvar: ' + (error.response?.data || error.message));
    }
}

// ── Iniciar novo desenho ──────────────────────────────

function newDrawing() {
    console.log('🔵 newDrawing() chamado');
    
    if (!confirm('Descartar o desenho atual e começar um novo?')) return;
    
    // Limpa o ID do desenho atual para que o próximo "Salvar" crie novo
    localStorage.removeItem('currentDrawingId');
    localStorage.removeItem('currentDrawingTitle');
    localStorage.removeItem('pendingDrawingData');
    
    console.log('💾 IDs removidos do localStorage');
    
    // Limpa o objeto frames
    if (typeof frames !== 'undefined') {
        frames = {};
        console.log('✓ frames limpo');
    }
    
    // Reseta o frame atual
    if (typeof currentFrame !== 'undefined') {
        currentFrame = 'frame1';
        console.log('✓ currentFrame resetado');
    }
    
    // Limpa o canvas visível
    const canvas = document.getElementById('canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const bgColor = localStorage.getItem('corCanvas') || '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('✓ Canvas limpo');
    }
    
    // Atualiza o título
    document.title = 'AniMate';
    
    console.log('✅ Novo desenho iniciado - pronto para desenhar!');
}

// ── Atualizar desenho existente ───────────────────────

async function updateDrawing() {
    console.log('🔵 updateDrawing() chamado');
    
    const token     = localStorage.getItem('token');
    const drawingId = localStorage.getItem('currentDrawingId');

    console.log('Token:', token ? '✓ Encontrado' : '✗ Não encontrado');
    console.log('DrawingId:', drawingId);

    if (!token) { alert('Você precisa estar logado.'); return; }
    
    if (!drawingId) { 
        console.log('⚠️ Nenhum ID encontrado, chamando saveDrawing() para criar novo');
        return saveDrawing(); 
    }

    const canvasData = serializeDrawing();
    console.log('Canvas serializado com sucesso');

    try {
        console.log('📤 PUT para:', `${base_url}/drawings/${drawingId}?token=${token}`);
        const response = await axios.put(`${base_url}/drawings/${drawingId}?token=${token}`, { canvasData });
        
        console.log('✅ Desenho atualizado:', response.data);
        alert('Desenho atualizado!');
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
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
                    <button class="btn-delete-drawing" data-id="${drawing.id}">🗑</button>
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
    console.log('🔵 openDrawing() chamado com ID:', drawingId);
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        console.log('📥 GET para:', `${base_url}/drawings/${drawingId}?token=${token}`);
        const response = await axios.get(`${base_url}/drawings/${drawingId}?token=${token}`);
        const drawing  = response.data;

        console.log('✅ Desenho carregado:', drawing);

        localStorage.setItem('currentDrawingId',    drawing.id);
        localStorage.setItem('currentDrawingTitle', drawing.title);
        localStorage.setItem('pendingDrawingData',  drawing.canvasData);

        console.log('💾 Dados salvos no localStorage:');
        console.log('   ID:', drawing.id);
        console.log('   Título:', drawing.title);
        
        window.location.href = 'canvasAdm.html';
    } catch (error) {
        console.error('❌ Erro ao abrir:', error);
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
    console.log('🔵 scriptDrawings.js - load event iniciado');

    // --- Página do perfil: carrega lista ---
    if (document.querySelector('.lista')) {
        console.log('📋 Página do perfil detectada - carregando lista de desenhos');
        await loadDrawingsList();
    }

    // --- Canvas: restaura desenho pendente ---
    const pendingData = localStorage.getItem('pendingDrawingData');
    console.log('Dados pendentes encontrados:', pendingData ? '✓ Sim' : '✗ Não');
    
    if (pendingData && document.getElementById('canvas')) {
        try {
            console.log('📥 Restaurando desenho pendente...');
            window.__drawingRestored = true;
            await deserializeDrawing(pendingData);
            localStorage.removeItem('pendingDrawingData');

            const title = localStorage.getItem('currentDrawingTitle') || '';
            if (title) document.title = `AniMate — ${title}`;

            const currentId = localStorage.getItem('currentDrawingId');
            console.log('✅ Desenho restaurado com sucesso - ID:', currentId);
        } catch (err) {
            console.error('❌ Erro ao restaurar desenho:', err);
        }
    } else {
        console.log('ℹ️ Nenhum desenho pendente ou canvas não encontrado');
    }

    // --- Botão salvar no canvas ---
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        console.log('✓ Botão salvar encontrado');
        btnSave.addEventListener('click', () => {
            const hasId = localStorage.getItem('currentDrawingId');
            console.log('💾 Clique em salvar - ID existente:', hasId ? 'Sim (UPDATE)' : 'Não (CREATE)');
            
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
        console.log('⚠️ Botão salvar NÃO encontrado');
    }

    // --- Botão salvar novo desenho ---
    const btnSaveNew = document.getElementById('btnSaveNew');
    if (btnSaveNew) {
        console.log('✓ Botão salvar novo encontrado');
        btnSaveNew.addEventListener('click', () => {
            console.log('💾 Clique em salvar novo - removendo ID atual');
            localStorage.removeItem('currentDrawingId');
            localStorage.removeItem('currentDrawingTitle');
            saveDrawing();
        });
    } else {
        console.log('⚠️ Botão salvar novo NÃO encontrado');
    }

    // --- Botão novo desenho ---
    const btnNew = document.getElementById('btnNew');
    if (btnNew) {
        console.log('✓ Botão novo desenho encontrado');
        btnNew.addEventListener('click', newDrawing);
    } else {
        console.log('⚠️ Botão novo desenho NÃO encontrado');
    }

    // --- Atalho de teclado: Ctrl+N para novo desenho ---
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            console.log('⌨️ Atalho Ctrl+N acionado');
            newDrawing();
        }
    });
    console.log('⌨️ Atalho Ctrl+N registrado');

});
