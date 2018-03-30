const { Observable } = require('rxjs');
const { ActionsObservable } = require('redux-observable');

const { pingEpic } = require('./ping');

const TEST_TIMEOUT = 2500;
const arrayOf = (action$, size) => action$.take(size).toArray().timeout(TEST_TIMEOUT).toPromise();

test('pingEpic does map to PONG', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            observer.next({ type: 'PING' });
        })
    );
    const resultant$ = pingEpic(action$);
    const results = await arrayOf(resultant$, 1);

    expect(results).toEqual([
        { type: 'PONG' },
    ]);
});
