let Reader = require("./reader.js");

let parse = require("./parse.js");

var filePath = @.fs.resolvePath(__dirname, "romfs/bin/archive/pokemon/pm0892_00.gfpak");

// var filePath = @.fs.resolvePath(__dirname, "pm0006_00.gfpak");

try {

    var package = parse(new Reader(@.fs.readFile.sync(filePath)), @.fs.extname(filePath));

    @.fs.writeFile.sync("test.json", JSON.stringify(package.files.filter((x) => x.type === ".bin-14-like-animation")[0].content));

    @warn("Package parsed");

} catch (error) {
    @error(error);
}


// @dump(package.files.filter((x) => x.type === ".bin-18-some-like-file-list"));

