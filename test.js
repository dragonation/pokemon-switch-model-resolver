let Reader = require("./reader.js");

let parse = require("./parse.js");

// var filePath = @.fs.resolvePath(__dirname, "romfs/bin/archive/pokemon/pm0004_00.gfpak");

var filePath = @.fs.resolvePath(__dirname, "pm0001_00.gfpak");

try {

    var package = parse(new Reader(@.fs.readFile.sync(filePath)), @.fs.extname(filePath));

    @.fs.writeFile.sync("test.json", JSON.stringify(package.files.filter((x) => x.type === ".bin-14-like-animation")[0].content));

    @warn("Package parsed");

} catch (error) {
    @error(error);
}


// @.fs.writeFile.sync("./anim.json", JSON.stringify(package.files.filter((x) => x.type === ".bin-18-like-animation")[0].content));

