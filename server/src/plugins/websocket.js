export default async function wsPlugin(app) {
    app.get('/ws', { websocket: true }, (connection /* { socket } */, req) => {
      const socket = connection.socket;
      if (!socket) {
        app.log.error('socket is undefined!');
        return;
      }
  
      app.log.info('🔗 Client connected');
  
      socket.on('message', (message) => {
        app.log.info(`📥 Received: ${message.toString()}`);
        socket.send(`Echo: ${message}`);
      });
  
      socket.on('close', () => {
        app.log.info('❌ Client disconnected');
      });
    });
  }
  