window.BENCHMARK_DATA = {
  "lastUpdate": 1739121607031,
  "repoUrl": "https://github.com/SCdF/bgbe",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "stefan@sdufresne.info",
            "name": "Stefan du Fresne",
            "username": "SCdF"
          },
          "committer": {
            "email": "stefan@sdufresne.info",
            "name": "Stefan du Fresne",
            "username": "SCdF"
          },
          "distinct": true,
          "id": "adf4b456a5b8bca3e544f3ee30d34508c0ba54f9",
          "message": "maybe this",
          "timestamp": "2025-02-09T17:03:38Z",
          "tree_id": "7767ef49b4c80b9d203349a8a651989ed49542fa",
          "url": "https://github.com/SCdF/bgbe/commit/adf4b456a5b8bca3e544f3ee30d34508c0ba54f9"
        },
        "date": 1739120687147,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Create Minimal Object - raw",
            "value": 137498841,
            "range": "±4.21%",
            "unit": "ops/sec",
            "extra": "83 samples"
          },
          {
            "name": "Create Minimal Object - bgbe",
            "value": 1221904,
            "range": "±1.75%",
            "unit": "ops/sec",
            "extra": "90 samples"
          },
          {
            "name": "Create Large Object - raw",
            "value": 3386,
            "range": "±1.65%",
            "unit": "ops/sec",
            "extra": "78 samples"
          },
          {
            "name": "Create Large Object - bgbe",
            "value": 1827,
            "range": "±0.53%",
            "unit": "ops/sec",
            "extra": "92 samples"
          },
          {
            "name": "Set Values (Large Object) - raw",
            "value": 78738462,
            "range": "±3.24%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "Set Values (Large Object) - bgbe",
            "value": 6414795,
            "range": "±36.71%",
            "unit": "ops/sec",
            "extra": "68 samples"
          },
          {
            "name": "Get Values (Large Object) - raw",
            "value": 78967789,
            "range": "±2.91%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "Get Values (Large Object) - bgbe",
            "value": 19256591,
            "range": "±0.66%",
            "unit": "ops/sec",
            "extra": "93 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stefan@sdufresne.info",
            "name": "Stefan du Fresne",
            "username": "SCdF"
          },
          "committer": {
            "email": "stefan@sdufresne.info",
            "name": "Stefan du Fresne",
            "username": "SCdF"
          },
          "distinct": true,
          "id": "abceaf6f21de2e6eeede3ec8a2eaa9e98ed8dfc0",
          "message": "perf improvements!?",
          "timestamp": "2025-02-09T17:19:00Z",
          "tree_id": "9ab7655926fc2ed3248e45a163be524852d51f37",
          "url": "https://github.com/SCdF/bgbe/commit/abceaf6f21de2e6eeede3ec8a2eaa9e98ed8dfc0"
        },
        "date": 1739121606628,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "Create Minimal Object - raw",
            "value": 127759971,
            "range": "±4.94%",
            "unit": "ops/sec",
            "extra": "79 samples"
          },
          {
            "name": "Create Minimal Object - bgbe",
            "value": 1532734,
            "range": "±0.69%",
            "unit": "ops/sec",
            "extra": "91 samples"
          },
          {
            "name": "Create Large Object - raw",
            "value": 9894,
            "range": "±0.51%",
            "unit": "ops/sec",
            "extra": "93 samples"
          },
          {
            "name": "Create Large Object - bgbe",
            "value": 2818,
            "range": "±0.75%",
            "unit": "ops/sec",
            "extra": "95 samples"
          },
          {
            "name": "Set Values (Large Object) - raw",
            "value": 81423351,
            "range": "±2.71%",
            "unit": "ops/sec",
            "extra": "87 samples"
          },
          {
            "name": "Set Values (Large Object) - bgbe",
            "value": 5925531,
            "range": "±46.31%",
            "unit": "ops/sec",
            "extra": "60 samples"
          },
          {
            "name": "Get Values (Large Object) - raw",
            "value": 81228155,
            "range": "±2.70%",
            "unit": "ops/sec",
            "extra": "89 samples"
          },
          {
            "name": "Get Values (Large Object) - bgbe",
            "value": 24909362,
            "range": "±1.57%",
            "unit": "ops/sec",
            "extra": "90 samples"
          }
        ]
      }
    ]
  }
}