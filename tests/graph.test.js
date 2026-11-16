import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, findReverseDependencies } from '../src/graph.js';
import { toD2 } from '../src/d2.js';
import { parseOptions } from '../src/options.js';

test('BFS handles cycles and visits a node once', () => {
  const repository = new Map([
    ['A', ['B', 'C']],
    ['B', ['C']],
    ['C', ['A', 'D']],
    ['D', []],
  ]);
  const graph = buildGraph(repository, 'A', 5);
  assert.deepEqual([...graph.keys()], ['A', 'B', 'C', 'D']);
});

test('maximum depth limits expansion', () => {
  const repository = new Map([['A', ['B']], ['B', ['C']], ['C', []]]);
  assert.deepEqual([...buildGraph(repository, 'A', 1)], [
    ['A', ['B']],
    ['B', []],
  ]);
});

test('reverse traversal finds transitive dependents', () => {
  const graph = new Map([['A', ['B']], ['B', ['C']], ['C', []]]);
  assert.deepEqual(findReverseDependencies(graph, 'C'), ['A', 'B']);
});

test('D2 contains directed edges', () => {
  assert.equal(toD2(new Map([['A', ['B']]])), '"A" -> "B"');
});

test('CLI rejects invalid depth and accepts test options', () => {
  assert.throws(() => parseOptions([
    '--package', 'A', '--max-depth', '-1',
  ]));
  const options = parseOptions([
    '--test-mode', 'true', '--repo-file', 'graph.json', '--package', 'A',
  ]);
  assert.equal(options.maxDepth, 3);
});
