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

type ProxiedTarget<T> = T & ProxiedObject;

export function isBgbed(obj: any): obj is ProxiedObject {
  return obj && obj.__bgbe_proxy__;
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
// - check types in realtime on set
export function bgbe<
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
    get(target, prop, receiver) {
      return target[prop];
    },
    set(target, prop, value): boolean {
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
