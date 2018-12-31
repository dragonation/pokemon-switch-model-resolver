var Reader = require("./reader.js");

var { guessFileType } = require("./magic.js");

var lz4 = require("./lz4.js");

var parse = function (reader, parse) {

    var origin = reader;

    reader = reader.snapshot();

    var result = {

    };

    var signature = String.fromCharCode.apply(String, reader.readBLOB(8));
    if (signature !== "GFLXPACK") {
        throw new Error("Invalid Game freak package");
    }

    result.signature = signature;
    result.version = reader.readUInt32();
    result.padding = reader.readUInt32();
    result.layouts = {
        "files": reader.readUInt32(),
        "folders": reader.readUInt32(),
        "contentOffset": reader.readUInt64(),
        "hashOffset": reader.readUInt64(),
        "folderOffsets": []
    };

    var looper = 0;
    while (looper < result.layouts.folders) {
        result.layouts.folderOffsets.push(reader.readUInt64());
        ++looper;
    }

    if (result.layouts.hashOffset !== reader.offset) {
        throw new Error("Extra data found before hashes");
    }

    var hashes = [];
    result.hashes = hashes;

    var looper = 0;
    while (looper < result.layouts.files) {
        hashes.push(reader.readHash64());
        ++looper;
    }

    var fileFolders = Object.create(null);

    var arrangements = [];
    result.arrangements = arrangements;

    var looper = 0;
    while (looper < result.layouts.folders) {

        if (result.layouts.folderOffsets[looper] !== reader.offset) {
            throw new Error("Extra data found before folder hashes");
        }

        var folder = {
            "hash": reader.readHash64(),
            "fileCount": reader.readUInt32(),
            "flag": reader.readUInt32(),
            "type": "folder",
            "files": []
        };

        arrangements.push(folder);

        var looper2 = 0;
        while (looper2 < folder.fileCount) {

            var file = {
                "hash": reader.readHash64(),
                "index": reader.readUInt32(),
                "flag": reader.readUInt32(),
                "folder": looper,
                "type": "file"
            };

            fileFolders[file.index] = looper;

            folder.files.push(file);

            ++looper2;
        }

        ++looper;
    }

    if (result.layouts.contentOffset !== reader.offset) {
        throw new Error("Extra data found before file contents");
    }

    result.files = [];

    var looper = 0;
    while (looper < result.layouts.files) {

        var file = {
            "folder": fileFolders[looper],
            "flag": reader.readUInt16(),
            "compressionType": reader.readUInt16(),
            "decompressedSize": reader.readUInt32(),
            "compressedSize": reader.readUInt32(),
            "padding": reader.readUInt32(),
            "bufferOffset": reader.readUInt64(),
        };

        var fileReader = origin.snapshot(file.bufferOffset);
        file.compressedData = fileReader.readBLOB(file.compressedSize);
        if (file.compressionType === 2) {
            file.decompressedData = Buffer.alloc(file.decompressedSize);
            if (lz4(file.compressedData, file.decompressedData) !== file.decompressedSize) {
                throw new Error("Invalid LZ4 compressed data");
            }
        } else {
            throw new Error("Invalid compression type");
        }

        file.type = guessFileType(new Reader(file.decompressedData));
        file.content = parse(new Reader(file.decompressedData), file.type);

        result.files.push(file);

        ++looper;
    }

    return result;

};

module.exports = parse;
