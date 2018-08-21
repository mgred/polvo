export interface Config {
  alias?: {[key: string]: string};
  boot?: string;
  input?: string[];
  output?: {js?: string, css?: string};
  minify?: {js?: boolean, css?: boolean};
  server: {port?: number, root?: string};
}
