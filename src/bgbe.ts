type ObjectKey = string | number | symbol;
type Immutable = ObjectKey | boolean | null | undefined;

// Acceptable inputs
type ProxyableComposite =
  | (Immutable | ProxyableComposite)[]
  | { [key: ObjectKey]: Immutable | ProxyableComposite };

// Resulting outputs
type ProxiedComposite = ProxyableComposite & { __bgbe_proxy__: true };

export function isObjectKey(key: any): key is ObjectKey {
  return typeof key === "string" || typeof key === "number";
}

export function isImmutable(obj: any): obj is Immutable {
  return (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean" ||
    typeof obj === "symbol" ||
    obj === null ||
    obj === undefined
  );
}

export function isProxyableComposite(obj: any): obj is ProxyableComposite {
  if (isImmutable(obj)) {
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.every(isProxyableComposite);
  }
  if (typeof obj === "object" && obj !== null) {
    return (
      obj &&
      Object.getPrototypeOf(obj) === Object.prototype &&
      Object.keys(obj).every(isObjectKey) &&
      Object.values(obj).every(isProxyableComposite)
    );
  }
  return false;
}

export function isProxiedComposite(obj: any): obj is ProxiedComposite {
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

function wrap(objKey: string, prop: ObjectKey, value: any) {
  if (isProxiedComposite(value) || isImmutable(value)) {
    return value;
  }
  return bgbe(`${objKey}.${String(prop)}`, value);
}

function createHandler(objKey: string) {
  return {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value): boolean {
      if (!isProxyableComposite(value)) {
        throw new Error(`Invalid value type for property ${String(prop)}`);
      }

      const wrappedValue = wrap(objKey, prop, value);
      target[prop as keyof typeof target] = wrappedValue;

      if (!Array.isArray(target) || !isNaN(Number(prop))) {
        bgbeEventLog.push({ objKey, prop, value: wrappedValue });
      }

      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      bgbeEventLog.push({ objKey, prop, value: undefined });
      return true;
    },
  };
}

// TODO:
// - understand setting and identified proxy as the value of another proxy, and
//   record the link in the internal datastructure, not the values themselves
export default function bgbe<T extends ProxyableComposite = ProxyableComposite>(
  keyOrObj: string | T,
  obj?: T
): T & ProxiedComposite {
  let objKey: string = "global";
  if (typeof keyOrObj === "string") {
    objKey = keyOrObj;
    if (!obj) {
      throw new Error("Object must be provided when key is specified");
    }
  } else {
    obj = keyOrObj;
  }

  if (Array.isArray(obj)) {
    const proxiedArray = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      proxiedArray[i] = wrap(objKey, i, obj[i]);
    }
    Object.defineProperty(proxiedArray, "__bgbe_proxy__", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    return new Proxy(proxiedArray, createHandler(objKey)) as T &
      ProxiedComposite;
  } else {
    const proxiedObject: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        proxiedObject[key] = wrap(objKey, key, obj[key]);
      }
    }
    proxiedObject.__bgbe_proxy__ = true;
    return new Proxy(proxiedObject, createHandler(objKey)) as T &
      ProxiedComposite;
  }
}
