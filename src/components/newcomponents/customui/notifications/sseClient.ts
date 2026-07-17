export interface SseMessage {
  event: string;
  data: string;
}

export class SseOpenError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`SSE open failed: ${status}`);
    this.name = 'SseOpenError';
    this.status = status;
  }
}

/**
 * Read an SSE stream via fetch (supports Authorization headers unlike EventSource).
 */
export async function readEventStream(
  url: string,
  options: {
    headers: Record<string, string>;
    signal: AbortSignal;
    onMessage: (message: SseMessage) => void;
    onOpen?: () => void;
  }
): Promise<void> {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/event-stream',
      ...options.headers,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new SseOpenError(response.status);
  }

  options.onOpen?.();

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('SSE response has no body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const dispatchEvent = (raw: string) => {
    if (!raw.trim() || raw.startsWith(':')) return;

    let event = 'message';
    const dataLines: string[] = [];

    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      options.onMessage({ event, data: dataLines.join('\n') });
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      dispatchEvent(chunk);
      boundary = buffer.indexOf('\n\n');
    }
  }
}
