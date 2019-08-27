const minify = require('@node-minify/core');
const htmlMinifier = require('@node-minify/html-minifier');
const terser = require('@node-minify/terser');
const sqwish = require('@node-minify/sqwish');

function partition(array, isValid) {
  return array.reduce(([pass, fail], elem) => {
    return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);
}

const fs = require('fs'), path = require('path');

function del(x) {
  return new Promise((resolve, reject) => {
    require('rimraf')(x, err => {
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = async function() {
  try {
    console.log('Deleting previous app contents');
    await del(path.resolve(__dirname + '\\..\\..\\app\\**\\!(package.json)'));
  }
  catch(err) {
    console.error(err);
  }

  const js = require('glob').sync(path.join(path.resolve(__dirname + '\\..\\..\\src\\**'), '\\*.js'));
  const css = require('glob').sync(path.join(path.resolve(__dirname + '\\..\\..\\src\\**'), '\\*.css'));
  const html = require('glob').sync(path.join(path.resolve(__dirname + '\\..\\..\\src\\**'), '\\*.html'));

  const others = require('glob').sync(path.join(path.resolve(__dirname + '\\..\\..\\src\\**'), '\\*.!(js|css|html)'));

  console.dir(js);
  console.dir(css);
  console.dir(html);
  console.dir(others);

  console.log('>> Copying miscelleanous files');
  for (let file of others) {
    console.log('Copying file', file);

    await fs.mkdirSync(path.resolve(path.dirname(file.replace('src', "app"))), { recursive: true });
    await fs.promises.copyFile(path.resolve(file), path.resolve(file.replace('src', "app")));
  }

  console.log('>> Minifying JS files');
  for (let file of js) {
    console.log('Treating file', file);

    await fs.mkdirSync(path.resolve(path.dirname(file.replace('src', "app"))), { recursive: true });
    await minify({
      compressor: terser,
      input: path.resolve(file),
      output: path.resolve(file.replace('src', "app"))
    });
  }

  console.log('>> Minifying HTML files');
  for (let file of html) {
    console.log('Treating file', file);

    await fs.mkdirSync(path.resolve(path.dirname(file.replace('src', "app"))), { recursive: true });
    await minify({
      compressor: htmlMinifier,
      input: path.resolve(file),
      output: path.resolve(file.replace('src', "app")),
    });
  }

  console.log('>> Minifying CSS files');
  for (let file of css) {
    console.log('Treating file', file);

    await fs.mkdirSync(path.resolve(path.dirname(file.replace('src', "app"))), { recursive: true });
    await minify({
      compressor: sqwish,
      type: 'css',
      input: path.resolve(file),
      output: path.resolve(file.replace('src', "app")),
    });
  }
}
