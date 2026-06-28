import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { Socket } from 'socket.io-client';

export class YjsSocketProvider {
  public awareness: Awareness;
  public document: Y.Doc;
  public doc: Y.Doc;
  private socket: Socket;
  private documentId: string;
  private _synced: boolean = false;
  private _syncCallbacks: Array<(isFirstUser: boolean) => void> = [];

  constructor(socket: Socket, documentId: string, ydoc: Y.Doc) {
    this.socket = socket;
    this.documentId = documentId;
    this.document = ydoc;
    this.doc = ydoc;
    this.awareness = new Awareness(ydoc);

    this.onUpdate = this.onUpdate.bind(this);
    this.onAwarenessUpdate = this.onAwarenessUpdate.bind(this);
    this.onReceiveChanges = this.onReceiveChanges.bind(this);
    this.onReceiveCursor = this.onReceiveCursor.bind(this);
    this.onUserJoined = this.onUserJoined.bind(this);
    this.onSyncState = this.onSyncState.bind(this);

    // Bind Yjs doc updates -> Socket (only LOCAL changes, after initial sync)
    this.document.on('update', this.onUpdate);
    // Bind awareness updates -> Socket
    this.awareness.on('update', this.onAwarenessUpdate);

    // Bind Socket -> Yjs (incoming REMOTE changes)
    this.socket.on('receive-changes', this.onReceiveChanges);
    this.socket.on('receive-cursor', this.onReceiveCursor);
    this.socket.on('user-joined', this.onUserJoined);
    this.socket.on('sync-state', this.onSyncState);
  }

  /**
   * Returns a promise that resolves when initial sync is complete.
   * Resolves with `true` if this is the first user (no existing state),
   * or `false` if state was received from the server.
   */
  public waitForSync(): Promise<boolean> {
    if (this._synced) {
      return Promise.resolve(this.document.getXmlFragment('default').length === 0);
    }
    return new Promise((resolve) => {
      this._syncCallbacks.push(resolve);
    });
  }

  /**
   * Handle initial sync state from server.
   * If state is null, we're the first user. If state is an array, apply it.
   */
  private onSyncState(state: number[] | null) {
    if (this._synced) return; // Already synced, ignore duplicates

    if (state && state.length > 0) {
      // Apply the server's stored Y.Doc state
      Y.applyUpdate(this.document, new Uint8Array(state), 'remote');
      this._synced = true;
      this._syncCallbacks.forEach(cb => cb(false));
    } else {
      // We're the first user — no existing state
      this._synced = true;
      this._syncCallbacks.forEach(cb => cb(true));
    }
    this._syncCallbacks = [];
  }

  /**
   * Only broadcast LOCAL changes to the server.
   * Skip remote changes (origin === 'remote') to prevent echo loops.
   */
  private onUpdate(update: Uint8Array, origin: any) {
    if (origin === 'remote') return;
    if (!this._synced) return; // Don't send until initial sync is done
    this.socket.emit('send-changes', this.documentId, Array.from(update));
  }

  /**
   * Broadcast local awareness changes (cursor position, user info).
   * Skip remote awareness updates to prevent echo loops.
   */
  private onAwarenessUpdate({ added, updated, removed }: any, origin: any) {
    if (origin === 'remote') return;
    const changedClients = added.concat(updated, removed);
    if (changedClients.length === 0) return;
    const update = encodeAwarenessUpdate(this.awareness, changedClients);
    this.socket.emit('cursor-update', this.documentId, Array.from(update));
  }

  private onReceiveChanges(updateArray: number[]) {
    Y.applyUpdate(this.document, new Uint8Array(updateArray), 'remote');
  }

  private onReceiveCursor(data: any) {
    if (data.cursorData) {
      applyAwarenessUpdate(this.awareness, new Uint8Array(data.cursorData), 'remote');
    }
  }

  private onUserJoined() {
    this.broadcastAwareness();
    // When a new user joins, push our full state to the server
    // so the server always has the latest version
    this.pushFullState();
  }

  /**
   * Re-broadcast local awareness state.
   */
  public broadcastAwareness() {
    if (this.awareness.getLocalState() !== null) {
      const update = encodeAwarenessUpdate(this.awareness, [this.awareness.clientID]);
      this.socket.emit('cursor-update', this.documentId, Array.from(update));
    }
  }

  /**
   * Push the full Y.Doc state to the server for storage.
   */
  public pushFullState() {
    const state = Y.encodeStateAsUpdate(this.document);
    this.socket.emit('sync-full-state', this.documentId, Array.from(state));
  }

  public destroy() {
    this.document.off('update', this.onUpdate);
    this.awareness.off('update', this.onAwarenessUpdate);
    this.socket.off('receive-changes', this.onReceiveChanges);
    this.socket.off('receive-cursor', this.onReceiveCursor);
    this.socket.off('user-joined', this.onUserJoined);
    this.socket.off('sync-state', this.onSyncState);
    this.awareness.destroy();
  }

  // Required by CollaborationCursor extension (provider interface)
  public on(_event: string, _cb: any) {}
  public off(_event: string, _cb: any) {}
}
