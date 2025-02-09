import bgbe, { resetBgbeEventLog } from "./bgbe";

function measurePerformance(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return end - start;
}

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
  for (let i = 0; i < 1000; i++) {
    obj[`key${i}`] = i * 2;
  }
}

function getValues(obj: any) {
  for (let i = 0; i < 1000; i++) {
    const value = obj[`key${i}`];
  }
}

const iterations = 5000;

const rawMinimalObject = createMinimalObject();
const rawLargeObject = createLargeObject();
const bgbeMinimalObject = bgbe(createMinimalObject());
const bgbeLargeObject = bgbe(createLargeObject());

const results = [
  {
    operation: "Create Minimal Object",
    raw: measurePerformance(createMinimalObject, iterations),
    bgbe: measurePerformance(() => bgbe(createMinimalObject()), iterations),
  },
  {
    operation: "Create Large Object",
    raw: measurePerformance(createLargeObject, iterations),
    bgbe: measurePerformance(() => bgbe(createLargeObject()), iterations),
  },
  {
    operation: "Set Values (Large Object)",
    raw: measurePerformance(() => setValues(rawLargeObject), iterations),
    bgbe: measurePerformance(() => setValues(bgbeLargeObject), iterations),
  },
  {
    operation: "Get Values (Large Object)",
    raw: measurePerformance(() => getValues(rawLargeObject), iterations),
    bgbe: measurePerformance(() => getValues(bgbeLargeObject), iterations),
  },
];

console.table(results);
