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
};
type ProxiedObject = {
  [key: ObjectKey]: Immutable | ProxiedObject | ProxiedArray;
  __bgbe_proxy__: true;
};
type ProxiedTarget<T> = T & ProxiedObject;

export function isObjectKey(key: any): key is ObjectKey {
  return typeof key === "string" || typeof key === "number";
}

export function isImmutable(obj: any): obj is Immutable {
  return (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  );
}

export function isProxyableArray(obj: any): obj is ProxyableArray {
  return Array.isArray(obj) && obj.every(isValidValue);
}

export function isProxyableObject(obj: any): obj is ProxyableObject {
  return (
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
    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      return bgbe(key, value);
    }
    return value;
  };

  const handler = {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value): boolean {
      if (!isValidValue(value)) {
        throw new Error(`Invalid value type for property ${String(prop)}`);
      }

      (target as ProxiedTarget<T>)[prop as keyof ProxiedTarget<T>] = wrap(
        `${objKey}.${prop}`,
        value
      );

      if (!Array.isArray(target) || !isNaN(Number(prop))) {
        bgbeEventLog.push({ objKey, prop, value });
      }

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
    const proxiedObject = Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        wrap(`${objKey}.${key}`, value),
      ])
    ) as ProxiedObject;
    return new Proxy({ ...proxiedObject, __bgbe_proxy__: true }, handler);
  }
}
