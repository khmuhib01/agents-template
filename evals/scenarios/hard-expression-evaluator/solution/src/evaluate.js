export function evaluate(input) {
  const s = String(input);
  let i = 0;
  const ws = () => { while (s[i] === ' ' || s[i] === '\t') i++; };
  const fail = (m) => { throw new SyntaxError(`${m} at ${i}`); };
  function expr() {
    let v = term();
    for (;;) {
      ws();
      if (s[i] === '+') { i++; v += term(); } else if (s[i] === '-') { i++; v -= term(); } else return v;
    }
  }
  function term() {
    let v = unary();
    for (;;) {
      ws();
      if (s[i] === '*') { i++; v *= unary(); } else if (s[i] === '/') {
        i++;
        const d = unary();
        if (d === 0) throw new RangeError('division by zero');
        v /= d;
      } else return v;
    }
  }
  function unary() {
    ws();
    if (s[i] === '-') { i++; return -unary(); }
    if (s[i] === '+') { i++; return unary(); }
    return power();
  }
  function power() {
    const base = primary();
    ws();
    if (s[i] === '^') { i++; return base ** unary(); }
    return base;
  }
  function primary() {
    ws();
    if (s[i] === '(') {
      i++;
      const v = expr();
      ws();
      if (s[i] !== ')') fail('expected )');
      i++;
      return v;
    }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (!m) fail('expected a number');
    i += m[0].length;
    return parseFloat(m[0]);
  }
  const v = expr();
  ws();
  if (i < s.length) fail('unexpected input');
  return v;
}
