type Listener = () => void;

const listeners = new Set<Listener>();

export function emitTrophyCheck() {
  for (const cb of listeners) cb();
}

// ✅ returns void cleanup
export function onTrophyCheck(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
