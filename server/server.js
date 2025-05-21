//importação das bibliotecas
var app = require('express') ();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//Usuário conectado
io.on('connection', (socket) => {
    console.log('User conectado!');

    //Para a conexão com a canvas
    socket.on('canvas-data', (data) => {
        socket.broadcast.emit('canvas-data', data);
    });

    //Usuário desconectado
    socket.on('disconnect', () => {
        console.log('User desconectado!')
    });
});

//HTTP SERVER
var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
http.listen(server_port, () => {
    console.log("Started on: " + server_port);
    //Para a confirmação de que está rodando
})