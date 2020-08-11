export const DEFAULT_BASE_URL = 'https://app.papercups.io';

export const getWebsocketUrl = (baseUrl) => {
  // TODO: handle this parsing better
  const url = baseUrl || DEFAULT_BASE_URL;
  const [protocol, host] = url.split('://');
  const isHttps = protocol === 'https';

  // TODO: not sure how websockets work with subdomains
  return `${isHttps ? 'wss' : 'ws'}://${host}/socket`;
};
