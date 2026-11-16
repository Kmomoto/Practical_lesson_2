const DEFAULTS = {
  registry: 'https://registry.npmjs.org',
  testMode: false,
  version: 'latest',
  maxDepth: 3,
  reverse: false,
  d2: true,
};

const FLAGS = new Map([
  ['--package', 'packageName'],
  ['--registry', 'registry'],
  ['--test-mode', 'testMode'],
  ['--repo-file', 'repoFile'],
  ['--version', 'version'],
  ['--max-depth', 'maxDepth'],
  ['--reverse', 'reverse'],
  ['--d2', 'd2'],
]);

function parseBoolean(value, option) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${option}: допустимы только true или false`);
}

function parseValue(key, value, flag) {
  if (key === 'testMode' || key === 'reverse' || key === 'd2') {
    return parseBoolean(value, flag);
  }
  if (key === 'maxDepth') {
    if (!/^\d+$/.test(value)) {
      throw new Error(`${flag}: глубина должна быть целым числом от 0`);
    }
    const depth = Number(value);
    if (!Number.isSafeInteger(depth)) {
      throw new Error(`${flag}: значение слишком велико`);
    }
    return depth;
  }
  return value;
}

export function parseOptions(args) {
  const options = { ...DEFAULTS };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const key = FLAGS.get(flag);
    if (!key) throw new Error(`Неизвестная опция: ${flag}`);
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Для опции ${flag} требуется значение`);
    }
    options[key] = parseValue(key, value, flag);
    index += 1;
  }

  if (options.testMode) {
    if (!options.repoFile) {
      throw new Error('--repo-file обязателен при --test-mode true');
    }
  } else {
    if (!options.packageName) {
      throw new Error(
        '--package обязателен в онлайн-режиме',
      );
    }
    let registry;
    try {
      registry = new URL(options.registry);
    } catch {
      throw new Error('--registry должен быть корректным URL');
    }
    if (!['http:', 'https:'].includes(registry.protocol)) {
      throw new Error('--registry должен использовать HTTP или HTTPS');
    }
  }
  if (options.testMode && !options.packageName) {
    throw new Error('--package обязателен в тестовом режиме');
  }
  if (!options.version.trim()) {
    throw new Error('--version не может быть пустым');
  }
  return options;
}
