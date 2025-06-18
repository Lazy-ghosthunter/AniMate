//Vai ser acionado após a página carregar
const socket = io("http://localhost:3000");

//Disponibiliza o socket globalmente para os outros scripts
window.socket = socket;

