import path from 'path';

export interface Language {
  name: string;
  exec: (file: string) => string;
  snippetRoot: (base: string) => string;
  glob: string;
}

export const config: {
  languages: Language[];
} = {
  languages: [
    {
      name: 'node',
      // Parse TypeScript without executing it
      exec: (file: string) =>
        `tsc --module nodenext --target es2020 --skipLibCheck --noEmit ${file}`,
      snippetRoot: (base: string) => path.join(base, 'examples/snippets/node'),
      glob: '**/*.{ts,mts}',
    },
    {
      name: 'python',
      // Check Python syntax without running the snippet
      exec: (file: string) => `python -m py_compile ${file}`,
      snippetRoot: (base: string) => path.join(base, 'examples/snippets/python'),
      glob: '**/*.py',
    },
  ],
};
