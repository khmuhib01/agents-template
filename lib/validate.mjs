// Pure config checks (no I/O). init.mjs turns the returned strings into a non-zero exit before anything is written.
// Why: test_command becomes an auto-approved Bash(...:*) permission and format_command runs through a shell on every edit,
// so a config line must not be able to smuggle in a second command or a shell/downloader as the program.
const SHELL_META = /[;&|`$<>\\\r\n]/;
const BAD_PROGRAM = new Set(['sh', 'bash', 'zsh', 'dash', 'fish', 'ksh', 'csh', 'eval', 'exec', 'sudo', 'su', 'doas', 'curl', 'wget', 'nc', 'ncat', 'ssh', 'scp']);

export function commandProblems(key, value) {
  if (value === undefined || value === null || value === '' || value === false) return [];
  const s = String(value).trim();
  const out = [];
  if (SHELL_META.test(s)) out.push(`${key} must be one plain command: no ; & | \` $ < > \\ or newlines (got "${s}")`);
  const program = s.split(/\s+/)[0].replace(/^.*[\\/]/, '').toLowerCase();
  if (BAD_PROGRAM.has(program)) out.push(`${key} must not start with "${program}" (a shell, downloader or privilege tool would be auto-approved)`);
  return out;
}

export function dockerProblems(docker) {
  if (!docker || typeof docker !== 'object') return [];
  const out = [];
  if (docker.dir !== undefined && docker.dir !== '' && !/^[\w./-]+$/.test(String(docker.dir))) out.push(`docker.dir may only contain letters, digits, _ . / - (got "${docker.dir}")`);
  if (docker.service !== undefined && docker.service !== '' && !/^[\w.-]+$/.test(String(docker.service))) out.push(`docker.service may only contain letters, digits, _ . - (got "${docker.service}")`);
  return out;
}
