var Reader = function Reader(buffer, offset) {

    this.buffer = buffer;
    this.offset = offset;
    if (!this.offset) {
        this.offset = 0;
    }

};

Reader.prototype.snapshot = function (offset) {

    return new Reader(this.buffer, arguments.length > 0 ? offset : this.offset);

};

Reader.prototype.readInt64 = function () {

    var result = this.buffer.readInt32LE(this.offset) | (this.buffer.readInt32LE(this.offset + 4) << 32);

    this.offset += 8;

    return result;

};

Reader.prototype.readUInt64 = function () {

    var result = this.readUInt64As32x2();

    return result[0] | (result[1] << 32);

};

Reader.prototype.readUInt64As32x2 = function () {

    var low = this.buffer.readUInt32LE(this.offset);
    var high = this.buffer.readUInt32LE(this.offset + 4);

    this.offset += 8;

    return [low, high];

};

Reader.prototype.readHash64 = function () {

    var result = this.readUInt64As32x2();

    return ("00000000" + result[1].toString(16)).slice(-8) + ("00000000" + result[0].toString(16)).slice(-8);

};

Reader.prototype.readUInt8 = function () {

    var result = this.buffer.readUInt8(this.offset);

    ++this.offset;

    return result;

};

Reader.prototype.readUInt16 = function () {

    var result = this.buffer.readUInt16LE(this.offset);

    this.offset += 2;

    return result;

};

Reader.prototype.readFloat32 = function () {

    var result = this.buffer.readFloatLE(this.offset);

    this.offset += 4;

    return result;

};

Reader.prototype.readUInt32 = function () {

    var result = this.buffer.readUInt32LE(this.offset);

    this.offset += 4;

    return result;

};

Reader.prototype.readInt32 = function () {

    var result = this.buffer.readInt32LE(this.offset);

    this.offset += 4;

    return result;

};

Reader.prototype.readBLOB = function (size) {

    var result = this.buffer.slice(this.offset, this.offset + size);

    this.offset += size;

    return result;

};

Reader.prototype.isEnded = function () {

    return this.offset >= this.buffer.length;

};

Reader.prototype.readString = function () {

    var length = arguments[0];
    if (arguments.length === 0) {
        length = this.readUInt32();
    }

    var chars = [];
    var looper = 0;
    while (looper < length) {
        chars.push(this.readUInt8());
        ++looper;
    }

    while (chars[chars.length - 1] === 0) {
        chars.pop();
    }

    return String.fromCharCode.apply(String, chars);

};

Reader.prototype.skipPadding = function (base, value) {

    while (this.offset % base !== 0) {
        var byte = this.readUInt8();
        if ((arguments.length > 1) && (byte !== value)) {
            throw new Error("Invalid padding, get " + ("0" + byte.toString(16)).slice(-2) + ", expected " + ("0" + value.toString(16)).slice(-2));
        }
    }

};

var decodeLZ4 = function (input, output, sIdx, eIdx) {
    sIdx = sIdx || 0
    eIdx = eIdx || (input.length - sIdx)
    // Process each sequence in the incoming data
    for (var i = sIdx, n = eIdx, j = 0; i < n;) {
        var token = input[i++]

        // Literals
        var literals_length = (token >> 4)
        if (literals_length > 0) {
            // length of literals
            var l = literals_length + 240
            while (l === 255) {
                l = input[i++]
                literals_length += l
            }

            // Copy the literals
            var end = i + literals_length
            while (i < end) output[j++] = input[i++]

            // End of buffer?
            if (i === n) return j
        }

        // Match copy
        // 2 bytes offset (little endian)
        var offset = input[i++] | (input[i++] << 8)

        // 0 is an invalid offset value
        if (offset === 0 || offset > j) return -(i-2)

        // length of match copy
        var match_length = (token & 0xf)
        var l = match_length + 240
        while (l === 255) {
            l = input[i++]
            match_length += l
        }

        // Copy the match
        var pos = j - offset // position of the match copy in the current output
        var end = j + match_length + 4 // minmatch = 4
        while (j < end) output[j++] = output[pos++]
    }

    return j
};

