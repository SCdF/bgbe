import { describe, beforeEach, it, expect } from "vitest";
import bgbe, { bgbeEventLog, resetBgbeEventLog } from "./bgbe";

describe("bgbe end-to-end test", () => {
  beforeEach(() => {
    resetBgbeEventLog();
  });

  it("should log changes to a large object, including deletions and additions", () => {
    const largeObject = {
      a: 1,
      b: "string",
      c: true,
      d: null,
      e: [1, 2, 3],
      f: {
        g: "nested",
        h: [4, 5, 6],
        i: {
          j: "deeply nested",
        },
      },
    } as any;

    const proxiedObject = bgbe("testObject", largeObject);

    // Change values in various ways
    proxiedObject.a = 2;
    proxiedObject.b = "new string";
    proxiedObject.c = false;
    proxiedObject.e.push(4);
    proxiedObject.f.g = "new nested";
    proxiedObject.f.h[1] = 10;
    proxiedObject.f.i.j = "new deeply nested";

    // Add new internal objects
    proxiedObject.newProp = { k: "new object" };
    proxiedObject.f.newNestedProp = { l: "another new object" };

    // Delete properties
    delete proxiedObject.d;
    delete proxiedObject.f.h;

    // Verify the log
    expect(bgbeEventLog).toEqual([
      { objKey: "testObject", prop: "a", value: 2 },
      { objKey: "testObject", prop: "b", value: "new string" },
      { objKey: "testObject", prop: "c", value: false },
      { objKey: "testObject.e", prop: "3", value: 4 },
      { objKey: "testObject.f", prop: "g", value: "new nested" },
      { objKey: "testObject.f.h", prop: "1", value: 10 },
      { objKey: "testObject.f.i", prop: "j", value: "new deeply nested" },
      { objKey: "testObject", prop: "newProp", value: { k: "new object" } },
      {
        objKey: "testObject.f",
        prop: "newNestedProp",
        value: { l: "another new object" },
      },
      { objKey: "testObject", prop: "d", value: undefined },
      { objKey: "testObject.f", prop: "h", value: undefined },
    ]);
  });
});
