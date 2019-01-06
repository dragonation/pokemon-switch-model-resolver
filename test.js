let Reader = require("./src/reader.js");

let parse = require("./src/parse.js");

let fnv1a64 = require("./src/fnv1a64.js");

var catalogPath = @.fs.resolvePath(__dirname, "romfs/bin/pokemon/table/poke_resource_table.gfbpmcatalog");

var catalog = [];
try {
    catalog = parse(new Reader(@.fs.readFile.sync(catalogPath)), @.fs.extname(catalogPath));
} catch (error) {
    @error(error);
    return;
}

var filePath = @.fs.resolvePath(__dirname, "romfs/bin/archive/pokemon/pm0005_00.gfpak");

try {

    var package = parse(new Reader(@.fs.readFile.sync(filePath)), @.fs.extname(filePath));

    var folders = [];

    package.files.forEach((file) => {

        if (!folders[file.folder]) {
            folders[file.folder] = {
                "nameHash": package.folders[file.folder].hash,
                "files": []
            };
        }

        folders[file.folder].files.push({
            "content": file.content,
            "type": file.type,
            "pathHash": file.hash,
            "nameHash": package.folders[file.folder].files[folders[file.folder].files.length].hash
        });

    });

    var fileName = @.fs.filename(filePath);

    var possibleFileNames = Object.create(null);
    var possibleFolderNames = Object.create(null);

    catalog.filter((record) => @.fs.filename(record.packageFile) === fileName).forEach((record) => {
        possibleFileNames[@.fs.filename(record.configPath)] = true;
        possibleFolderNames[@.fs.dirname(record.configPath)] = true;
        possibleFileNames[@.fs.filename(record.modelPath)] = true;
        possibleFolderNames[@.fs.dirname(record.modelPath)] = true;
        record.animations.forEach((animation) => {
            possibleFileNames[@.fs.filename(animation.configPath)] = true;
            possibleFolderNames[@.fs.dirname(animation.configPath)] = true;
        });
    });

    possibleFileNames = Object.keys(possibleFileNames);
    possibleFolderNames = Object.keys(possibleFolderNames);

    folders.forEach((folder) => {

        possibleFolderNames.forEach((folderName) => {
            if (folder.nameHash.slice(-6) === fnv1a64.suffix(folderName + "/")) {
                folder.name = folderName;
                @info("Match folder " + folderName + " to " + folder.nameHash);
            }
        });

        folder.files.forEach((file) => {
            switch (file.type) {
                case ".gfbanm": {
                    if (file.nameHash.slice(-6) === fnv1a64.suffix(@.fs.basename(fileName) + ".gfbanm")) {
                        file.name = @.fs.basename(fileName) + ".gfbanm";
                        @info("Match file " + file.name + " to " + file.pathHash + file.type);
                    }
                    break;
                };
                case ".gfbanmcfg": {
                    file.content.animations.forEach((animation) => {
                        let suffix = fnv1a64.suffix(animation.file);
                        let matches = folder.files.filter((file) => {
                            return (file.nameHash.slice(-6) === suffix);
                        });
                        if (matches.length > 1) {
                            @warn("Duplicated file with the same hash suffix: " + suffix + "[" + animation.file + "]");
                        } else if (matches.length === 1) {
                            if (!matches[0].name) {
                                matches[0].name = animation.file;
                                @info("Match file " + matches[0].name + " to " + matches[0].pathHash + matches[0].type);
                            }
                        } else {
                            @warn("No file with the hash suffix match: " + suffix + "[" + animation.file + "]");
                        }
                    });
                    possibleFileNames.forEach((fileName) => {
                        if (file.nameHash.slice(-6) === fnv1a64.suffix(fileName)) {
                            file.name = fileName;
                            @info("Match file " + fileName + " to " + file.pathHash + file.type);
                        }
                    });
                    break;
                };
                case ".gfbmdl": {
                    file.content.textures.forEach((texture) => {
                        let suffix = fnv1a64.suffix(texture + ".bntx");
                        let matches = folder.files.filter((file) => {
                            return (file.nameHash.slice(-6) === suffix);
                        });
                        if (matches.length > 1) {
                            @warn("Duplicated file with the same hash suffix: " + suffix + "[" + texture + ".bntx]");
                        } else if (matches.length === 1) {
                            if (!matches[0].name) {
                                matches[0].name = texture + ".bntx";
                                @info("Match file " + matches[0].name + " to " + matches[0].pathHash + matches[0].type);
                            }
                        } else {
                            @warn("No file with the hash suffix match: " + suffix + "[" + texture + ".bntx]");
                        }
                    });
                    file.content.shaders.forEach((shader) => {
                        [".bnsh_vsh", ".bnsh_fsh"].forEach((extname) => {
                            var suffix = fnv1a64.suffix(shader + extname);
                            let matches = folder.files.filter((file) => {
                                return (file.nameHash.slice(-6) === suffix);
                            });
                            if (matches.length > 1) {
                                @warn("Duplicated file with the same hash suffix: " + suffix + "[" + shader + extname + "]");
                            } else if (matches.length === 1) {
                                if (!matches[0].name) {
                                    matches[0].name = shader + extname;
                                    @info("Match file " + matches[0].name + " to " + matches[0].pathHash + matches[0].type);
                                }
                            } else {
                                @warn("No file with the hash suffix match: " + suffix + "[" + shader + extname + "]");
                            }
                        });
                    });
                    possibleFileNames.forEach((fileName) => {
                        if (file.nameHash.slice(-6) === fnv1a64.suffix(fileName)) {
                            file.name = fileName;
                            @info("Match file " + fileName + " to " + file.pathHash + file.type);
                        }
                    });
                    break;
                };
                case ".gfbpokecfg": {
                    possibleFileNames.forEach((fileName) => {
                        if (file.nameHash.slice(-6) === fnv1a64.suffix(fileName)) {
                            file.name = fileName;
                            @info("Match file " + fileName + " to " + file.pathHash + file.type);
                        }
                    });
                    break;
                };
                default: {
                    break;
                }
            }
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
                        "console.log(window.gfpak.folders[1].files.filter((x) => x.type === \".gfbmdl\")[0].content);",
                        "    </script>",
                        "</html>"].join("\n"));

    @warn("Package parsed");

} catch (error) {
    @error(error);
}


// @.fs.writeFile.sync("./anim.json", JSON.stringify(package.files.filter((x) => x.type === ".bin-18-like-animation")[0].content));

