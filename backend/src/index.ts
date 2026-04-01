import app from './app';
import { config } from './config/env.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';

// Función para iniciar el servidor
const startServer = async (): Promise<void> => {
  try {
    // Conectar a la base de datos primero
    await connectDatabase();

    const server = app.listen(config.server.port, () => {
      console.log(`
🚀 CrediCheck API iniciado exitosamente!
📍 Entorno: ${config.server.nodeEnv}
🌐 Puerto: ${config.server.port}
📋 Versión API: ${config.server.apiVersion}
🔗 Health Check: http://localhost:${config.server.port}/health
📚 API Info: http://localhost:${config.server.port}/api/${config.server.apiVersion}/info
⏰ Iniciado: ${new Date().toISOString()}
      `);
    });

    // Manejo graceful de cierre del servidor
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n🛑 Señal ${signal} recibida. Cerrando servidor...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error al cerrar servidor:', err);
          process.exit(1);
        }
        
        // Desconectar de la base de datos
        try {
          await disconnectDatabase();
        } catch (dbError) {
          console.error('❌ Error al desconectar base de datos:', dbError);
        }
        
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Excepción no capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      console.error('En promesa:', promise);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor solo si no estamos en modo test
if (config.server.nodeEnv !== 'test') {
  startServer();
}

export default app;