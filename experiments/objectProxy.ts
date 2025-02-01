type Key = string | number;
type Immutable = string | number | boolean;

type ProxyableObject = {
  // example type, but ie value here must be either immutable, or a ProxiedObject
  [key: Key]: Immutable | ProxyableObject;
};
type ProxiedObject = {
  [key: Key]: Immutable | ProxiedObject;
  __bgbe_proxy__: true;
};

const log: Array<[Immutable | ProxiedObject]> = [];

export function isBgbed(obj: any): obj is ProxiedObject {
  return obj && obj.__bgbe_proxy__;
}

// TODO:
// - support bgbe(id, obj), in case you want multiple per domain/url
// - understand setting and identified proxy as the value of another proxy, and
//   record the link in the internal datastructure, not the values themselves
// - check types in realtime on set
export function bgbe(obj: ProxyableObject): ProxiedObject {
  return new Proxy(obj as ProxiedObject, {
    get(target, prop, receiver) {
      if (typeof prop === "symbol") {
        throw Error("no symbols!");
      }
      console.log(`GET target.${prop}`);
      return target[prop];
    },
    set(target, prop, receiver): boolean {
      if (typeof prop === "symbol") {
        throw Error("no symbols!");
      }
      console.log(`SET target.${String(prop)}`);
      log.push([target[prop]]);
      target[prop] = receiver;
      return true;
    },
  }) as ProxiedObject;
}

const data = bgbe({});
data.foo = "bar";
data.foo = "baz";
console.log(data.foo);
console.log(log);

const bar = bgbe({
  sing: "foo",
  num: Date.now(),
  date: new Date(),
});

// this fails at the type stage
data.foo = {};
data.foo.bar = "smang";

// this succeeds
data.foo = bgbe({});
data.foo.bar = "smang";
