const pingEpic = action$ =>
    action$.ofType('PING')
        .delay(500)
        .mapTo({ type: 'PONG' });

module.exports = {pingEpic};
