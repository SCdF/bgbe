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
  return new Proxy({ ...obj, __bgbe_proxy__: true } as ProxiedTarget<T>, {
    get(target, prop, receiver) {
      if (typeof prop === "symbol") {
        throw Error("no symbols!");
      }
      console.log(`GET target.${prop}`);
      return target[prop];
    },
    set(target, prop, value): boolean {
      if (typeof prop === "symbol") {
        throw Error("no symbols!");
      }
      console.log(`SET target.${String(prop)}`);
      if (prop in target) {
        (target as ProxiedTarget<T>)[prop as keyof ProxiedTarget<T>] = value;
        return true;
      }
      return false;
    },
  });
}

// ****Basic recursiveness****
const data = bgbe({});
data.foo = "bar";
data.foo = "baz";
console.log(data.foo);

// this fails at the type stage
data.foo = {};
data.foo.bar = "smang";

// this succeeds
data.foo = bgbe({});
data.foo.bar = "smang";

// *****Only certain types****
const bar = bgbe({
  sing: "foo",
  num: Date.now(),
  date: new Date(), // TODO: this should fail
});

// ****ARRAYS****
// raw arrays don't work (yet?)
const arrays = bgbe([0, 1, 2, 3]);
// but this does
type MyArrayData = { data: number[] };
const arrays2 = bgbe<MyArrayData>({ data: [0, 1, 2, 3] });
arrays2.data.push(4);
