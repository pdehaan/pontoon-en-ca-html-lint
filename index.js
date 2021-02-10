const fs = require("fs/promises");

const htmllint = require("htmllint");
const xml2js = require("xml2js");

main("./en-CA.all-projects.tmx");

async function main(tmxFile = "") {
  try {
    let $errors = [];
    const $body = await xml2json(tmxFile).then(r => r.tmx.body);
    for (const body of $body) {
      for (const tu of body.tu) {
        const id = tu.$.tuid;
        for (const tuv of tu.tuv) {
          const markup = tuv.seg.join("\n").trim();
          const locale = tuv.$["xml:lang"];
          if (locale !== "en-US") {
            try {
              const errors = await htmllinter(markup, { id, locale, markup });
              if (errors.length) {
                $errors.push(...errors);
              }
            } catch (err) {
              console.error(`${err} -- ${id}`);
              process.exitCode = 1;
            }
          }
        }
      }
      console.log(JSON.stringify($errors, null, 2));
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 2;
  }
}

async function xml2json(file = "") {
  const data = await fs.readFile(file, "utf-8");
  return xml2js.parseStringPromise(data);
}

async function htmllinter(html, obj = {}) {
  const htmllintOpts = {
    "attr-bans": false,
    "attr-name-style": false,
    "attr-no-dup": false,
    "attr-quote-style": false,
    "attr-req-value": false,
    "class-style": false,
    "html-valid-content-model": false,
    "id-class-style": false,
    "img-req-alt": false,
    "img-req-src": false,
    "indent-style": false,
    "indent-width": false,
    "label-req-for": false,
    "line-end-style": false,
    "line-no-trailing-whitespace": false,
    "link-req-noopener": false,
    "spec-char-escape": false,
    "tag-bans": false,
    // "tag-close": false, // Land of false positives ahoy!
    "tag-name-lowercase": false,
  };
  const errors = await htmllint(html, htmllintOpts);
  // Inject supplied `obj` properties into each error object.
  return errors.map((err) => Object.assign({}, err, obj));
}
