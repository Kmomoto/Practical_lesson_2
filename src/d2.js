function quote(value) {
  return JSON.stringify(value);
}

export function toD2(graph) {
  const lines = [];
  for (const [name, dependencies] of graph) {
    if (dependencies.length === 0) lines.push(`${quote(name)}: {}`);
    for (const dependency of dependencies) {
      lines.push(`${quote(name)} -> ${quote(dependency)}`);
    }
  }
  return lines.join('\n');
}
