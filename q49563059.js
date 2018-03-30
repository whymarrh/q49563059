const { Observable, Subject } = require('rxjs');

class DefaultMap extends Map {
    constructor(initializeValue) {
        super();
        this._initializeValue = initializeValue || (() => {});
    }

    get(key) {
        if (this.has(key)) {
            return super.get(key);
        }

        const subject = new Subject();
        this._initializeValue(subject);
        this.set(key, subject);
        return subject;
    }
}

const REQUEST_DURATION = 500;
const fakeAjaxCall = () => Observable.timer(REQUEST_DURATION);
const myEpic = (action$) => {
    const completed$ = new Subject();
    const flights = new DefaultMap((uniquePair) =>
        uniquePair.exhaustMap((action) =>
            fakeAjaxCall().map(() => ({
                ...action,
                type: 'COMPLETED',
            }))
        )
        .subscribe((action) => completed$.next(action))
    );
    action$.ofType('REMOTE_DATA_STARTED')
        .subscribe((action) => {
            flights.get(`${action.owner}+${action.url}`).next(action);
        });

    return completed$;
};

module.exports = {myEpic, REQUEST_DURATION};
