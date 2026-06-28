import { Server } from 'socket.io';
import { logger } from '../config/logger';
import { AuthenticatedSocket, socketAuthMiddleware } from './auth';

export const initializeSocket = (io: Server) => {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Server-side Yjs document state storage
  // Stores the latest full Y.Doc state per document so new joiners get synced
  const documentStates = new Map<string, number[]>();

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected to socket: ${socket.user?.id} (Socket ID: ${socket.id})`);

    socket.on('join-document', async (documentId: string) => {
      socket.join(documentId);
      logger.info(`User ${socket.user?.id} joined document: ${documentId}`);

      // Check how many clients are already in this room
      const room = io.sockets.adapter.rooms.get(documentId);
      const clientCount = room ? room.size : 0;

      // Send the stored Yjs state to the new joiner if available
      const storedState = documentStates.get(documentId);
      if (storedState) {
        logger.info(`Sending stored Y.Doc state to ${socket.user?.id} for document ${documentId} (${storedState.length} bytes)`);
        socket.emit('sync-state', storedState);
      } else {
        // No stored state — tell the client they're the first editor
        socket.emit('sync-state', null);
      }

      // Broadcast to others in the room that a user joined
      socket.to(documentId).emit('user-joined', { userId: socket.user?.id });
    });

    socket.on('leave-document', (documentId: string) => {
      socket.leave(documentId);
      logger.info(`User ${socket.user?.id} left document: ${documentId}`);
      socket.to(documentId).emit('user-left', { userId: socket.user?.id });
    });

    socket.on('send-changes', (documentId: string, changes: any) => {
      // Broadcast changes to everyone else in the document room
      socket.to(documentId).emit('receive-changes', changes);
    });

    // Client sends its full Y.Doc state for the server to store
    socket.on('sync-full-state', (documentId: string, state: number[]) => {
      documentStates.set(documentId, state);
      logger.info(`Stored full Y.Doc state for document ${documentId} (${state.length} bytes)`);
    });

    socket.on('cursor-update', (documentId: string, cursorData: any) => {
      socket.to(documentId).emit('receive-cursor', {
        userId: socket.user?.id,
        cursorData
      });
    });

    socket.on('disconnecting', () => {
      // Notify all rooms the user was in that they left
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', { userId: socket.user?.id });
        }
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user?.id}`);
    });
  });
};
