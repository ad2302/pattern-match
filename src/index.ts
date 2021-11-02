type When = (a: unknown, b: MatchCallback, c?: unknown) => void;
type MatchCallback = (b: When) => void;

export function match(
  actual?: unknown,
  body?: MatchCallback,
  thisArg?: unknown,
) {
  // If body is not provided, then do a single-case ("irrefutable") match.
  if (typeof body === 'undefined') {
    return {
      // Now that we have the single case, do the match.
      when(pattern, template, thisArg) {
        return matchCases(actual, [
          {
            pattern,
            template,
            thisArg,
          },
        ]);
      },
    };
  }

  // If body is provided, call it to obtain the array of cases.
  const cases = [];

  if (typeof thisArg === 'undefined') {
    thisArg = this;
  }

  body.call(thisArg, (pattern, template, thisArg) => {
    cases.push({
      pattern,
      template,
      thisArg,
    });
  });

  // Now that we have all the cases, do the match.
  return matchCases(actual, cases);
}

function matchCases(actual, cases) {
  for (let i = 0, n = cases.length; i < n; i++) {
    const c = cases[i];
    try {
      const matches = {};
      matchPattern(c.pattern, actual, matches);
      return c.template
        ? c.template.call(
          typeof c.thisArg === 'undefined' ? this : c.thisArg,
          matches,
        )
        : matches;
    } catch (e) {
      if (e instanceof MatchError) {
        continue;
      }

      throw e;
    }
  }

  throw new MatchError(cases, actual, 'no more cases');
}

export class MatchError extends Error {
  constructor(public expected, public actual, message){
    super(message);
    if (!('stack' in this)) {
      this.stack = new Error().stack;
    }
    this.expected = expected;
    this.actual = actual;
  }
}

function matchPattern(pattern, actual, matches) {
  if (pattern instanceof Pattern) {
    // @ts-ignore
    pattern.match(actual, matches);
  } else if (Array.isArray(pattern)) {
    matchArray(pattern, actual, matches);
  } else if (typeof pattern === 'object') {
    if (!pattern) {
      matchNull(actual);
    } else if (pattern instanceof RegExp) {
      matchRegExp(pattern, actual);
    } else {
      matchObject(pattern, actual, matches);
    }
  } else if (typeof pattern === 'string') {
    matchString(pattern, actual);
  } else if (typeof pattern === 'number') {
    if (pattern === actual) {
      matchNumber(pattern, actual);
    } else {
      matchNaN(actual);
    }
  } else if (typeof pattern === 'boolean') {
    matchBoolean(pattern, actual);
  } else if (typeof pattern === 'function') {
    matchPredicate(pattern, actual);
  } else if (typeof pattern === 'undefined') {
    matchUndefined(actual);
  }
}

function matchNull(actual) {
  if (actual !== null) {
    throw new MatchError(null, actual, 'not null');
  }
}

function matchArray(arr, actual, matches) {
  if (typeof actual !== 'object') {
    throw new MatchError(arr, actual, 'not an object');
  }

  if (!actual) {
    throw new MatchError(arr, actual, 'null');
  }

  const n = arr.length;
  for (let i = 0; i < n; i++) {
    if (!(i in actual)) {
      throw new MatchError(arr, actual, 'no element at index ' + i);
    }

    matchPattern(arr[i], actual[i], matches);
  }
}

const hasOwn = {}.hasOwnProperty;

function matchObject(obj, actual, matches) {
  if (typeof actual !== 'object') {
    throw new MatchError(obj, actual, 'not an object');
  }

  if (!actual) {
    throw new MatchError(obj, actual, 'null');
  }

  for (const key in obj) {
    if (!hasOwn.call(obj, key)) {
      continue;
    }

    if (!(key in actual)) {
      throw new MatchError(obj, actual, 'no property ' + key);
    }

    matchPattern(obj[key], actual[key], matches);
  }
}

function matchString(str: string, actual: unknown) {
  if (typeof actual !== 'string') {
    throw new MatchError(str, actual, 'not a string');
  }

  if (actual !== str) {
    throw new MatchError(str, actual, 'wrong string value');
  }
}

function matchRegExp(re: RegExp, actual: unknown) {
  if (typeof actual !== 'string') {
    throw new MatchError(re, actual, 'not a string');
  }

  if (!re.test(actual)) {
    throw new MatchError(re, actual, 'regexp pattern match failed');
  }
}

function matchNumber(num: number, actual: unknown) {
  if (typeof actual !== 'number') {
    throw new MatchError(num, actual, 'not a number');
  }

  if (actual !== num) {
    throw new MatchError(num, actual, 'wrong number value');
  }
}

function matchNaN(actual: unknown) {
  if (typeof actual !== 'number' || actual === actual) {
    throw new MatchError(NaN, actual, 'not NaN');
  }
}

