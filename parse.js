const gfbin = require("./gfbin.js");
const gfpak = require("./gfpak.js");

var parsers = Object.create(null);

var parse = function (reader, type) {

    if (parsers[type]) {
        return parsers[type](reader, type);
    } else {
        @warn("Unknown type parser " + type);
        dump(reader, 32);
        return null;
    }

};

parsers[".gfpak"] = function (reader) {

    return gfpak(reader, parse);
    
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

    var result = gfbin.file(reader, "model", {
        "model": [
            [null, "hex", "00000000"],
            ["modelVersion", "hex"],
            ["boundingBox", "[2:[3:f32]]"],
            ["textures", "&[&str]"],
            ["materials", "&[&str]"],
            [null, "&[&]"],
            ["parts", "&[&str]"], // TODO: it seems that is part names
            ["shaderNames"],
            ["meshes", "&[&mesh]"],
            ["submeshes", "&[&submesh]"],
            ["bones", "&[&bone]"],
            [null, "i32"]
        ],
        "bone": [
            ["name", "str"],
            [null, "u32", 4],
            ["flag", "u32"],
            ["parent", "i32"],
            [null, "u32", 0],
            [null, "u8"],  // TODO: the same as flag ??
            ["scale", "[3:f32]"],
            ["rotation", "[3:f32]"],
            ["translation", "[3:f32]"],
            ["radiusStart", "[3:f32]"],
            ["radiusEnd", "[3:f32]"]
        ],
        "mesh": [
            [null, "hex"],
            ["bone", "u32"],
            ["index", "u32"],
            ["boundingBox", "[2:[3:f32]]"]
        ],
        "submesh": [
            [null, "&"],
            [null, "&"],
            ["info", "&[&submesh_info]"],
            [null, "u32", 4]
        ],
        "submesh_info": []
    }, (object) => {
        switch (object.@type) {

            case "model": {

                object.meshes.forEach((mesh) => {
                    mesh.name = object.bones[mesh.bone].name;
                });

                // @dump(object.submeshes);
                break;
            };

            case "submesh": {
                @dump(object);
                break;
            };

            default: {
                break;
            }

        }
    });

    return result;

};

parsers[".bin-04-like-variant-table"] = function (reader, type) {

    // @dump(reader.buffer.length);
    // dump(reader, 10000);

};

parsers[".bin-44-like-meta"] = function (reader, type) {

    // dump(reader, 256);

};

module.exports = parse;