var guessFileType = function (reader) {

    // var signature = reader.snapshot().readBLOB(8);
    var signature = Array.prototype.slice.call(reader.snapshot().readBLOB(32), 0).map((x) => ("0" + x.toString(16)).slice(-2)).join("").replace(/[0-9a-f]{8}/g, (x) => " " + x).trim();

    var reader = reader.snapshot();

    var data = [];
    var looper = 0;
    while ((looper < 8) && (data[data.length - 1] !== 0)) {
        data.push(reader.readUInt8());
        ++looper;
    }
    if (data[data.length - 1] === 0) {
        data.pop();
    }
    data = String.fromCharCode.apply(String, data);

    var type = ".bin";
    switch (data) {
        case "SARC": { type = ".sarc"; break; };
        case "Yaz": { type = ".szs"; break; };
        case "YB": { type = ".byaml"; break; };
        case "BY": { type = ".byaml"; break; };
        case "FRES": { type = ".bfres"; break; };
        case "Gfx2": { type = ".gtx"; break; };
        case "FLYT": { type = ".bflyt"; break; };
        case "CLAN": { type = ".bclan"; break; };
        case "CLYT": { type = ".bclyt"; break; };
        case "FLIM": { type = ".bclim"; break; };
        case "FLAN": { type = ".bflan"; break; };
        case "VFXB": { type = ".pctl"; break; };
        case "AAHS": { type = ".sharc"; break; };
        case "BAHS": { type = ".sharcb"; break; };
        case "BNTX": { type = ".bntx"; break; };
        case "BNSH": { type = ".bnsh"; break; };
        case "FSHA": { type = ".bfsha"; break; };
        case "FFNT": { type = ".bffnt"; break; };
        case "CFNT": { type = ".bcfnt"; break; };
        case "CSTM": { type = ".bcstm"; break; };
        case "FSTM": { type = ".bfstm"; break; };
        case "STM": { type = ".bfsha"; break; };
        case "STM": { type = ".bfsha"; break; };
        case "CWAV": { type = ".bcwav"; break; };
        case "FWAV": { type = ".bfwav"; break; };
        case "CTPK": { type = ".ctpk"; break; };
        case "CGFX": { type = ".bcres"; break; };
        case "AAMP": { type = ".aamp"; break; };
        default: {
            switch (signature.split(" ")[0]) {
                case "04000000": { type = ".bin-04-like-variant-table"; break; };
                case "14000000": { type = ".bin-14-like-animation"; break; };
                case "18000000": { type = ".bin-18-like-animation"; break; };
                case "20000000": { type = ".gfmdl"; break; };
                case "44000000": { type = ".bin-44-like-meta"; break; };
                default: {
                    break;
                };
            }
            break;
        }
    }

    return type;

};

var parsers = Object.create(null);

