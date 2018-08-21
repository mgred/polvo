export enum Target {
  JS = 'js',
  CSS = 'css',
}

interface Module {
  output: Target;
  source: string;
}

export function build(target: Target, files: Array<string>) {
  // gather all plugins compiling to `target`

  // parse conditionals

  // compile source code

  // return
}

export function release() {}
