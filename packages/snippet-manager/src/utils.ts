// import * as childProcess from 'child_process'; // Unused import
import { ExecException, exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const promisifiedExec = promisify(exec);

export interface ExecResult {
  error: ExecException | null;
  stdout: string;
  stderr: string;
}

export const findAndReplace = async (paths: string[], find: RegExp, replace: string) => {
  await Promise.all(
    paths.map(async (path) => {
      const file = await fs.promises.readFile(path);
      const content = file.toString();
      const newContent = content.replace(find, replace);
      await fs.promises.writeFile(path, newContent);
    })
  );
};

export async function execCmd(cmd: string, cwd: string): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await promisifiedExec(cmd, {
      cwd,
      env: process.env,
    });
    return { error: null, stdout, stderr };
  } catch (error) {
    // Check if it's an ExecException which contains stdout/stderr
    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const execError = error as ExecException;
      return { error: execError, stdout: execError.stdout ?? '', stderr: execError.stderr ?? '' };
    } else if (error instanceof Error) {
      // Handle other types of errors (less likely from exec)
      return { error: new Error(error.message) as ExecException, stdout: '', stderr: '' }; // Cast needed, might not have code
    } else {
      // Handle non-Error throws
      return {
        error: new Error('Unknown execution error') as ExecException,
        stdout: '',
        stderr: '',
      };
    }
  }
}

export const getFilesByExtension = async (base: string, extension: string): Promise<string[]> => {
  const list = await fs.promises.readdir(base);
  const all = await Promise.all(
    list.flatMap((file) => {
      const filepath = `${base}/${file}`;

      if (fs.statSync(filepath).isDirectory()) {
        return getFilesByExtension(filepath, extension);
      } else if (file.endsWith(extension)) {
        return filepath;
      }

      return [];
    })
  );

  return all.flat();
};

export const execTypescriptFile = async (projectRoot: string, file: string) => {
  const cmd = `npx ts-node ${file}`;
  return execCmd(cmd, projectRoot);
};

export const execJavaFile = async (projectRoot: string, file: string) => {
  const cmd = `java ${file}`;
  return execCmd(cmd, projectRoot);
};

export const execPythonFile = async (projectRoot: string, file: string) => {
  const cmd = `python ${file}`;
  return execCmd(cmd, projectRoot);
};

export const execGoFile = async (projectRoot: string, file: string) => {
  const cmd = `go run ${file}`;
  return execCmd(cmd, projectRoot);
};
