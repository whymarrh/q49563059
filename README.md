# [An answer to a question on Stack Overflow](https://stackoverflow.com/a/49581647/1267663)

To run the test suite:

1. `npm install`
2. `npm test`

The test suite output should look something like so:

```
> jest

 PASS  ./q49563059.test.js (7.061s)
  ✓ myEpic does map to COMPLETED for simple, single value stream (515ms)
  ✓ myEpic does map to COMPLETED for two separate owner+url pairs (507ms)
  ✓ myEpic does drop action when the owner+url pair is already inflight (1510ms)
  ✓ myEpic does NOT drop action when the owner+url pair is spaced correctly (1011ms)
  ✓ myEpic does both drop actions and NOT drop actions for a owner+url pair (2016ms)
  ✓ myEpic does both drop actions and NOT drop actions for two owner+url pairs (1013ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        7.637s, estimated 8s
Ran all test suites.
```

### Files

- `q49563059.js` is the answer
- `q49563059.test.js` is the test suite
