const cache = new Map<string, ArrayBuffer>()

export function setWorkbook(sessionId: string, data: ArrayBuffer): void {
  cache.set(sessionId, data)
}

export function getWorkbook(sessionId: string): ArrayBuffer | undefined {
  return cache.get(sessionId)
}

export function removeWorkbook(sessionId: string): void {
  cache.delete(sessionId)
}
