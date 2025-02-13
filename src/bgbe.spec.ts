import { beforeEach, describe, expect, it } from "vitest";
import { expectType } from "tsd";

import bgbe, {
  bgbeEventLog,
  isProxiedComposite,
  isImmutable,
  isObjectKey,
  isProxyableComposite,
  resetBgbeEventLog,
} from "./bgbe";

beforeEach(() => {
  resetBgbeEventLog();
});

// TypeScript compilation tests
describe("TypeScript Compilation Tests", () => {
  it("should allow setting valid types", () => {
    const data = bgbe<{ foo?: string }>({});
    data.foo = "bar";
    expectType<string>(data.foo);
  });

  it("should allow nested proxies", () => {
    const data = bgbe<{ foo?: any }>({});
    data.foo = bgbe<{ bar?: string }>({});
    data.foo.bar = "smang";
    expectType<string>(data.foo.bar);
  });

  it("should fail for unsupported types", () => {
    // @ts-expect-error
    const bar = bgbe({
      sing: "foo",
      num: Date.now(),
      date: new Date(), // dates aren't immutable so we don't support them
    });
  });

  it(`should fail setting unsupported values`, () => {
    const data = bgbe({});
    try {
      // @ts-expect-error
      data.foo = new Date();
    } catch (err) {}
  });

  it(`should fail setting unsupported values, recursively`, () => {
    const data = bgbe({ foo: { bar: "ok" } });
    try {
      // @ts-expect-error
      data.foo.bar = new Date();
    } catch (err) {}
  });

  it("should support arrays", () => {
    const arrays = bgbe([1, 2, 3]);
    arrays.push(4);
    arrays[0] = 5;
    expectType<number[]>(arrays);
  });

  it("should support arrays within objects", () => {
    type MyArrayData = { data: number[] };
    const arrays2 = bgbe({ data: [0, 1, 2, 3] });
    arrays2.data.push(4);
    expectType<number[]>(arrays2.data);
  });
});

// Runtime behavior tests
describe("Runtime Behavior Tests", () => {
  it("should set and get properties correctly", () => {
    const data = bgbe({}) as any;
    data.foo = "bar";
    data.foo = "baz";
    expect(data.foo).toBe("baz");
  });

  it("should handle nested proxies correctly", () => {
    const data = bgbe({}) as any;
    data.foo = bgbe({});
    data.foo.bar = "smang";
    expect(data.foo.bar).toBe("smang");
  });

  it("should identify proxied objects", () => {
    const data = bgbe({});
    expect(isProxiedComposite(data)).toBe(true);
  });

  it("should support arrays within objects", () => {
    type MyArrayData = { data: number[] };
    const arrays2 = bgbe({ data: [0, 1, 2, 3] });
    arrays2.data.push(4);
    expect(arrays2.data).toContain(4);
  });

  it("should support arrays", () => {
    const arrays = bgbe([1, 2, 3]);
    arrays.push(4);
    expect(arrays).toContain(4);

    arrays[0] = 5;
    expect(arrays[0]).toBe(5);

    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "3", value: 4 },
      { objKey: "global", prop: "0", value: 5 },
    ]);
  });

  it("should log every value that gets set", () => {
    const data = bgbe({}) as any;
    data.foo = "bar";
    data.foo = "baz";
    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "foo", value: "bar" },
      { objKey: "global", prop: "foo", value: "baz" },
    ]);
  });

  it("should log nested proxy values", () => {
    const data = bgbe({}) as any;
    data.foo = {};
    data.foo.bar = "smang";
    data.bar = [];
    data.bar[0] = "smang";
    data.bar.push("smong");
    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "foo", value: expect.any(Object) },
      { objKey: "global.foo", prop: "bar", value: "smang" },
      { objKey: "global", prop: "bar", value: expect.any(Array) },
      { objKey: "global.bar", prop: "0", value: "smang" },
      { objKey: "global.bar", prop: "1", value: "smong" },
    ]);
  });

  it("should runtime protect against setting unsupported values", () => {
    const data = bgbe({}) as any;
    expect(() => {
      data.foo = new Date();
    }).toThrowError();
  });

  it('should support setting "null" as a value', () => {
    const data = bgbe({}) as any;
    data.foo = null;
    expect(data.foo).toBe(null);
    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "foo", value: null },
    ]);
  });

  it("should support setting undefined as a value", () => {
    const data = bgbe({}) as any;
    data.foo = undefined;
    expect(data.foo).toBe(undefined);
    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "foo", value: undefined },
    ]);
  });

  it("should support deleting a property", () => {
    const data = bgbe({ foo: "bar" }) as any;
    delete data.foo;
    expect(data.foo).toBe(undefined);
    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "foo", value: undefined },
    ]);
  });

  it("should support passing a specific key", () => {
    const data = bgbe("myKey", { foo: "bar" }) as any;
    data.foo = "baz";
    data.bar = {};
    data.bar.baz = "smang";
    expect(bgbeEventLog).toEqual([
      { objKey: "myKey", prop: "foo", value: "baz" },
      { objKey: "myKey", prop: "bar", value: expect.any(Object) },
      { objKey: "myKey.bar", prop: "baz", value: "smang" },
    ]);
  });
});

