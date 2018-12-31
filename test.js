let Reader = require("./src/reader.js");

let parse = require("./src/parse.js");

// var filePath = @.fs.resolvePath(__dirname, "romfs/bin/archive/pokemon/pm0004_00.gfpak");

var filePath = @.fs.resolvePath(__dirname, "sample/pm0001_00.gfpak");

try {

    var package = parse(new Reader(@.fs.readFile.sync(filePath)), @.fs.extname(filePath));

    var folders = [];

    package.files.forEach((file) => {
        if (!folders[file.folder]) {
            folders[file.folder] = [];
        }
        folders[file.folder].push({
            "content": file.content,
            "flag": file.flag,
            "padding": file.padding,
            "type": file.type,
            "folder": file.folder
        });
    });

    @.fs.writeFile.sync("test.html", [
                        "<html>",
                        "    <script>",
                        "window.gfpak = " + JSON.stringify({
                            "file": @.fs.filename(filePath),
                            "folders": folders
                        }) + ";",
                        "console.log(window.gfpak);",
                        "console.log(window.gfpak.folders[1].filter((x) => x.type === \".gfbmdl\")[0].content);",
                        "    </script>",
                        "</html>"].join("\n"));

    @warn("Package parsed");

} catch (error) {
    @error(error);
}


// @.fs.writeFile.sync("./anim.json", JSON.stringify(package.files.filter((x) => x.type === ".bin-18-like-animation")[0].content));

