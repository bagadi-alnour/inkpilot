export interface StreamController {
  abort(): void;
  isAborted(): boolean;
}

export function createStreamController(): StreamController {
  const controller = new AbortController();

  return {
    abort() {
      controller.abort();
    },
    isAborted() {
      return controller.signal.aborted;
    },
  };
}

export async function* accumulateStream(
  stream: AsyncIterable<string>,
  controller?: StreamController,
): AsyncIterable<string> {
  let accumulated = '';

  for await (const chunk of stream) {
    if (controller?.isAborted()) break;
    accumulated += chunk;
    yield accumulated;
  }
}