describe("runtime type checking", () => {
  describe("isObjectKey", () => {
    it("should return true for strings", () => {
      expect(isObjectKey("foo")).toBe(true);
    });

    it("should return true for numbers", () => {
      expect(isObjectKey(0)).toBe(true);
    });

    it("should return false for other types", () => {
      expect(isObjectKey({})).toBe(false);
    });
  });
  describe("isImmutable", () => {
    it("should return true for strings", () => {
      expect(isImmutable("foo")).toBe(true);
    });

    it("should return true for numbers", () => {
      expect(isImmutable(0)).toBe(true);
    });

    it("should return true for booleans", () => {
      expect(isImmutable(true)).toBe(true);
    });

    it("should return false for other types", () => {
      expect(isImmutable({})).toBe(false);
      expect(isImmutable(new Date())).toBe(false);
    });
  });
  describe("isProxyableComposite: Array", () => {
    it("should return true for arrays of valid values", () => {
      expect(isProxyableComposite([0, 1, 2])).toBe(true);
    });

    it("should return true for arrays with recursively valid values", () => {
      expect(isProxyableComposite([0, 1, {}])).toBe(true);
    });
  });
  describe("isProxyableComposite: Object", () => {
    it("should return true for objects with valid keys and values", () => {
      expect(isProxyableComposite({ foo: "bar" })).toBe(true);
    });

    it("should return true for objects with recursively valid keys and values", () => {
      expect(isProxyableComposite({ foo: "bar", baz: {} })).toBe(true);
    });

    it("should return false for objects with invalid values", () => {
      expect(isProxyableComposite({ foo: new Date() })).toBe(false);
    });
  });
});

describe("bgbe wrap functionality", () => {
  it("should wrap nested arrays", () => {
    const data = bgbe({ array: [0, 1, 2] });
    expect(isProxiedComposite(data.array)).toBe(true);
  });

  it("should wrap nested objects", () => {
    const data = bgbe({ nested: { key: "value" } });
    expect(isProxiedComposite(data.nested)).toBe(true);
  });

  it("should log changes in nested arrays", () => {
    const data = bgbe({ array: [0, 1, 2] });
    data.array[0] = 3;
    expect(bgbeEventLog).toEqual([
      { objKey: "global.array", prop: "0", value: 3 },
    ]);
  });

  it("should log changes in nested objects", () => {
    const data = bgbe({ nested: { key: "value" } });
    data.nested.key = "new value";
    expect(bgbeEventLog).toEqual([
      { objKey: "global.nested", prop: "key", value: "new value" },
    ]);
  });

  it("should handle deeply nested structures", () => {
    const data = bgbe({ nested: { array: [0, 1, 2] } });
    data.nested.array[1] = 4;
    expect(bgbeEventLog).toEqual([
      { objKey: "global.nested.array", prop: "1", value: 4 },
    ]);
  });

  it("should log changes in deeply nested structures", () => {
    const data = bgbe({ nested: { array: [0, 1, 2], key: "value" } });
    data.nested.array[1] = 4;
    data.nested.key = "new value";
    expect(bgbeEventLog).toEqual([
      { objKey: "global.nested.array", prop: "1", value: 4 },
      { objKey: "global.nested", prop: "key", value: "new value" },
    ]);
  });

  it(`shouldn't override existing wrapped objects`, () => {
    const data = bgbe({}) as any;
    const otherData = bgbe("other", { foo: "bar" });
    data.other = otherData;
    data.other.foo = "baz";
    expect(bgbeEventLog).toEqual([
      { objKey: "global", prop: "other", value: expect.any(Object) },
      { objKey: "other", prop: "foo", value: "baz" },
    ]);
  });
});
