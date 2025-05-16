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
      exec: (file: string) => `tsx ${file}`,
      snippetRoot: (base: string) => path.join(base, 'examples/snippets/node'),
      glob: '**/*.{ts,mts}',
    },
    {
      name: 'python',
      exec: (file: string) => `poetry run python ${file}`,
      snippetRoot: (base: string) => path.join(base, 'examples/snippets/python'),
      glob: '**/*.py',
    },
  ],
};
