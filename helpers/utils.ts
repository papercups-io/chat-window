// TODO: handle this on the server instead
export function now() {
  const date = new Date();

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Returns the words (or whatever substrings based on the `separator`)
// in a string up until the point of meeting the`max` character limit
export function shorten(str: string, max: number, separator = ' ') {
  if (str.length <= max) {
    return str;
  }

  return str.substr(0, str.lastIndexOf(separator, max)).concat('...');
}

export function shouldActivateGameMode(message: string) {
  if (!message || !message.length) {
    return false;
  }

  return (
    [
      '/play2048',
      '/xyzzy',
      '/poweroverwhelming',
      '/howdoyouturnthison',
      'what is 2^11',
      'what is 2^11?',
      "what's 2^11",
      "what's 2^11?",
    ].indexOf(message.toLowerCase()) !== -1
  );
}

export function setupPostMessageHandlers(w: any, handler: (msg: any) => void) {
  const cb = (msg: any) => {
    handler(msg);
  };

  if (w.addEventListener) {
    w.addEventListener('message', cb);

    return () => w.removeEventListener('message', cb);
  } else {
    w.attachEvent('onmessage', cb);

    return () => w.detachEvent('message', cb);
  }
}

export function debounce(fn: any, wait: number) {
  let timeout: any;

  return function (...args: any) {
    clearTimeout(timeout);

    timeout = setTimeout(() => fn.call(this, ...args), wait);
  };
}
