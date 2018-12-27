let Reader = require("./reader.js");

let parse = require("./parse.js");

var filePath = @.fs.resolvePath(__dirname, "romfs/bin/archive/pokemon/pm0004_00.gfpak");

// var filePath = @.fs.resolvePath(__dirname, "pm0006_00.gfpak");

var package = parse(new Reader(@.fs.readFile.sync(filePath)), @.fs.extname(filePath));

@warn("Package parsed");

// @dump(package.files.filter((x) => x.type === ".bin-18-some-like-file-list"));

