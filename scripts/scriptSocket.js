//Vai ser acionado após a página carregar
let socket = null;
try {
	if (window.enableSockets === false) {
		console.log('scriptSocket: sockets desabilitados (window.enableSockets=false)');
	} else {
		socket = io("http://localhost:3000");
	}
} catch (e) {
	console.warn('scriptSocket: falha ao inicializar socket (servidor pode não estar rodando):', e);
}

//Disponibiliza o socket globalmente para os outros scripts
window.socket = socket;

