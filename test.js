let {parse, Reader} = require("./parse");

// var filePath = @.fs.resolvePath(__dirname, "romfs/bin/archive/pokemon/pm0000_00.gfpak");

var filePath = @.fs.resolvePath(__dirname, "pm0006_00.gfpak");

var package = parse(new Reader(@.fs.readFile.sync(filePath)), @.fs.extname(filePath));

@celebr("Package parsed");

// @dump(package.files.filter((x) => x.type === ".bin-18-some-like-file-list"));

