//* popup aviso da tela temporaria
const btnsala = document.getElementById("btnsala");
const voltar = document.getElementById("voltar");
const ok = document.getElementById('ok');
const popupAviso = document.getElementById('popupAviso');
const configTela = document.getElementById('configTela'); 

btnsala.addEventListener("click", function (){
    popupAviso.style.display = 'block';
});

voltar.addEventListener('click', function(){
    popupAviso.style.display = 'none';
    configTela.style.display = 'none';
});

//* abrir o Popup de  configurações da tela
ok.addEventListener('click', function(){
    popupAviso.style.display = 'none';
    configTela.style.display = 'flex';
});

window.addEventListener("click", function (event) {
    if (event.target === popupAviso) {
        popupAviso.style.display = "none";
    }
});

//* funcionamento canvas
//pegar os valores de tamanho
const altura = document.getElementById('altura');
const largura = document.getElementById('largura');
const fundo = document.getElementById('cor')
const salvar = document.getElementById('criar');

salvar.addEventListener('click', () =>{
    localStorage.setItem('larguracanvas', largura.value);
    localStorage.setItem('alturacanvas', altura.value);
    localStorage.setItem('corCanvas', fundo.value);
    alert('configurações salvas');

    updateCanvas(); 
});

//configurando a canvas

function updateCanvas() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Carregar as configurações salvas
    const larguraC = localStorage.getItem('larguracanvas');
    const alturaC = localStorage.getItem('alturacanvas');
    const cor = localStorage.getItem('corCanvas');

    // Garantir que a canvas tenha a largura e altura corretamente definidas
    canvas.width = parseInt(larguraC, 10);
    canvas.height = parseInt(alturaC, 10);
    
    // Alterar a cor de fundo conforme a escolha do usuário
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Configurar a canvas ao carregar a página
window.onload = () => {
    // Chama a função que atualiza a canvas com as configurações do localStorage
    updateCanvas();  
};
