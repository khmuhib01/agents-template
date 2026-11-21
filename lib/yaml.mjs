// Minimal YAML-subset parser (zero dependencies). See README for the supported syntax.
// A quote only opens a string at the start of a value (after : , [ { - or at the line start), so the apostrophe in
// `notes: don't # comment` is plain text and the comment is still stripped.
const opensQuote = (before) => { const p = before.trimEnd().slice(-1); return p === '' || ':,[{-'.includes(p); };
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === q) { if (q === "'" && line[i + 1] === "'") i++; else q = null; } } // '' is an escaped apostrophe
    else if ((c === '"' || c === "'") && opensQuote(line.slice(0, i))) q = c;
    else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}
function splitTop(s) {
  const out = []; let depth = 0, q = null, cur = '';
  for (let idx = 0; idx < s.length; idx++) {
    const c = s[idx];
    if (q) { cur += c; if (c === q) { if (q === "'" && s[idx + 1] === "'") { cur += s[++idx]; } else q = null; } continue; }
    if ((c === '"' || c === "'") && opensQuote(cur)) { q = c; cur += c; continue; }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '') out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== '');
}
function yerr(no, msg) { return new Error(`line ${no}: ${msg}`); }
function scalar(s, no) {
  s = s.trim();
  if (s === '') return '';
  const c = s[0];
  if (c === '|' || c === '>') throw yerr(no, 'block scalars ("|" and ">") are not supported; use a quoted one-line string or a list');
  if (c === '&' || c === '*' || c === '!') throw yerr(no, 'anchors, aliases and tags (&, *, !) are not supported; repeat the value instead');
  if (c === '"' || c === "'") {
    if (s.length < 2 || !s.endsWith(c)) throw yerr(no, `unterminated quoted string, or text after the closing quote: ${s}`);
    return c === "'" ? s.slice(1, -1).replaceAll("''", "'") : s.slice(1, -1);
  }
  // Case-insensitive so "False" is not a truthy string that silently ignores an opt-out.
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true';
  if (s === 'null' || s === '~') return '';
  // Only numbers that survive a round trip: 1.10 and 007 stay strings instead of becoming 1.1 and 7.
  if (/^-?\d+(\.\d+)?$/.test(s) && String(Number(s)) === s) return Number(s);
  if (c === '[') {
    if (!s.endsWith(']')) throw yerr(no, `unclosed "[" (multi-line lists are not supported; put it on one line or use "- item" lines): ${s}`);
    return splitTop(s.slice(1, -1)).map((x) => scalar(x, no));
  }
  if (c === '{') {
    if (!s.endsWith('}')) throw yerr(no, `unclosed "{" (multi-line maps are not supported; put it on one line or nest the keys): ${s}`);
    const o = {};
    for (const part of splitTop(s.slice(1, -1))) {
      const i = part.indexOf(':');
      if (i <= 0) throw yerr(no, `inline map entries must look like "key: value", got "${part}"`);
      o[part.slice(0, i).trim()] = scalar(part.slice(i + 1), no);
    }
    return o;
  }
  return s;
}
export function parseYaml(text) {
  const lines = [];
  text.replace(/^﻿/, '').split(/\r?\n/).forEach((raw, i) => {
    const no = i + 1;
    const body = stripComment(raw);
    if (body.trim() === '') return;
    if (/^ *\t/.test(body)) throw yerr(no, 'tabs are not allowed for indentation; use spaces (2 per level)');
    if (lines.length === 0 && body.trim() === '---') return;
    lines.push({ no, indent: body.match(/^ */)[0].length, text: body.trim() });
  });
  let pos = 0;
  const list = (indent) => {
    const arr = [];
    while (pos < lines.length && lines[pos].indent === indent && lines[pos].text.startsWith('-')) {
      const l = lines[pos];
      const rest = l.text.slice(1).trim();
      if (rest === '') throw yerr(l.no, 'empty list item; nested structures under "-" are not supported');
      arr.push(scalar(rest, l.no)); pos++;
    }
    return arr;
  };
  const map = (indent) => {
    const obj = {};
    while (pos < lines.length && lines[pos].indent === indent) {
      const l = lines[pos];
      const m = l.text.match(/^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/);
      if (!m) {
        const hint = l.text.startsWith('-') ? 'unexpected list item (indent it under its key)' : l.text.startsWith('<<') ? 'merge keys ("<<") are not supported' : 'expected "key: value" (keys use letters, digits, _ . -; a space is required after ":")';
        throw yerr(l.no, `cannot parse "${l.text}": ${hint}`);
      }
      if (Object.hasOwn(obj, m[1])) throw yerr(l.no, `duplicate key "${m[1]}"`);
      pos++;
      const next = lines[pos];
      if (m[2] !== undefined && m[2] !== '') obj[m[1]] = scalar(m[2], l.no);
      else if (next && next.indent > indent) obj[m[1]] = next.text.startsWith('-') ? list(next.indent) : map(next.indent);
      else if (next && next.indent === indent && next.text.startsWith('-')) obj[m[1]] = list(indent);
      else obj[m[1]] = '';
    }
    if (pos < lines.length && lines[pos].indent > indent) throw yerr(lines[pos].no, `bad indentation near "${lines[pos].text}"`);
    return obj;
  };
  const out = lines.length ? map(lines[0].indent) : {};
  if (pos < lines.length) throw yerr(lines[pos].no, `inconsistent indentation near "${lines[pos].text}"`);
  return out;
}
