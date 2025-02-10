import * as Y from "yjs";

type ObjectKey = string | number | symbol;
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

function wrap(objKey: string, prop: ObjectKey, value: any) {
  if (isImmutable(value)) {
    return value;
  }

  const symlink = {
    docKey: `${objKey}.${String(prop)}`,
    symlink: true,
  } as Symlink;

  if (!isProxiedComposite(value)) {
    bgbe(`${objKey}.${String(prop)}`, value);
  }

  return symlink;
}

type Symlink = {
  docKey: string;
  symlink: true;
};
function createHandler(objKey: string, inner: Y.Array<any> | Y.Map<any>) {
  return {
    get(target, prop) {
      if (prop === "__bgbe_proxy__") {
        return objKey;
      }

      let innerProp;

      if (inner instanceof Y.Array) {
        innerProp = inner.get(prop);
      } else {
        innerProp = inner.get(prop);
      }

      if (innerProp?.symlink) {
        return bgbeMap.get(innerProp.docKey);
      }

      return innerProp;
    },
    set(target, prop, value): boolean {
      if (!isProxyableComposite(value)) {
        throw new Error(`Invalid value type for property ${String(prop)}`);
      }

      const wrappedValue = wrap(objKey, prop, value);

      if (inner instanceof Y.Array) {
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

  let toReturn: T & ProxiedComposite;

  if (Array.isArray(obj)) {
    const proxiedArray = ydoc.getArray<T>(objKey);

    toReturn = new Proxy(
      proxiedArray,
      createHandler(objKey, proxiedArray)
    ) as T & ProxiedComposite;

    for (let i = 0; i < obj.length; i++) {
      toReturn[i] = wrap(objKey, i, obj[i]);
    }
  } else {
    const proxiedObject = ydoc.getMap<T>(objKey);

    toReturn = new Proxy(
      proxiedObject,
      createHandler(objKey, proxiedObject)
    ) as T & ProxiedComposite;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        toReturn[key] = wrap(objKey, key, obj[key]);
      }
    }
  }

  bgbeMap.set(objKey, toReturn);
  return toReturn;
}
