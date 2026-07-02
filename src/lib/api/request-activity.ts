type RequestActivityListener = () => void;

let activeRequestCount = 0;
const listeners = new Set<RequestActivityListener>();

function emitRequestActivityChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function beginApiRequest() {
  activeRequestCount += 1;
  emitRequestActivityChange();

  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    emitRequestActivityChange();
  };
}

export function getActiveApiRequestCount() {
  return activeRequestCount;
}

export function subscribeApiRequestActivity(listener: RequestActivityListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
