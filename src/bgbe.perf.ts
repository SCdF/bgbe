import Benchmark from "benchmark";
import bgbe, { resetBgbeEventLog } from "./bgbe";

function createMinimalObject() {
  return { a: 1 };
}

function createLargeObject() {
  const obj: { [key: string]: number } = {};
  for (let i = 0; i < 1000; i++) {
    obj[`key${i}`] = i;
  }
  return obj;
}

function setValues(obj: any) {
  obj[`key`] = "foo";
}

function getValues(obj: any) {
  return obj[`key`];
}

const rawMinimalObject = createMinimalObject();
const rawLargeObject = createLargeObject();
const bgbeMinimalObject = bgbe(createMinimalObject());
const bgbeLargeObject = bgbe(createLargeObject());

const suite = new Benchmark.Suite("bgbe basics");

suite
  .add("Create Minimal Object - raw", function () {
    createMinimalObject();
  })
  .add("Create Minimal Object - bgbe", function () {
    bgbe(createMinimalObject());
  })
  .add("Create Large Object - raw", function () {
    createLargeObject();
  })
  .add("Create Large Object - bgbe", function () {
    bgbe(createLargeObject());
  })
  .add("Set Values (Large Object) - raw", function () {
    setValues(rawLargeObject);
  })
  .add("Set Values (Large Object) - bgbe", function () {
    setValues(bgbeLargeObject);
  })
  .add("Get Values (Large Object) - raw", function () {
    getValues(rawLargeObject);
  })
  .add("Get Values (Large Object) - bgbe", function () {
    getValues(bgbeLargeObject);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .run();
