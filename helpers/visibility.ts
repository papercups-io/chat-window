export const getBrowserVisibilityInfo = (
  document: Document | any
): {hidden: string; event: string; state: string} => {
  if (typeof document.hidden !== 'undefined') {
    return {
      hidden: 'hidden',
      event: 'visibilitychange',
      state: 'visibilityState',
    };
  } else if (typeof document.mozHidden !== 'undefined') {
    return {
      hidden: 'mozHidden',
      event: 'mozvisibilitychange',
      state: 'mozVisibilityState',
    };
  } else if (typeof document.msHidden !== 'undefined') {
    return {
      hidden: 'msHidden',
      event: 'msvisibilitychange',
      state: 'msVisibilityState',
    };
  } else if (typeof document.webkitHidden !== 'undefined') {
    return {
      hidden: 'webkitHidden',
      event: 'webkitvisibilitychange',
      state: 'webkitVisibilityState',
    };
  } else {
    return {
      hidden: null,
      event: null,
      state: null,
    };
  }
};

export const isWindowHidden = (document: Document | EventTarget): boolean => {
  const {hidden} = getBrowserVisibilityInfo(document);

  return !!document[hidden];
};

export const addVisibilityEventListener = (
  document: Document,
  handler: EventListener
): (() => void) => {
  const {event} = getBrowserVisibilityInfo(document);

  document.addEventListener(event, handler, false);

  return () => document.removeEventListener(event, handler);
};
