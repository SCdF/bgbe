import { describe, expect, it } from "vitest";
import { expectType } from "tsd";

import { bgbe, isBgbed } from "./objectProxy";

// TypeScript compilation tests
describe("TypeScript Compilation Tests", () => {
  it("should allow setting valid types", () => {
    const data = bgbe({});
    data.foo = "bar";
    expectType<string>(data.foo);
  });

  it("should fail when setting invalid types", () => {
    const data = bgbe({});
    // @ts-expect-error
    data.foo = {};
    // @ts-expect-error
    data.foo.bar = "smang";
  });

  it("should allow nested proxies", () => {
    const data = bgbe({});
    data.foo = bgbe({});
    data.foo.bar = "smang";
    expectType<string>(data.foo.bar);
  });

  it("should fail for unsupported types", () => {
    const bar = bgbe({
      sing: "foo",
      num: Date.now(),
      // @ts-expect-error
      date: new Date(), // dates aren't immutable so we don't support them
    });
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
    const data = bgbe({});
    data.foo = "bar";
    data.foo = "baz";
    expect(data.foo).toBe("baz");
  });

  it("should handle nested proxies correctly", () => {
    const data = bgbe({});
    data.foo = bgbe({});
    data.foo.bar = "smang";
    expect(data.foo.bar).toBe("smang");
  });

  it("should identify proxied objects", () => {
    const data = bgbe({});
    expect(isBgbed(data)).toBe(true);
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

    expect(arrays.log).toEqual([
      { prop: "3", value: 4 },
      { prop: "0", value: 5 },
    ]);
  });

  it("should log every value that gets set", () => {
    const data = bgbe({});
    data.foo = "bar";
    data.foo = "baz";
    expect(data.log).toEqual([
      { prop: "foo", value: "bar" },
      { prop: "foo", value: "baz" },
    ]);
  });

  it("should log nested proxy values", () => {
    const data = bgbe({});
    data.foo = bgbe({});
    data.foo.bar = "smang";
    expect(data.log).toEqual([{ prop: "foo", value: expect.any(Object) }]);
    expect(data.foo.log).toEqual([{ prop: "bar", value: "smang" }]);
  });
});
