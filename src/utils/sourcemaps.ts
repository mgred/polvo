import * as path from 'path';
import * as fs from 'fs';
import * as dirs from './dirs';
import * as config from './config';

export function assemble(files) {

  // main source map root node
  let map = {
    version: 3,
    file: path.basename(config.output.js),
    sections: []
  };

  for (let file of Array.from(files)) {

    // source map sections (file's nodes)
    if (file.source_map != null) {
      map.sections.push({
        offset: {
          line: file.source_map_offset,
          column: 0
        },
        map: {
          version: 3,
          file: 'app.js',
          sources: [dirs.relative(file.filepath)],
          sourcesContent: [file.raw],
          names: [],
          mappings: JSON.parse(file.source_map).mappings
        }
      });
    }
  }

  return JSON.stringify(map);
}

export function encode_base64(map) {
  return new Buffer(map).toString('base64');
}
