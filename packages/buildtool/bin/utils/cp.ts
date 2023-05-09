import cp, { ChildProcess } from 'child_process';
import { cwd, webpackBuildSrc } from '../../webpack/utils/path.js';
import Webpack, { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import chalk from 'chalk';

export interface ProcessPromise<T> extends Promise<T> {
  abort (reason?: any): void;

  kill (signal: NodeJS.Signals | number): void;
}

export function spawn (name: string, args: string[], detached = false, env?: Record<string, string>) {
  const controller = new AbortController();
  let proc: ChildProcess | undefined;
  let promise = new Promise<void>((resolve, reject) => {
      proc = cp.spawn(name, args, {
        stdio: 'inherit',
        env,
        signal: controller.signal,
        detached,
      })
        .on('error', err => {
          reject(err);
        })
        .on('close', (code) => {
          if (!code) {
            resolve();
          } else {
            process.exit(code);
          }
        });
    },
  ) as ProcessPromise<void>;

  if (detached) {
    promise = promise.catch((err) => {
      if (err?.code === 'ABORT_ERR') {
        return;
      }
      throw err;
    }) as ProcessPromise<void>;
  }

  promise.abort = function (reason: any) {
    controller.abort(reason);
  };

  promise.kill = function (signal: NodeJS.Signals | number) {
    proc?.kill(signal);
  };

  return promise;
}

export async function webpack (config: string, env?: Record<string, string>) {
  console.log('[webpack]', config);

  const conf = (await import(webpackBuildSrc(`${config}.config.js`))).default;
  const clientConf = (await tryImport(`webpack.config.js`))?.default;
  return new Promise<void>((resolve, reject) => {
    Webpack(merge(conf, { ...clientConf }, {
      plugins: [
        new Webpack.EnvironmentPlugin(env ?? {}),
      ],
    } satisfies  Configuration), (err, stats) => {
      if (err) {
        reject(err);
      } else if (stats) {
        if (stats.hasWarnings()) {
          stats.compilation.getWarnings().forEach(warning => {
            console.warn(chalk.yellowBright(warning.message));
          });
        }
        if (stats.hasErrors()) {
          stats.compilation.getErrors().forEach(error => {
            console.error(chalk.redBright(error.message));
          });
        }
        resolve();
      }
    });
  });
}

export function tryImport (path: string) {
  return import(cwd(path)).catch(err => null);
}