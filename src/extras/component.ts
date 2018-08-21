let components;
import fs = require('fs');
import path = require('path');
import fsu = require('fs-util');
import dirs = require('../utils/dirs');
import config = require('../utils/config');

export default (components = []);

// - walk up dir tree searching for some `component.json` manifest file
// - if manifest is found, checks for a sibling `components` folder
// - if found, search for every `component.json` manifes file inside of it
// - returns the found manifests or an empty array
let find_manifests = function() {
  let base = path.join(dirs.pwd);

  while (base !== '/') {
    let manifest = path.join(base, 'component.json');

    if (fs.existsSync(manifest)) {
      let components_folder = path.join(base, 'components');
      if (fs.existsSync(components_folder)) {
        let manifests = fsu.find(components_folder, /component\.json/);
        return manifests;
      }
    }

    base = path.join(base, '..');
  }

  return [];
};

let manifests = find_manifests();

// registers all components with aliases
for (let manifest_path of Array.from(manifests)) {
  var manifest;
  let comp_folder = path.dirname(manifest_path);
  let { name } = (manifest = require(manifest_path));

  // creating component aliases
  config.alias[name] = dirs.relative(comp_folder);

  // fetching possible asset kinds
  let kinds = 'styles scripts templates fonts files images'.split(' ');
  for (let kind of Array.from(kinds)) {
    if (manifest[kind] != null) {
      for (let filepath of Array.from(manifest[kind])) {
        let abs = path.join(comp_folder, filepath);
        components.push(abs);
      }
    }
  }
}