function matchPredicate(pred, actual) {
  if (!pred(actual)) {
    throw new MatchError(pred, actual, 'predicate failed');
  }
}

function matchBoolean(bool: boolean, actual: unknown) {
  if (typeof actual !== 'boolean') {
    throw new MatchError(bool, actual, 'not a boolean');
  }

  if (actual !== bool) {
    throw new MatchError(bool, actual, 'wrong boolean value');
  }
}

function matchUndefined(actual) {
  if (typeof actual !== 'undefined') {
    throw new MatchError(undefined, actual, 'not undefined');
  }
}

function Pattern() {}

function Var(name: string, pattern?: (a: unknown) => boolean) {
  this._name = name;
  this._pattern = typeof pattern === 'undefined' ? Any : pattern;
}

Var.prototype = Object.create(Pattern.prototype);

Var.prototype.match = function Var_match(actual, matches) {
  matchPattern(this._pattern, actual, matches);
  matches[this._name] = actual;
};

var Any = Object.create(Pattern.prototype);

Any.match = function Any_match() {};

match.var = function (name: string, pattern?: (a: unknown) => boolean) {
  return new Var(name, pattern);
};

match.any = Any;

match.object = function (x) {
  return typeof x === 'object' && x;
};

match.array = Array.isArray;

match.primitive = function (x) {
  return x === null || typeof x !== 'object';
};

match.number = function (x) {
  return typeof x === 'number';
};

match.range = function (start, end) {
  return function (x) {
    return typeof x === 'number' && x >= start && x < end;
  };
};

const {floor} = Math;
const {abs} = Math;

function sign(x) {
  return x < 0 ? -1 : 1;
}

// Implements ECMA-262 ToInteger (ES5 9.4, Draft ES6 9.1.4)
function toInteger(x) {
  return x !== x
    ? 0
    : x === 0 || x === -Infinity || x === Infinity
      ? x
      : sign(x) * floor(abs(x));
}

match.negative = function (x) {
  return typeof x === 'number' && x < 0;
};

match.positive = function (x) {
  return typeof x === 'number' && x > 0;
};

match.nonnegative = function (x) {
  return typeof x === 'number' && x >= 0;
};

match.minusZero = function (x) {
  return x === 0 && 1 / x === -Infinity;
};

match.plusZero = function (x) {
  return x === 0 && 1 / x === Infinity;
};

match.finite = function (x) {
  return typeof x === 'number' && isFinite(x);
};

match.infinite = function (x) {
  return typeof x === 'number' && (x === Infinity || x === -Infinity);
};

match.integer = function (x) {
  return typeof x === 'number' && x === toInteger(x);
};

match.int32 = function (x) {
  return typeof x === 'number' && x === (x | 0);
};

match.uint32 = function (x) {
  return typeof x === 'number' && x === x >>> 0;
};

match.string = function (x) {
  return typeof x === 'string';
};

match.boolean = function (x) {
  return typeof x === 'boolean';
};

match.null = function (x) {
  return x === null;
};

match.undefined = function (x) {
  return typeof x === 'undefined';
};

match.function = function (x) {
  return typeof x === 'function';
};

function All(patterns) {
  this.patterns = patterns;
}

All.prototype = Object.create(Pattern.prototype);

All.prototype.match = function (actual, matches) {
  // Try all patterns in a temporary scratch sub-match object.
  const temp = {};
  for (let i = 0, n = this.patterns.length; i < n; i++) {
    matchPattern(this.patterns[i], actual, temp);
  }

  // On success, commit all the sub-matches to the real sub-match object.
  for (const key in temp) {
    if (!hasOwn.call(temp, key)) {
      continue;
    }

    matches[key] = temp[key];
  }
};

match.all = function (...args) {
  return new All(args);
};

function Some(patterns) {
  this.patterns = patterns;
}

Some.prototype = Object.create(Pattern.prototype);

Some.prototype.match = function (actual, matches) {
  // Try each pattern in its own temporary scratch sub-match object.
  let temp;
  for (let i = 0, n = this.patterns.length; i < n; i++) {
    temp = {};
    try {
      matchPattern(this.patterns[i], actual, temp);

      // On success, commit the successful sub-matches to the real sub-match object.
      for (const key in temp) {
        if (!hasOwn.call(temp, key)) {
          continue;
        }

        matches[key] = temp[key];
      }

      return;
    } catch (e) {
      if (!(e instanceof MatchError)) {
        throw e;
      }
    }
  }

  throw new MatchError('no alternates matched', actual, this);
};

match.some = function (...args) {
  return new Some(args);
};

match.MatchError = MatchError;

match.pattern = Pattern.prototype;

// Export default match
