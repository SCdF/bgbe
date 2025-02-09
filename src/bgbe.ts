type ObjectKey = string | number;
type Immutable = string | number | boolean | null | undefined;

// Acceptable inputs
type ProxyableArray = Array<Immutable | ProxyableArray>;
type ProxyableObject = {
  [key: ObjectKey]: Immutable | ProxyableObject | ProxyableArray;
};

// Resulting outputs
type ProxiedArray = Array<Immutable | ProxiedArray> & {
  __bgbe_proxy__: true;
};
type ProxiedObject = {
  [key: ObjectKey]: Immutable | ProxiedObject | ProxiedArray;
  __bgbe_proxy__: true;
};
type ProxiedTarget<T> = T & (ProxiedObject | ProxiedArray);

export function isObjectKey(key: any): key is ObjectKey {
  return typeof key === "string" || typeof key === "number";
}

export function isImmutable(obj: any): obj is Immutable {
  return (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean" ||
    obj === null ||
    obj === undefined
  );
}

export function isProxyableArray(obj: any): obj is ProxyableArray {
  return obj && Array.isArray(obj) && obj.every(isValidValue);
}

export function isProxyableObject(obj: any): obj is ProxyableObject {
  return (
    obj &&
    Object.getPrototypeOf(obj) === Object.prototype &&
    Object.keys(obj).every(isObjectKey) &&
    Object.values(obj).every(isValidValue)
  );
}

export function isValidValue(value: any): boolean {
  return (
    isImmutable(value) || isProxyableArray(value) || isProxyableObject(value)
  );
}

export function isBgbed(obj: any): obj is ProxiedObject {
  return obj?.__bgbe_proxy__;
}

export let bgbeEventLog: Array<{
  objKey: string;
  prop: ObjectKey;
  value: any;
}> = [];

export function resetBgbeEventLog() {
  bgbeEventLog = [];
}

// TODO:
// - understand setting and identified proxy as the value of another proxy, and
//   record the link in the internal datastructure, not the values themselves
export default function bgbe<
  T extends ProxyableObject | ProxyableArray = ProxyableObject
>(keyOrObj: string | T, obj?: T): ProxiedTarget<T> {
  let objKey: string = "global";
  if (typeof keyOrObj === "string") {
    objKey = keyOrObj;
    if (!obj) {
      throw new Error("Object must be provided when key is specified");
    }
  } else {
    obj = keyOrObj;
  }

  const wrap = (key: string, value: any) => {
    if (isBgbed(value) || isImmutable(value)) {
      return value;
    }
    return bgbe(key, value);
  };

  const handler = {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value): boolean {
      if (!isValidValue(value)) {
        throw new Error(`Invalid value type for property ${String(prop)}`);
      }

      const wrappedValue = wrap(`${objKey}.${prop}`, value);
      target[prop as keyof ProxiedTarget<T>] = wrappedValue;

      if (!Array.isArray(target) || !isNaN(Number(prop))) {
        bgbeEventLog.push({ objKey, prop, value: wrappedValue });
      }

      return true;
    },
    // TODO: think about this: do we want to set to undefined, or a specific deletion?
    deleteProperty(target, prop) {
      delete target[prop];
      bgbeEventLog.push({ objKey, prop, value: undefined });
      return true;
    },
  };

  if (Array.isArray(obj)) {
    const proxiedArray = obj.map((value, index) =>
      wrap(`${objKey}.${index}`, value)
    ) as ProxiedArray;
    Object.defineProperty(proxiedArray, "__bgbe_proxy__", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return new Proxy(proxiedArray, handler);
  } else {
    const proxiedObject = Object.entries(obj).reduce((acc, [key, value]) => {
      acc[key] = wrap(`${objKey}.${key}`, value);
      return acc;
    }, {} as ProxiedObject);
    proxiedObject.__bgbe_proxy__ = true;
    return new Proxy(proxiedObject, handler);
  }
}
