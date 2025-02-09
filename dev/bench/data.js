window.BENCHMARK_DATA = {
  "lastUpdate": 1739120687943,
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
      }
    ]
  }
}