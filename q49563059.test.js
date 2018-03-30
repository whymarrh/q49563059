const { Observable } = require('rxjs');
const { ActionsObservable } = require('redux-observable');

const { myEpic, REQUEST_DURATION } = require('./q49563059');

const A_FEW_MILLISECONDS = 5;
const TEST_TIMEOUT = 1000;
const arrayOfExactly = (action$, count) => action$.take(count)
    .timeout(TEST_TIMEOUT)
    .toArray()
    .toPromise()
;
const arrayOfAtMost = (action$, limit) => action$.take(limit)
    .timeoutWith(TEST_TIMEOUT, Observable.empty())
    .toArray()
    .toPromise()
;

test('myEpic does map to COMPLETED for simple, single value stream', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.com', owner: 'jim' });
        })
    );
    const resultant$ = myEpic(action$);
    const results = await arrayOfExactly(resultant$, 1);

    expect(results).toEqual([
        { type: 'COMPLETED', url: 'google.com', owner: 'jim' },
    ]);
});

test('myEpic does map to COMPLETED for two separate owner+url pairs', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.com', owner: 'jim1' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.org', owner: 'jim2' });
        })
    );
    const resultant$ = myEpic(action$);
    const results = await arrayOfExactly(resultant$, 2);

    expect(results).toEqual([
        { type: 'COMPLETED', url: 'google.com', owner: 'jim1' },
        { type: 'COMPLETED', url: 'google.org', owner: 'jim2' },
    ]);
});

test('myEpic does drop action when the owner+url pair is already inflight', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
        })
    );
    const resultant$ = myEpic(action$);
    const results = await arrayOfAtMost(resultant$, 2);

    expect(results).toEqual([
        { type: 'COMPLETED', url: 'google.co.uk', owner: 'jane' },
    ]);
});

test('myEpic does NOT drop action when the owner+url pair is spaced correctly', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
            setTimeout(() => {
                observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
            }, REQUEST_DURATION + A_FEW_MILLISECONDS);
        })
    );
    const resultant$ = myEpic(action$);
    const results = await arrayOfAtMost(resultant$, 2);

    expect(results).toEqual([
        { type: 'COMPLETED', url: 'google.co.uk', owner: 'jane' },
        { type: 'COMPLETED', url: 'google.co.uk', owner: 'jane' },
    ]);
});

test('myEpic does both drop actions and NOT drop actions for a owner+url pair', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
            setTimeout(() => {
                observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.co.uk', owner: 'jane' });
            }, REQUEST_DURATION + A_FEW_MILLISECONDS);
        })
    );
    const resultant$ = myEpic(action$);
    const results = await arrayOfAtMost(resultant$, 3);

    expect(results).toEqual([
        { type: 'COMPLETED', url: 'google.co.uk', owner: 'jane' },
        { type: 'COMPLETED', url: 'google.co.uk', owner: 'jane' },
    ]);
});

test('myEpic does both drop actions and NOT drop actions for two owner+url pairs', async () => {
    const action$ = new ActionsObservable(
        Observable.create((observer) => {
            // Jim #1 emits four (4) concurrent calls—we expect only two to be COMPLETED, one per URL
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.com', owner: 'jim1' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.com', owner: 'jim1' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.org', owner: 'jim1' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.org', owner: 'jim1' });

            // Jim #2 emits two (2) calls at the same time as Jim #1—we expect only one to be COMPLETED, deduped URLs
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.biz', owner: 'jim2' });
            observer.next({ type: 'REMOTE_DATA_STARTED', url: 'google.biz', owner: 'jim2' });

            // Once all of the above calls are completed, Jim #1 and Jim #2 make calls simultaneously
            // We expect both to be COMPLETED
            setTimeout(() => {
                const url = 'https://stackoverflow.com/q/49563059/1267663';
                observer.next({ type: 'REMOTE_DATA_STARTED', url, owner: 'jim1' });
                observer.next({ type: 'REMOTE_DATA_STARTED', url, owner: 'jim2' });
            }, REQUEST_DURATION + A_FEW_MILLISECONDS);
        })
    );
    const resultant$ = myEpic(action$);
    const results = await arrayOfAtMost(resultant$, 5);

    expect(results).toEqual([
        { type: 'COMPLETED', url: 'google.com', owner: 'jim1' },
        { type: 'COMPLETED', url: 'google.org', owner: 'jim1' },
        { type: 'COMPLETED', url: 'google.biz', owner: 'jim2' },
        { type: 'COMPLETED', url: 'https://stackoverflow.com/q/49563059/1267663', owner: 'jim1' },
        { type: 'COMPLETED', url: 'https://stackoverflow.com/q/49563059/1267663', owner: 'jim2' },
    ]);
});
