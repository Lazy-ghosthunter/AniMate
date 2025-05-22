//Vai ser acionado após a página carregar
window.addEventListener('load', () => {
    const socket = io("http://localhost:3000");

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
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
        
    // Guarda os últimos pontos do desenho
    if (typeof window.lastX !== "undefined") {
        socket.emit('draw', {
            lastX: window.lastX,
            lastY: window.lastY,
            currentX,
            currentY,
            color: colorPicker.value,     
            lineWidth: 2         
            });
        }

        window.lastX = currentX;
        window.lastY = currentY;
    });
});