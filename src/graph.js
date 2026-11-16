export function buildGraph(repository, root, maxDepth) {
  const graph = new Map();
  const visited = new Set([root]);
  const queue = [{ name: root, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    const dependencies = current.depth >= maxDepth
      ? []
      : (repository.get(current.name) ?? []);
    graph.set(current.name, [...dependencies]);
    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        visited.add(dependency);
        queue.push({ name: dependency, depth: current.depth + 1 });
      }
    }
  }
  return graph;
}

export function findReverseDependencies(graph, target) {
  const reverse = new Map();
  for (const [name, dependencies] of graph) {
    for (const dependency of dependencies) {
      if (!reverse.has(dependency)) reverse.set(dependency, []);
      reverse.get(dependency).push(name);
    }
  }

  const found = new Set();
  const queue = [...(reverse.get(target) ?? [])];
  while (queue.length > 0) {
    const name = queue.shift();
    if (name === target || found.has(name)) continue;
    found.add(name);
    queue.push(...(reverse.get(name) ?? []));
  }
  return [...found].sort();
}
