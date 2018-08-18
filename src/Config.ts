export interface Config {
  alias?: {[key: string]: string};
  boot: string;
  input: string[];
  output: {js?: string, css?: string};
  server?: {port: number, root: string};
}
