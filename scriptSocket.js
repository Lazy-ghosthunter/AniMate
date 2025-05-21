//Vai ser acionado após a página carregar
window.addEventListener('load', () => {
    const socket = io.connect("http://localhost:3000");

    //Disponibiliza o socket globalmente para os outros scripts
    window.socket = socket;

    //Seleciona o canvas e o tipo de desenho
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    //Recebe os dados do desenho
    socket.on('draw', (data) => {
        ctx.beginPath();
        ctx.moveTo(data.lastX, data.lastY);
        ctx.lineTo(data.currentX, data.currentY);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.stroke();
        ctx.closePath();
    });

    canvas.addEventListener('mousemove', (e) => {
        socket.emit('draw', {lastX, lastY, currentX, currentY, color, lineWidth});
    });

});