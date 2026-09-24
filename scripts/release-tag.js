// npm run release:tag -- <version> [--dry-run] [--skip-build]
// Готовит CI-релиз (вариант 2): проверки -> бамп version -> коммит -> тег vX.Y.Z -> push.
// Саму сборку и публикацию делает workflow .github/workflows/release.yml по push тега.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function sh(cmd, args, opts) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...(opts || {}) }).trim();
}

function fail(msg) {
  console.error(`release-tag: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { version: null, dryRun: false, skipBuild: false };
  for (const a of argv) {
    if (a === '--') continue; // разделитель npm run ... -- args
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--skip-build') out.skipBuild = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: npm run release:tag -- <version> [--dry-run] [--skip-build]');
      console.log('  version: X.Y.Z или vX.Y.Z, должен быть выше текущей в package.json');
      process.exit(0);
    } else if (!a.startsWith('-') && !out.version) {
      out.version = a;
    } else {
      fail(`неизвестный аргумент: ${a}`);
    }
  }
  return out;
}

function parseSemver(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], text: `${m[1]}.${m[2]}.${m[3]}` };
}

function cmpSemver(a, b) {
  for (const k of ['major', 'minor', 'patch']) {
    if (a[k] !== b[k]) return a[k] - b[k];
  }
  return 0;
}

function main() {
  const root = path.join(__dirname, '..');
  const { version, dryRun, skipBuild } = parseArgs(process.argv.slice(2));
  if (!version) fail('укажи версию: npm run release:tag -- 2.2.0 [--dry-run]');

  const next = parseSemver(version);
  if (!next) fail(`"${version}" — не semver X.Y.Z`);

  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const current = parseSemver(String(pkg.version || ''));
  if (!current) fail(`текущая version в package.json некорректна: ${pkg.version}`);
  if (cmpSemver(next, current) <= 0) {
    fail(`новая версия ${next.text} должна быть выше текущей ${current.text}`);
  }
  const tag = `v${next.text}`;

  // 1. Git чистый
  let status;
  try {
    status = sh('git', ['status', '--porcelain'], { cwd: root });
  } catch (e) {
    fail('git недоступен или это не git-репозиторий.');
  }
  if (status) fail(`рабочая копия не чистая:\n${status}`);

  // 2. Ветка (не detached)
  let branch;
  try {
    branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  } catch (e) {
    fail('не удалось определить текущую ветку.');
  }
  if (!branch || branch === 'HEAD') fail('detached HEAD — переключись на ветку.');

  // 3. Тег еще не существует (локально и в origin)
  let localTag = '';
  try {
    localTag = sh('git', ['rev-parse', '--verify', `refs/tags/${tag}`], { cwd: root });
  } catch (e) { /* нет тега — нормально */ }
  if (localTag) fail(`тег ${tag} уже существует локально.`);
  let remoteTags = '';
  try {
    remoteTags = sh('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`], { cwd: root });
  } catch (e) {
    fail('не удалось проверить теги в origin (нет сети/доступа).');
  }
  if (remoteTags) fail(`тег ${tag} уже существует в origin.`);

  console.log(`release-tag: ${current.text} -> ${next.text}, ветка ${branch}, тег ${tag}${dryRun ? ' [dry-run]' : ''}`);

  // 4. Gate: сборка должна быть зеленой
  if (!skipBuild) {
    console.log('release-tag: gate: npm run build:win:dir ...');
    if (dryRun) {
      console.log('release-tag: [dry-run] пропустил бы запуск только при --skip-build; gate выполняется и в dry-run.');
    }
    const r = spawnSync('npm', ['run', 'build:win:dir'], { cwd: root, stdio: 'inherit', shell: true });
    if (r.status !== 0) fail('gate-сборка build:win:dir упала — релиз остановлен.');
  }

  const plan = [
    `package.json version: ${current.text} -> ${next.text} (+ package-lock.json)`,
    `git commit: "Release ${tag}"`,
    `git tag -a ${tag}`,
    `git push origin ${branch}`,
    `git push origin ${tag}  (дальше CI соберет NSIS и опубликует Release)`,
  ];
  if (dryRun) {
    console.log('release-tag: [dry-run] план (ничего не меняю):');
    for (const p of plan) console.log(`  - ${p}`);
    return;
  }

  // 5. Бамп версий
  pkg.version = next.text;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  const lockPath = path.join(root, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    try {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      lock.version = next.text;
      if (lock.packages && lock.packages['']) lock.packages[''].version = next.text;
      fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
    } catch (e) {
      fail(`не смог обновить package-lock.json: ${e.message}`);
    }
  }

  // 6. Коммит + тег + push
  try {
    sh('git', ['add', 'package.json', 'package-lock.json'], { cwd: root });
    sh('git', ['commit', '-m', `Release ${tag}`], { cwd: root });
    sh('git', ['tag', '-a', tag, '-m', tag], { cwd: root });
    sh('git', ['push', 'origin', branch], { cwd: root });
    sh('git', ['push', 'origin', tag], { cwd: root });
  } catch (e) {
    fail(`git-операция упала: ${e.message}\nПроверь состояние вручную: git status / git tag.`);
  }

  console.log(`release-tag: готово — ${tag} запушен. Следи за Actions -> release, затем проверь latest.yml в Releases.`);
}

main();
