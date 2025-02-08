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
} & {
  log: Array<{ prop: ObjectKey; value: any }>;
};

export function isBgbed(obj: any): obj is ProxiedObject {
  return obj && obj.__bgbe_proxy__;
}

type ProxiedTarget<T> = T & ProxiedObject;

// TODO:
// - support arrays at the top level
// - support bgbe(id, obj), in case you want multiple per domain/url
// - understand setting and identified proxy as the value of another proxy, and
//   record the link in the internal datastructure, not the values themselves
// - check types in realtime on set
export function bgbe<T extends ProxyableObject = ProxyableObject>(
  obj: T
): ProxiedTarget<T> {
  // TODO inversely recurse to create proxied objects
  const log: Array<{ prop: ObjectKey; value: any }> = [];
  return new Proxy({ ...obj, __bgbe_proxy__: true, log } as ProxiedTarget<T>, {
    get(target, prop, receiver) {
      if (typeof prop === "symbol") {
        throw Error("no symbols!");
      }
      return target[prop];
    },
    set(target, prop, value): boolean {
      if (typeof prop === "symbol") {
        throw Error("no symbols!");
      }
      (target as ProxiedTarget<T>)[prop as keyof ProxiedTarget<T>] = value;
      target.log.push({ prop, value });
      return true;
    },
  });
}
