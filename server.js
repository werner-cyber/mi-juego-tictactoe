// server.js - Versión SUPER SIMPLE
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos
app.use(express.static('public'));

// Almacenar las salas
let salas = {};

io.on('connection', (socket) => {
    console.log('Usuario conectado: ' + socket.id);

    // Crear sala
    socket.on('crear-sala', (nombreJugador) => {
        const idSala = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        salas[idSala] = {
            jugadores: [{
                id: socket.id,
                nombre: nombreJugador,
                simbolo: 'X'
            }],
            tablero: ['', '', '', '', '', '', '', '', ''],
            turno: 'X'
        };
        
        socket.join(idSala);
        socket.emit('sala-creada', idSala);
        console.log('Sala creada: ' + idSala);
    });

    // Unirse a sala
    socket.on('unirse-sala', (data) => {
        const { idSala, nombreJugador } = data;
        
        if (salas[idSala] && salas[idSala].jugadores.length < 2) {
            salas[idSala].jugadores.push({
                id: socket.id,
                nombre: nombreJugador,
                simbolo: 'O'
            });
            
            socket.join(idSala);
            socket.emit('unido-sala', { simbolo: 'O', sala: salas[idSala] });
            
            // Avisar a todos en la sala
            io.to(idSala).emit('jugador-unido', salas[idSala]);
        } else {
            socket.emit('error', 'Sala llena o no existe');
        }
    });

    // Hacer movimiento
    socket.on('mover', (data) => {
        const { idSala, casilla } = data;
        const sala = salas[idSala];
        
        if (sala && sala.tablero[casilla] === '') {
            // Encontrar qué jugador está moviendo
            const jugador = sala.jugadores.find(j => j.id === socket.id);
            if (jugador && jugador.simbolo === sala.turno) {
                sala.tablero[casilla] = jugador.simbolo;
                sala.turno = sala.turno === 'X' ? 'O' : 'X';
                
                // Enviar a todos en la sala
                io.to(idSala).emit('tablero-actualizado', {
                    tablero: sala.tablero,
                    turno: sala.turno
                });
            }
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log('Usuario desconectado: ' + socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
});