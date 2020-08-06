// TODO: do something different for dev vs prod
const PREFIX = '__PAPERCUPS__';

export default function store(storage: any) {
  const get = (key: string) => {
    const result = storage.getItem(`${PREFIX}${key}`);

    if (!result) {
      return null;
    }

    try {
      return JSON.parse(result);
    } catch (e) {
      return result;
    }
  };

  const set = (key: string, value: any) => {
    storage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  };

  const remove = (key: string) => {
    storage.removeItem(key);
  };

  // TODO: improve these names

  return {
    getCustomerId: () => get('__CUSTOMER_ID__'),
    setCustomerId: (id: string) => set('__CUSTOMER_ID__', id),
    removeCustomerId: () => remove('__CUSTOMER_ID__'),
  };
}
