import {stub} from 'sinon'

export function stubs(...names) {
	return names.reduce((o,n) => {o[n] = stub().returns(new Object); return o}, {})
}

export function testAddHandler(t, seneca, callNum, pattern, handler, handlerArgs) {
	for (let i in handlerArgs) {
		t.deepEqual(handler.args[0][i], handlerArgs[i], 'Handler inititalization args do not match')
	}
	t.deepEqual(seneca.add.args[callNum][0], pattern, 'Seneca pattern does not match')
	t.is(seneca.add.args[callNum][1], handler.returnValues[0], 'Handler function was not added to seneca')
}

