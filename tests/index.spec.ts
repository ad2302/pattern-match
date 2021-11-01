import {match} from '../src/match';
import tap from 'tap';

tap.test('testNumberPass', async () => {
	tap.doesNotThrow(() => {
		match(42).when(42);
	});
});

tap.test('testNumberFail', async () => {
	tap.throws(() => {
		match(42).when(43);
	});
});

tap.test('testCases', async () => {
	tap.equal(
		match(42, when => {
			when(1, () => 'wrong 1');
			when(2, () => 'wrong 2');
			when(3, () => 'wrong 3');
			when(42, () => 'correct');
		}),
		'correct',
	);
});

tap.test('testFallThrough', async () => {
	tap.throws(() => {
		match(42, when => {
			when(1, () => 'wrong 1');
			when(2, () => 'wrong 2');
			when(3, () => 'wrong 3');
		});
	});
});

tap.test('testSimpleObject', async () => {
	tap.doesNotThrow(() => {
		match({a: 42, b: 'hi', c: true}).when({
			a: match.number,
			b: match.string,
			c: match.boolean,
		});
	});
	tap.throws(() => {
		match({a: 42, b: 'hi', c: true}).when({
			a: match.number,
			b: match.object,
			c: match.boolean,
		});
	});
});

tap.test('testSimpleArray', async () => {
	tap.doesNotThrow(() => {
		match([100, 200, 300, 400, 500]).when([100]);
		match([100, 200, 300, 400, 500]).when([100, 200]);
		match([100, 200, 300, 400, 500]).when([100, 200, 300]);
		match([100, 200, 300, 400, 500]).when([100, 200, 300, 400]);
		match([100, 200, 300, 400, 500]).when([100, 200, 300, 400, 500]);
	});
	tap.throws(() => {
		match([100]).when([100, 200, 300, 400, 500]);
	});
	tap.throws(() => {
		match([100, 200, 300, 400]).when([100, 200, 300, 400, 500]);
	});
});

tap.test('testNaN', async () => {
	tap.doesNotThrow(() => {
		match(NaN).when(NaN);
		match(NaN).when(match.number);
	});
	tap.throws(() => {
		match(0).when(NaN);
	});
	tap.throws(() => {
		match(Infinity).when(NaN);
	});
	tap.throws(() => {
		match('foo').when(NaN);
	});
});

tap.test('testRegExp', async () => {
	tap.doesNotThrow(() => {
		match('anna').when(/an*a/);
	});
});

tap.test('testPredicate', async () => {
	tap.doesNotThrow(() => {
		match([]).when(Array.isArray);
	});
	tap.throws(() => {
		match('hi').when(Array.isArray);
	});
});

tap.test('testUndefined', async () => {
	tap.doesNotThrow(() => {
		match(void 0).when(undefined);
		match(undefined).when(undefined);
		match().when(undefined);
	});
	tap.throws(() => {
		match(null).when(undefined);
	});
});

tap.test('testNull', async () => {
	tap.doesNotThrow(() => {
		match(null).when(null);
	});
	tap.throws(() => {
		match(undefined).when(null);
	});
});

tap.test('testAny', async () => {
	tap.doesNotThrow(() => {
		match(undefined).when(match.any);
		match(null).when(match.any);
		match({foo: 1, bar: 2}).when(match.any);
		match([1, 2, 3]).when(match.any);
		match('foo').when(match.any);
		match(true).when(match.any);
		match(false).when(match.any);
		match(1000).when(match.any);
		match(Infinity).when(match.any);
		match(-0).when(match.any);
		match(NaN).when(match.any);
		match(parseInt).when(match.any);
	});
});

tap.test('testVar', async () => {
	tap.equal(
		'ehrmagehrd! jervehrscrerptz',
		match({a: 'ehrmagehrd', b: '! ', c: 'jervehrscrerptz'}).when(
			{
				a: match.var('a'),
				b: match.var('b'),
				c: match.var('c'),
			},
			vars => vars.a + vars.b + vars.c,
		),
	);

	tap.equal(
		'snap crackle pop',
		match({
			foo: {
				bar: 'snap',
				baz: 'crackle',
			},
			mumble: 'pop',
		}).when(
			{
				foo: {
					bar: match.var('bar'),
					baz: match.var('baz'),
				},
				mumble: match.var('mumble'),
			},
			vars => [vars.bar, vars.baz, vars.mumble].join(' '),
		),
	);

	tap.equal(42, match(42).when(match.var('x', match.number)).x);
	tap.equal(
		42,
		match(42).when(match.var('x', match.number), vars => vars.x),
	);

	tap.throws(() => {
		match(42).when(match.var('x', match.string)).x;
	});
});

tap.test('testRange', async () => {
	tap.doesNotThrow(() => {
		match(3).when(match.range(0, 10));
		match(0).when(match.range(0, 10));
		match(9).when(match.range(0, 10));
	});
	tap.throws(() => {
		match(-1).when(match.range(0, 10));
		match(10).when(match.range(0, 10));
		match(99).when(match.range(0, 10));
	});
});

