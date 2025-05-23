//Vai ser acionado após a página carregar
window.addEventListener('load', () => {
    const socket = io("http://localhost:3000");

    //Disponibiliza o socket globalmente para os outros scripts
    window.socket = socket;

    socket.on('connect', () => {
            console.log('Conectado ao servidor. ID:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Desconectado do servidor');
        });

        socket.on('connect_error', (err) => {
            console.error('Erro de conexão:', err.message);
        });

});