import { readFile } from 'node:fs/promises';

function normalizeGraph(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('корень JSON должен быть объектом пакетов');
  }
  const graph = new Map();
  for (const [name, dependencies] of Object.entries(input)) {
    if (!/^[A-Z]+$/.test(name)) {
      throw new Error(
        `имя «${name}» должно состоять из заглавных латинских букв`,
      );
    }
    const invalidDependencies = !Array.isArray(dependencies)
      || dependencies.some((item) => !/^[A-Z]+$/.test(item));
    if (invalidDependencies) {
      throw new Error(
        `зависимости «${name}» должны быть заглавными латинскими буквами`,
      );
    }
    graph.set(name, [...new Set(dependencies)]);
  }
  return graph;
}

async function loadTestGraph(filePath) {
  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(
      `не удалось прочитать файл «${filePath}»: ${error.message}`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`ошибка JSON в «${filePath}»: ${error.message}`);
  }
  return normalizeGraph(parsed);
}

function encodePackage(name) {
  return name.split('/').map(encodeURIComponent).join('/');
}

async function fetchPackage(registry, name, version) {
  const url = `${registry.replace(/\/$/, '')}/${encodePackage(name)}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(`ошибка запроса к ${url}: ${error.message}`);
  }
  if (!response.ok) {
    throw new Error(
      `реестр вернул HTTP ${response.status} для пакета «${name}»`,
    );
  }
  const metadata = await response.json();
  const selectedVersion = version === 'latest'
    ? metadata['dist-tags']?.latest
    : version;
  const release = metadata.versions?.[selectedVersion];
  if (!release) {
    throw new Error(
      `версия «${selectedVersion ?? version}» пакета «${name}» не найдена`,
    );
  }
  return release.dependencies ?? {};
}

async function loadOnlineGraph(options) {
  const graph = new Map();
  const visited = new Set([options.packageName]);
  const queue = [{ name: options.packageName, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= options.maxDepth) {
      graph.set(current.name, []);
      continue;
    }
    const dependencies = await fetchPackage(
      options.registry,
      current.name,
      current.name === options.packageName ? options.version : 'latest',
    );
    const names = Object.keys(dependencies).sort();
    graph.set(current.name, names);
    for (const name of names) {
      if (!visited.has(name)) {
        visited.add(name);
        queue.push({ name, depth: current.depth + 1 });
      }
    }
  }
  return graph;
}

export async function loadGraph(options) {
  if (options.testMode) return loadTestGraph(options.repoFile);
  return loadOnlineGraph(options);
}

export async function fetchDependencies(registry, packageName, version) {
  return fetchPackage(registry, packageName, version);
}
