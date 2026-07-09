import Module from 'node:module';
import path from 'node:path';

process.env.NODE_PATH = [path.resolve('node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();

const { ESLint } = await import('eslint');

const targets = ['src', 'next.config.ts', 'tailwind.config.ts', 'postcss.config.mjs'];

const eslint = new ESLint({
  errorOnUnmatchedPattern: false,
});

const results = await eslint.lintFiles(targets);
const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);

if (output) {
  console.log(output);
}

const errorCount = results.reduce((total, result) => total + result.errorCount, 0);

if (errorCount > 0) {
  process.exitCode = 1;
}
