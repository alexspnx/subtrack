#!/usr/bin/env node
// Clones every project repo listed in repos.json into the workspace root.
// Each repo is an independent git repo; the root repo ignores them via its include-list .gitignore.
//
// Usage:
//   node scripts/clone-repos.mjs                 clone missing repos, skip existing ones
//   node scripts/clone-repos.mjs --pull          also fast-forward existing repos that are clean
//   node scripts/clone-repos.mjs --status        only print branch / dirty / ahead-behind per repo
//   node scripts/clone-repos.mjs --only a,b      limit to the listed repo dirs

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'repos.json');

// Root-level names owned by the workspace repo; a project repo must never be cloned over them.
const reserved = new Set(['.git', '.claude', '_bmad', '_bmad-output', 'docs', 'scripts', 'node_modules']);

function parseArgs(argv) {
  const args = { pull: false, status: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--pull') args.pull = true;
    else if (arg === '--status') args.status = true;
    else if (arg === '--only') args.only = new Set((argv[++i] ?? '').split(',').filter(Boolean));
    else if (arg.startsWith('--only=')) args.only = new Set(arg.slice(7).split(',').filter(Boolean));
    else if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/clone-repos.mjs [--pull] [--status] [--only dir1,dir2]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return args;
}

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { ok: result.status === 0, out: (result.stdout ?? '').trim(), err: (result.stderr ?? '').trim() };
}

function loadRepos() {
  if (!existsSync(manifestPath)) {
    console.error(`Missing ${manifestPath}`);
    process.exit(1);
  }
  try {
    const { repos = [] } = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const seen = new Set();
    for (const repo of repos) {
      if (!repo.dir || !repo.url) throw new Error(`each repo needs "dir" and "url": ${JSON.stringify(repo)}`);
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repo.dir)) throw new Error(`invalid dir name: ${repo.dir}`);
      if (reserved.has(repo.dir)) throw new Error(`dir name is reserved by the workspace root: ${repo.dir}`);
      if (seen.has(repo.dir)) throw new Error(`duplicate dir: ${repo.dir}`);
      seen.add(repo.dir);
    }
    return repos;
  } catch (error) {
    console.error(`repos.json: ${error.message}`);
    process.exit(1);
  }
}

function describe(path) {
  const branch = git(path, 'rev-parse', '--abbrev-ref', 'HEAD').out || '?';
  const dirty = git(path, 'status', '--porcelain').out ? 'dirty' : 'clean';
  const counts = git(path, 'rev-list', '--left-right', '--count', '@{upstream}...HEAD');
  const tracking = counts.ok
    ? (([behind, ahead]) => `ahead ${ahead}, behind ${behind}`)(counts.out.split(/\s+/))
    : 'no upstream';
  return `${branch} (${dirty}, ${tracking})`;
}

function syncRepo(repo, args) {
  const path = join(root, repo.dir);
  const label = repo.dir.padEnd(24);

  if (!existsSync(path)) {
    if (args.status) return console.log(`${label} not cloned`);
    console.log(`${label} cloning ${repo.url}${repo.branch ? ` (${repo.branch})` : ''}`);
    const cloneArgs = ['clone', ...(repo.branch ? ['--branch', repo.branch] : []), repo.url, repo.dir];
    const result = spawnSync('git', cloneArgs, { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`git clone failed for ${repo.dir}`);
    return;
  }

  if (!existsSync(join(path, '.git'))) throw new Error(`${repo.dir} exists but is not a git repo`);

  const origin = git(path, 'remote', 'get-url', 'origin').out;
  if (origin && origin !== repo.url) console.warn(`${label} warning: origin is ${origin}, repos.json says ${repo.url}`);

  if (args.pull && !args.status) {
    if (git(path, 'status', '--porcelain').out) {
      console.log(`${label} skipped pull (uncommitted changes)`);
    } else {
      const pulled = git(path, 'pull', '--ff-only');
      console.log(`${label} ${pulled.ok ? 'pulled' : `pull failed: ${pulled.err.split('\n')[0]}`}`);
    }
  }

  console.log(`${label} ${describe(path)}`);
}

const args = parseArgs(process.argv.slice(2));
const repos = loadRepos().filter((repo) => !args.only || args.only.has(repo.dir));

if (repos.length === 0) {
  console.log(args.only ? 'No repos in repos.json match --only.' : 'repos.json has no repos yet. Add entries like {"dir": "backend", "url": "git@github.com:org/backend.git"}.');
  process.exit(0);
}

let failed = 0;
for (const repo of repos) {
  try {
    syncRepo(repo, args);
  } catch (error) {
    failed++;
    console.error(`${repo.dir.padEnd(24)} error: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