parsers[".gfpak"] = function (reader) {

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
            if (decodeLZ4(file.compressedData, file.decompressedData) !== file.decompressedSize) {
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

parsers[".bntx"] = function (reader, type) {

    // dump(reader, 128);

};

parsers[".bnsh"] = function (reader, type) {

    // dump(reader, 128);

};

parsers[".bin-14-like-animation"] = function (reader, type) {

    // @dump(reader.buffer.length);
    // dump(reader, 512);

};

parsers[".bin-18-like-animation"] = function (reader, type) {

    // // @dump(reader.buffer.length);
    // dump(reader, 256);

    var result = {
        "signature": reader.readUInt32(),
        "headers": [
            [reader.readUInt16(), reader.readUInt16(), reader.readUInt16(), reader.readUInt16(), reader.readUInt32()],
            [reader.readUInt16(), reader.readUInt16(), reader.readUInt16(), reader.readUInt16(), reader.readUInt32()]
        ],
        "offsets": [
            [reader.readUInt32(), reader.readUInt32(), reader.readUInt32(), reader.readUInt32(), reader.readUInt32(), reader.readInt32(), reader.readUInt32()],
            []
        ],
    };
    // var animations = reader.readUInt32();
    // var looper = 0;
    // while (looper < animations) {
    //     result.offsets[1].push(reader.readUInt32());
    //     ++looper;
    // }
    // result.offsets[1].push(reader.readInt32());
    // @dump(result);

    // 24, 0, 18, 16, 4, 0, 0, 8, 0, 12, 18, ...
    // 24, 0, 8, 24, 4, 8, 0, 12, 16, 20, 18, ...
    // 24, 0, 18, 24, 4, 8, 0, 12, 16, 20, 18, ...

    return result;

};

parsers[".gfmdl"] = function (reader, type) {

    var result = {
        "signature": reader.readUInt32(),
        "headers": [
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt16(), reader.readUInt16(),
            reader.readUInt32(), reader.readUInt32(),
        ],
        "offsets": {
            "textureNames": reader.offset + reader.readUInt32(),
            "matrixNames": reader.offset + reader.readUInt32(),
            "unknownData": reader.offset + reader.readUInt32(),
            "unknownData2": reader.offset + reader.readUInt32(),
            "shaderNames": reader.offset + reader.readUInt32(),
            "meshes": reader.offset + reader.readUInt32(),
            "vertices": reader.offset + reader.readUInt32(),
            "bones": reader.offset + reader.readUInt32()
        },
        "boundingBox": {
            "min": [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()],
            "max": [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()],
        },
        "unknownInfo": [ reader.readInt32(), reader.readInt32() ],
        "matrixNames": [],
        "textureNames": [],
        "bones": [],
        "meshes": [],
    };

    var bonesReader = reader.snapshot(result.offsets.bones);
    var boneCount = bonesReader.readUInt32();
    var looper = 0;
    while (looper < boneCount) {

        var boneOffset = bonesReader.offset + bonesReader.readUInt32();
        var boneReader = bonesReader.snapshot(boneOffset);

        var boneInfoLayoutOffset = boneReader.offset - boneReader.readInt32();
        var boneInfoLayoutReader = boneReader.snapshot(boneInfoLayoutOffset);

        let layout = {
            "layoutSize": boneInfoLayoutReader.readUInt16(),
            "nameOffset": boneInfoLayoutReader.readUInt16(),
            "flagOffset": boneInfoLayoutReader.readUInt16(),
            "flag2Offset": boneInfoLayoutReader.readUInt16(),
            "parentOffset": boneInfoLayoutReader.readUInt16(),
            "blankData": boneInfoLayoutReader.readUInt16(), // always zero ?
            "bitOffset": boneInfoLayoutReader.readUInt16(),
            "scaleOffset": boneInfoLayoutReader.readUInt16(),
            "rotationOffset": boneInfoLayoutReader.readUInt16(),
            "translationOffset": boneInfoLayoutReader.readUInt16(),
            "radiusOffsets": [boneInfoLayoutReader.readUInt16(), boneInfoLayoutReader.readUInt16()]
        };

        if (layout.layoutSize !== 24) {
            throw new Error("Layout size not 24");
        }

        if (layout.blankData !== 0) {
            throw new Error("Blank data not zero");
        }

        var bone = {
            "name": boneReader.snapshot(boneOffset + layout.nameOffset).readString(),
            "animatable": false,
            "bitFlag": 0
        };
        if (layout.flagOffset) {
            var flag = boneReader.snapshot(boneOffset + layout.flagOffset).readUInt32();
            if (flag !== 4) {
                // TODO: if not 4, we report error, and research it
                throw new Error("Bone flag not 4");
            }
        }

        if (layout.flag2Offset) {
            var flag = boneReader.snapshot(boneOffset + layout.flag2Offset).readUInt32(); // 0 or 1, enabled ?
            if ((flag !== 0) && (flag !== 1)) {
                // TODO: if not 1 or 0, we report error, and research it
                throw new Error("Bone flag 2 not 1 or 0");
            }
            bone.animatable = (flag === 1);
        }

        if (layout.bitOffset) {
            var byte = boneReader.snapshot(Math.floor((boneOffset + layout.bitOffset) / 4) * 4).readUInt32();
            var bitFlag = byte >> (((boneOffset + layout.bitOffset) % 4) * 8);
            if ((bitFlag !== 1) && (bitFlag !== 0)) {
                // TODO: if not 1 or 0, we report error, and research it
                throw new Error("Bone bit flag not 1 or 0");
            } else if (((bitFlag === 1) && (!bone.animatable)) ||
                       ((bitFlag === 0) && (bone.animatable))) {
                // TODO: if not synced with animatable, we report error, and research it
                throw new Error("Bone bit flag not synced with animatable");
            } else if ((bitFlag << (((boneOffset + layout.bitOffset) % 4) * 8)) !== byte) {
                // TODO: not only the bit set, we report error, and research it
                throw new Error("Bone bit flag i32 has more data");
            }
        }

        ["scale", "rotation", "translation"].forEach((key) => {
            var reader = boneReader.snapshot(boneOffset + layout[key + "Offset"]);
            bone[key] = [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()];
        });
        var radiusReader = boneReader.snapshot(boneOffset + layout.radiusOffsets[0]);
        var radius2Reader = boneReader.snapshot(boneOffset + layout.radiusOffsets[1]);
        bone.radius = [
            [radiusReader.readFloat32(), radiusReader.readFloat32(), radiusReader.readFloat32()],
            [radius2Reader.readFloat32(), radius2Reader.readFloat32(), radius2Reader.readFloat32()]
        ];
        if (bone.radius[0][0] || bone.radius[0][1] || bone.radius[0][2] ||
            bone.radius[1][0] || bone.radius[1][1] || bone.radius[1][2]) {
            // TODO: if not 0, we report error, and research it
            throw new Error("Bone radius not 0");
        }

        if (layout.parentOffset) {
            bone.parent = boneReader.snapshot(boneOffset + layout.parentOffset).readInt32(); // -1 means no parent
        } else {
            bone.parent = 0; // if no parent, it seems zero means
        }

        result.bones.push(bone);

        ++looper;
    }

    var meshesReader = reader.snapshot(result.offsets.meshes);
    var meshCount = meshesReader.readUInt32();
    var looper = 0;
    while (looper < meshCount) {

        var meshOffset = meshesReader.offset + meshesReader.readUInt32();
        var meshReader = meshesReader.snapshot(meshOffset);

        var meshLayoutReader = meshesReader.snapshot(meshReader.offset - meshReader.readInt32());

        var layout = {
            "layoutSize": meshLayoutReader.readUInt16(),
            "dataSize": meshLayoutReader.readUInt16(),
            "bone": meshLayoutReader.readUInt16(),
            "index": meshLayoutReader.readUInt16(),
            "boundingBox": meshLayoutReader.readUInt16(),
            "unknown": 0
        };
        if (layout.layoutSize > 10) {
            layout.unknown = meshLayoutReader.readUInt16();
            throw new Error("We got mesh unknown layout!");
        }

        var boundingBoxReader = meshReader.snapshot(meshOffset + layout.boundingBox);

        var mesh = {
            "boundingBox": {
                "min": [boundingBoxReader.readFloat32(), boundingBoxReader.readFloat32(), boundingBoxReader.readFloat32()],
                "max": [boundingBoxReader.readFloat32(), boundingBoxReader.readFloat32(), boundingBoxReader.readFloat32()],
            },
            "index": 0,
            "bone": meshReader.snapshot(meshOffset + layout.bone).readUInt32()
        };
        mesh.name = result.bones[mesh.bone].name;
        if (layout.index) {
            mesh.index = meshReader.snapshot(meshOffset + layout.index).readUInt32();
        }

        result.meshes.push(mesh);

        ++looper;
    }

    @dump(result.offsets);

    var matrixNameReader = reader.snapshot(result.offsets.matrixNames);
    var matrixNameCount = matrixNameReader.readUInt32();
    var looper = 0;
    while (looper < matrixNameCount) {
        var matrixNameOffset = matrixNameReader.offset + matrixNameReader.readUInt32();
        var matrixName = matrixNameReader.snapshot(matrixNameOffset).readString();
        result.matrixNames.push(matrixName);
        ++looper;
    }

    var textureNameReader = reader.snapshot(result.offsets.textureNames);
    var textureNameCount = textureNameReader.readUInt32();
    var looper = 0;
    while (looper < textureNameCount) {
        var textureNameOffset = textureNameReader.offset + textureNameReader.readUInt32();
        var textureName = textureNameReader.snapshot(textureNameOffset).readString();
        result.textureNames.push(textureName);
        ++looper;
    }

    // @dump(result);

    return result;

};

parsers[".bin-04-like-variant-table"] = function (reader, type) {

    // @dump(reader.buffer.length);
    // dump(reader, 10000);

};

parsers[".bin-44-like-meta"] = function (reader, type) {

    // dump(reader, 256);

};

var dump = function (reader, count) {

    reader = reader.snapshot();

    var offset = reader.offset;

    if (!count) {
        count = Infinity;
    }

    var result = [];

    var line = null;

    var looper = 0;
    while ((looper < count) && (!reader.isEnded())) {

        if (!line) {
            line = [];
            result.push(line);
        }

        line.push(reader.readUInt8());
        if (line.length >= 32) {
            line = null;
        }

        ++looper;
    }

    result = result.map((line) => {

        var result = {
            "hex": line.map((x) => ("0" + x.toString(16)).slice(-2)).join("").replace(/[0-9a-f]{8}/g, (x) => " " + x + " "),
            "asc": line.map((x) => {
                if ((x >= 0x20) && (x <= 0x7e)) {
                    return String.fromCharCode(x) + " ";
                } else {
                    return "  ";
                }
            }).join("").replace(/.{8}/g, (x) => " " + x + " "),
        };

        result.guess = " " + result.hex.trim().split(/\s+/).map((v, i) => {
            if (v === "00000000") {
                return "       0";
            } else if (/^[0-9a-f]{2}000000$/.test(v)) {
                return ("       " + line[i * 4]).slice(-8);
            } else if (/^[0-9a-f]{4}0000$/.test(v)) {
                return ("       " + (line[i * 4] | (line[i * 4 + 1] << 8))).slice(-8);
            } else if (/^([0-9a-f]{2}00){2}$/.test(v)) {
                return ("       " + line[i * 4]).slice(-4) + ("       " + line[i * 4 + 2]).slice(-4);
            } else {
                var buffer = Buffer.from(line.slice(i * 4, i * 4 + 4));
                var float = buffer.readFloatLE(0);
                if (isNaN(float)) {
                    var int = buffer.readInt32LE(0);
                    return ("       " + int).slice(-8);
                } else if ((float + "").indexOf("e") === -1) {
                    return ("       " + float.toFixed(3)).slice(-8);
                }
                return "        ";
            }
        }).join("  ") + " ";

        return result;
    });

    var lines = [
        "             0x00      0x04      0x08      0x0c      0x10      0x14      0x18      0x1c"
    ];

    result.forEach((line, index) => {
        lines.push("0x" + ("000" + (index * 32 + offset).toString(16)).slice(-4) + ": " + line.hex + " :" + (index * 32 + 32 + offset));
        lines.push("     a  " + line.asc);
        lines.push("     v  " + line.guess);
    });

    var content = lines.join("\n") + "\n";

    @warn(content);

};

var parse = function (reader, type) {

    if (parsers[type]) {
        return parsers[type](reader, type);
    } else {
        @warn("Unknown type parser " + type);
        dump(reader, 32);
        return null;
    }

};

module.exports = {
    "parse": parse,
    "Reader": Reader
};