tap.test('testAll', async () => {
	tap.doesNotThrow(() => {
		match(100).when(
			match.all(match.number, match.integer, match.range(0, 1000), 100),
		);
		match().when(match.all());
	});
	tap.throws(() => {
		match(100).when(
			match.all(match.number, match.integer, match.range(0, 1000), match.string),
		);
	});
});

tap.test('testSome', async () => {
	tap.doesNotThrow(() => {
		match('hello').when(match.some(match.string, match.number, match.boolean));
		match(100).when(match.some(match.string, match.number, match.boolean));
		match(true).when(match.some(match.string, match.number, match.boolean));
	});
	tap.throws(() => {
		match({}).when(match.some(match.string, match.number, match.boolean));
		match().when(match.some());
	});
});

const MAX_INTEGER = 9007199254740991;

tap.test('testInteger', async () => {
	tap.doesNotThrow(() => {
		match(0).when(match.integer);
		match(-0).when(match.integer);
		match(1).when(match.integer);
		match(10).when(match.integer);
		match(100).when(match.integer);
		match(1000).when(match.integer);
		match(1.0).when(match.integer);
		match(-Infinity).when(match.integer);
		match(Infinity).when(match.integer);
		match(MAX_INTEGER).when(match.integer);
		match(MAX_INTEGER + 1).when(match.integer);
		match(MAX_INTEGER + 2).when(match.integer);
		match(-MAX_INTEGER).when(match.integer);
	});
	tap.throws(() => {
		match(NaN).when(match.integer);
		match(1.1).when(match.integer);
		match(11.11).when(match.integer);
		match(111.111).when(match.integer);
	});
});

tap.test('testInt32', async () => {
	tap.doesNotThrow(() => {
		match(0).when(match.int32);
		match(1).when(match.int32);
		match(10).when(match.int32);
		match(100).when(match.int32);
		match(1000).when(match.int32);
		match(-1).when(match.int32);
		match(-10).when(match.int32);
		match(-100).when(match.int32);
		match(-1000).when(match.int32);
		match(2 ** 31 - 1).when(match.int32);
		match(-(2 ** 31)).when(match.int32);
	});
	tap.throws(() => {
		match(2 ** 31).when(match.int32);
		match(-(2 ** 31) - 1).when(match.int32);
	});
});

tap.test('testUint32', async () => {
	tap.doesNotThrow(() => {
		match(0).when(match.uint32);
		match(1).when(match.uint32);
		match(10).when(match.uint32);
		match(100).when(match.uint32);
		match(1000).when(match.uint32);
		match(2 ** 32 - 1).when(match.uint32);
	});
	tap.throws(() => {
		match(-1).when(match.uint32);
		match(-10).when(match.uint32);
		match(-100).when(match.uint32);
		match(-1000).when(match.uint32);
		match(2 ** 32).when(match.uint32);
		match(-(2 ** 31) - 1).when(match.uint32);
	});
});

tap.test('testFinite', async () => {
	tap.doesNotThrow(() => {
		match(MAX_INTEGER).when(match.finite);
		match(Number.MAX_VALUE).when(match.finite);
		match(Number.MIN_VALUE).when(match.finite);
		match(0).when(match.finite);
		match(-0).when(match.finite);
		match(-Infinity).when(match.infinite);
		match(Infinity).when(match.infinite);
	});
	tap.throws(() => {
		match(-Infinity).when(match.finite);
		match(Infinity).when(match.finite);
		match(NaN).when(match.finite);
		match(NaN).when(match.infinite);
	});
});

tap.test('testSigns', async () => {
	tap.doesNotThrow(() => {
		match(-0).when(match.nonnegative);
		match(0).when(match.nonnegative);
		match(1).when(match.nonnegative);
		match(-1).when(match.negative);
		match(-Infinity).when(match.negative);
		match(Infinity).when(match.positive);
		match(-0).when(match.minusZero);
		match(0).when(match.plusZero);
	});
	tap.throws(() => {
		match(0).when(match.positive);
		match(0).when(match.negative);
		match(-0).when(match.positive);
		match(-0).when(match.negative);
		match(-0).when(match.plusZero);
		match(0).when(match.minusZero);
	});
});

tap.test('testBodyThisArg', async () => {
	const obj = {
		xyzzx: 'XYZZX',
	};
	tap.ok(
		match(
			'XYZZX',
			function (when) {
				when(this.xyzzx, () => true);
			},
			obj,
		),
	);
});

tap.test('testBodyDefaultThis', async () => {
	tap.equal(
		this,
		match(1, when => {
			const self = this;
			when(1, () => self);
		}),
	);
});

tap.test('testTemplateThisArg', async () => {
	const obj = {
		xyzzx: 'XYZZX',
	};
	tap.equal(
		'XYZZX',
		match(
			1,
			when => {
				when(
					1,
					function () {
						return this.xyzzx;
					},
					obj,
				);
			},
			{amITheGlobalObject: false},
		),
	);
});

tap.test('testTemplateDefaultThis', async () => {
	tap.equal(
		this,
		match(
			1,
			when => {
				when(1, () => this);
			},
			{amITheGlobalObject: false},
		),
	);
});
