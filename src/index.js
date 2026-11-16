import { parseOptions } from './options.js';
import { loadGraph } from './repository.js';
import { buildGraph, findReverseDependencies } from './graph.js';
import { toD2 } from './d2.js';

async function main() {
  const options = parseOptions(process.argv.slice(2));
  for (const [key, value] of Object.entries(options)) {
    console.log(`${key}: ${value}`);
  }

  const repository = await loadGraph(options);
  if (!repository.has(options.packageName)) {
    throw new Error(`Пакет «${options.packageName}» не найден в источнике`);
  }
  const direct = repository.get(options.packageName);
  console.log(`Прямые зависимости ${options.packageName}:`);
  console.log(direct.length ? direct.join(', ') : '(нет)');

  const graph = buildGraph(repository, options.packageName, options.maxDepth);
  console.log('Рёбра графа:');
  for (const [name, dependencies] of graph) {
    for (const dependency of dependencies) {
      console.log(`${name} -> ${dependency}`);
    }
  }

  if (options.reverse) {
    const reverse = findReverseDependencies(graph, options.packageName);
    console.log(`Обратные зависимости ${options.packageName}:`);
    console.log(reverse.length ? reverse.join(', ') : '(нет)');
  }
  if (options.d2) {
    console.log('Описание D2:');
    console.log(toD2(graph));
  }
}

main().catch((error) => {
  console.error(`Ошибка: ${error.message}`);
  process.exitCode = 1;
});
