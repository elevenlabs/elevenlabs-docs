import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

import { config } from './config';

function getTargetPath(workspaceDir: string): string {
  return path.join(workspaceDir, 'fern/snippets/generated');
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createMdxContent(snippets: Record<string, string>): string {
  let mdxContent = '{/* This snippet was auto-generated */}\n<CodeBlocks>\n';

  // Python snippets always appear first
  if (snippets['python']) {
    mdxContent += `\`\`\`python\n${snippets['python']}\n\`\`\`\n\n`;
  }

  // Then add all other languages
  for (const [language, code] of Object.entries(snippets)) {
    if (language !== 'python' && code) {
      mdxContent += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
  }

  mdxContent += '</CodeBlocks>';
  return mdxContent;
}

export async function generateMdxFiles(workspaceDir: string): Promise<void> {
  const TARGET_PATH = getTargetPath(workspaceDir);

  ensureDir(TARGET_PATH);

  const snippetsMap: Record<string, Record<string, string>> = {};

  // Process each language
  for (const lang of config.languages) {
    const cwd = lang.snippetRoot(workspaceDir);
    const filePaths = glob.globSync(lang.glob, { cwd });

    for (const filePath of filePaths) {
      const fullPath = path.join(cwd, filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const fileName = path.basename(filePath, path.extname(filePath));

      if (!snippetsMap[fileName]) {
        snippetsMap[fileName] = {};
      }

      const langName = lang.name === 'node' ? 'typescript' : lang.name;
      snippetsMap[fileName][langName] = fileContent;
    }
  }

  // Generate MDX files
  for (const [fileName, langSnippets] of Object.entries(snippetsMap)) {
    const mdxPath = path.join(TARGET_PATH, `${fileName}.mdx`);
    fs.writeFileSync(mdxPath, createMdxContent(langSnippets));
  }

  console.log(`✅ MDX snippets generated in ${TARGET_PATH}`);
}

if (require.main === module) {
  // Find workspace directory (pnpm root)
  let workspaceDir = process.cwd();
  while (!fs.existsSync(path.join(workspaceDir, 'pnpm-lock.yaml'))) {
    const parentDir = path.dirname(workspaceDir);
    if (parentDir === workspaceDir) {
      throw new Error('Could not find pnpm workspace root directory');
    }
    workspaceDir = parentDir;
  }

  generateMdxFiles(workspaceDir).catch((error) => {
    console.error('Error generating MDX files:', error);
    process.exit(1);
  });
}
