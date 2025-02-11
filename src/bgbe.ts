import * as Y from "yjs";

type ObjectKey = string | number;
type Immutable = ObjectKey | boolean | null | undefined;

// Acceptable inputs
type ProxyableComposite =
  | (Immutable | ProxyableComposite)[]
  | { [key: ObjectKey]: Immutable | ProxyableComposite };

// Resulting outputs
type ProxiedComposite = ProxyableComposite & { __bgbe_proxy__: string };

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
  return !!obj?.__bgbe_proxy__;
}

export let bgbeEventLog: Array<{
  objKey: string;
  prop: ObjectKey;
  value: any;
}> = [];
let ydoc = new Y.Doc();
let bgbeMap = new Map<string, ProxiedComposite>();
export function resetState() {
  bgbeEventLog = [];
  ydoc = new Y.Doc();
  bgbeMap = new Map<string, ProxiedComposite>();
}

function wrap(
  baseKey: string,
  prop: ObjectKey,
  value: Immutable | ProxyableComposite
): Immutable | Symlink {
  if (isImmutable(value)) {
    return value;
  }

  let docKey: string;
  if (isProxiedComposite(value)) {
    docKey = value.__bgbe_proxy__;
  } else {
    docKey = `${baseKey}.${String(prop)}`;
    bgbe(docKey, value);
  }

  const symlink = {
    docKey,
    symlink: true,
  } as Symlink;

  return symlink;
}

type Symlink = {
  docKey: string;
  symlink: true;
};
function createHandler(objKey: string, inner: Y.Array<any> | Y.Map<any>) {
  return {
    get(target, prop) {
      console.log("get", { target, prop });

      // Yes, we are proxied
      if (prop === "__bgbe_proxy__") {
        return objKey;
      }

      // Trying to access prototype stuff, eg Iterator
      if (typeof prop === "symbol") {
        return target[prop];
      }

      // Trying to access functions
      if (typeof target[prop] === "function") {
        return target[prop];
      }

      // Get data from Yjs
      let innerVal;
      if (inner instanceof Y.Array) {
        if (prop === "length") {
          return inner.length;
        }
        if (!isNaN(Number(prop))) {
          innerVal = inner.get(Number(prop));
        }
      } else {
        innerVal = inner.get(prop);
      }
      if (innerVal?.symlink) {
        return bgbeMap.get(innerVal.docKey);
      }

      return innerVal;
    },
    set(target, prop, value): boolean {
      console.log("set", { target, prop, value });

      if (!isProxyableComposite(value)) {
        throw new Error(`Invalid value type for property ${String(prop)}`);
      }

      const wrappedValue = wrap(objKey, prop, value);

      if (inner instanceof Y.Array) {
        if (!isNaN(Number(prop))) {
          // FIXME: this is not to JS spec
          // To change a value you need to delete then insert
          // But you can't delete or insert outside of the array bounds
          //   const array = [];
          //   array[2] = 1;
          // Will not work as expected:
          //   [undefined, undefined, 1] // what JS does
          //   [1] // what we do
          if (inner.length > Number(prop)) {
            inner.delete(Number(prop));
            inner.insert(Number(prop), [wrappedValue]);
          } else {
            inner.push([wrappedValue]);
          }
        }
      } else {
        inner.set(prop, wrappedValue);
      }

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

  if (bgbeMap.has(objKey)) {
    throw Error(`Duplicate bgbe instantiation: ${objKey}`);
  }
  // set a stub to lock the key. We'll replace it at the end of this function
  // This is to stop:
  // const foo = bgbe({})
  // foo.bar = bgbe({})\
  // TODO: in the future we automatically get those keys right?
  // we'd have to reorder how we do things
  bgbeMap.set(objKey, {} as ProxiedComposite);

  let toReturn: T & ProxiedComposite;

  if (Array.isArray(obj)) {
    const yarray = ydoc.getArray(objKey);
    yarray.push(obj.map((value, idx) => wrap(objKey, idx, value)));

    toReturn = new Proxy([], createHandler(objKey, yarray)) as T &
      ProxiedComposite;
  } else {
    const ymap = ydoc.getMap(objKey);

    toReturn = new Proxy({}, createHandler(objKey, ymap)) as T &
      ProxiedComposite;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        ymap.set(key, wrap(objKey, key, obj[key]));
      }
    }
  }

  bgbeMap.set(objKey, toReturn);
  return toReturn;
}
