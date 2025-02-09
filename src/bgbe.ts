type ObjectKey = string | number | symbol;
type Immutable = ObjectKey | boolean | null | undefined;

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
    typeof obj === "symbol" ||
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

function wrap(objKey: string, prop: ObjectKey, value: any) {
  if (isBgbed(value) || isImmutable(value)) {
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
      if (!isValidValue(value)) {
        throw new Error(`Invalid value type for property ${String(prop)}`);
      }

      const wrappedValue = wrap(objKey, prop, value);
      target[prop as keyof ProxiedTarget<any>] = wrappedValue;

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
    return new Proxy(proxiedArray, createHandler(objKey));
  } else {
    const proxiedObject: ProxiedObject = {} as ProxiedObject;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        proxiedObject[key] = wrap(objKey, key, obj[key]);
      }
    }
    proxiedObject.__bgbe_proxy__ = true;
    return new Proxy(proxiedObject, createHandler(objKey));
  }
}
