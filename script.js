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

