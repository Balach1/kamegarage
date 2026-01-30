type Listener = () => void;

const listeners = new Set<Listener>();

export function onTrophyCheck(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitTrophyCheck() {
  for (const l of listeners) l();
}
