type ObjectKey = string | number;
type Immutable = string | number | boolean;

// Acceptable inputs
type ProxyableArray = Array<Immutable | ProxyableArray>;
type ProxyableObject = {
  [key: ObjectKey]: Immutable | ProxyableObject | ProxyableArray;
};

// Resulting outputs
type ProxiedArray = Array<Immutable | ProxiedArray> & {
  __bgbe_proxy__: true;
} & {
  log: Array<{ prop: ObjectKey; value: any }>;
};

type ProxiedObject = {
  [key: ObjectKey]: Immutable | ProxiedObject | ProxiedArray;
  __bgbe_proxy__: true;
} & {
  log: Array<{ prop: ObjectKey; value: any }>;
};

export function isBgbed(obj: any): obj is ProxiedObject {
  return obj && obj.__bgbe_proxy__;
}

type ProxiedTarget<T> = T & ProxiedObject;

// TODO:
// - support bgbe(id, obj), in case you want multiple per domain/url
// - understand setting and identified proxy as the value of another proxy, and
//   record the link in the internal datastructure, not the values themselves
// - check types in realtime on set
export function bgbe<
  T extends ProxyableObject | ProxyableArray = ProxyableObject
>(obj: T): ProxiedTarget<T> {
  const log: Array<{ prop: ObjectKey; value: any }> = [];
  const handler = {
    get(target, prop, receiver) {
      return target[prop];
    },
    set(target, prop, value): boolean {
      (target as ProxiedTarget<T>)[prop as keyof ProxiedTarget<T>] = value;

      if (!Array.isArray(target) || !isNaN(Number(prop))) {
        target.log.push({ prop, value });
      }

      return true;
    },
  };

  const wrap = (value: any) => {
    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      return bgbe(value);
    }
    return value;
  };

  if (Array.isArray(obj)) {
    const proxiedArray = obj.map(wrap) as ProxiedArray;
    Object.defineProperty(proxiedArray, "__bgbe_proxy__", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    Object.defineProperty(proxiedArray, "log", {
      value: log,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return new Proxy(proxiedArray, handler);
  } else {
    const proxiedObject = Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, wrap(value)])
    ) as ProxiedObject;
    return new Proxy({ ...proxiedObject, __bgbe_proxy__: true, log }, handler);
  }
}
