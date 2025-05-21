//importação das bibliotecas
const app = require('express') ();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//Usuário conectado
io.on('connection', (socket) => {
    console.log('User conectado!');

    //Para a conexão com a canvas
    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });

    //Usuário desconectado
    socket.on('disconnect', () => {
        console.log('User desconectado!')
    });
});

//HTTP SERVER
const server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
http.listen(server_port, () => {
    console.log("Servidor rodando a porta: " + server_port);
    //Para a confirmação de que está rodando
})