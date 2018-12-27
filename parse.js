const gfbin = require("./gfbin.js");
const gfpak = require("./gfpak.js");

var parsers = Object.create(null);

var parse = function (reader, type) {

    if (parsers[type]) {
        return parsers[type](reader, type);
    } else {
        @warn("Unknown type parser " + type);
        reader.dump(32);
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
            [null, "hex", "00000000"], // sometimes 1 ??
            ["modelVersion", "hex"],
            ["boundingBox", "[2:[3:f32]]"],
            ["textures", "&[&str]"],
            ["materialNames", "&[&str]"],
            [null, "&[&]"],
            ["materialNames2", "&[&str]"], // TODO: the same as materialNames ??
            ["materials", "&[&material]"],
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
        "material": [
            // edgeType, edgeID, edgeEnabled, projectionType
            // idEdgeOffset, edgeMapAlphaMask
            // shaderType
            // renderPriority
            // renderLayer
            ["shader", "i32"],
            ["name", "&str"],
            ["shaderGroup", "&str"],
            [null, "u8", 0],
            [null, "u8"],
            [null, "u8"],
            ["parameter1", "i32"],
            ["parameter2", "i32"],
            ["parameter3", "i32"],
            ["parameter4", "i32"],
            ["parameter5", "i32"],
            ["parameter6", "i32"],
            ["textures", "&[&texture]"],
            ["switches", "&[&material_switch]"],
            ["values", "&[&material_value]"],
            ["colors", "&[&material_color]"],
            [null, "u8"],
            [null, "u8"],
            [null, "u8"],
            [null, "u8"],
            [null, "u8"],
            [null, "u32", 4],
        ],
        "material_switch": [
            ["name", "str"],
            ["format", "i32", 4],
            ["value", "u8"]
        ],
        "material_value": [
            ["name", "str"],
            ["format", "i32"], // 4 for i32, 8 for f32
            ["value", "i32"]
        ],
        "material_color": [
            ["name", "str"],
            ["format", "i32", 4], // 4 for f32, 8 for i32; but no found 8 in models currently
            ["value", "[3:f32]"] // [3:${if(format == 4, 'f32', 'i32')}]
        ],
        "texture": [
            ["channel", "str"],
            ["channel2", "&str"], // the same as channel ??
            ["id", "i32"],
            ["mapping", "&texture_mapping"]
        ],
        "texture_mapping": [
            // mappingType, scale, translation, rotation,
            // wrapS, wrapT, magFilter, minFilter
            // minLOD
            [null, "hex"],
            [null, "i32"],
            [null, "i32"],
            [null, "i32"],
            [null, "i32"],
            [null, "i32"],
            [null, "hex"],
        ],
        "mesh": [
            [null, "hex"],
            ["bone", "u32"],
            ["index", "u32"],
            ["boundingBox", "[2:[3:f32]]"]
        ],
        "submesh": [
            ["data", "i32"],
            ["polygons", "&[&submesh_polygon]"],
            ["formats", "&[&submesh_format]"], // pos | uv | ...
            [null, "u32", 4]
        ],
        "submesh_format": [
            [null, "i32"],
            ["typeID", "u32"],
            ["formatID", "u32"],
            ["units", "u32"]
        ],
        "submesh_polygon": [
            ["data_offset", "i32"],
            ["materialID", "u32"],
            [null, "u32", 4]
        ]
    }, (object) => {

        switch (object.@type) {

            case "model": {

                object.meshes.forEach((mesh) => {
                    mesh.name = object.bones[mesh.bone].name;
                });

                object.materials.forEach((material) => {
                    material.textures.forEach((texture) => {
                        texture.name = object.textures[texture.id];
                    });
                });

                object.submeshes.forEach((submesh) => {
                    submesh.polygons.forEach((polygon) => {
                        polygon.material = object.materials[polygon.materialID].name;
                    });
                });

                break;
            };

            case "material": {

                var switches = {};
                object.switches.forEach((value) => {
                    switches[value.name] = value.value ? true : false;
                });
                object.switches = switches;

                var values = {};
                object.values.forEach((value) => {
                    if (value.format === 8) { // f32
                        values[value.name] = value.value;
                        var buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value, 0);
                        values[value.name] = buffer.readFloatLE(0);
                    } else if (value.format === 4) { // i32
                        values[value.name] = value.value;
                    }
                });
                object.values = values;

                var colors = {};
                object.colors.forEach((value) => {
                    colors[value.name] = value.value;
                });
                object.colors = colors;

                object.shader = gfbin(reader.snapshot(object.@offset + object.@layouts.shader), "shader", {
                    "shader": [
                        ["name", "str"],
                        ["switches", "&[&shader_switch]"],
                        ["values", "&[&shader_value]"],
                        // colors
                    ],
                    "shader_switch": [
                        ["name", "str"],
                        ["format", "u32", 4],
                        ["value", "u8"]
                    ],
                    "shader_value": [
                        ["name", "str"],
                        ["format", "u32", 4],
                        ["value", "i32"]
                    ]
                }, (object) => {

                    if (object.@type === "shader") {

                        var switches = {};
                        object.switches.forEach((value) => {
                            switches[value.name] = value.value ? true : false;
                        });
                        object.switches = switches;

                        var values = {};
                        object.values.forEach((value) => {
                            values[value.name] = value.value;
                        });
                        object.values = values;

                    }

                });

                @dump(object);

                break;
            };

            // case "texture": {
            //     @dump(object);
            //     break;
            // };

            case "submesh_format": {

                var type = function (value) {
                    switch (value) {
                        case 0x01: { return "f16"; };
                        case 0x02: { return "f32"; };
                        case 0x03: { return "u8"; };
                        case 0x05: { return "u16"; };
                        case 0x08: { return "u16_f32"; };
                        default: { return value; };
                    }
                };

                var format = function (value) {
                    switch (value) {
                        case 0x00: { return "position"; };
                        case 0x01: { return "normal"; };
                        case 0x02: { return "binormal"; };
                        case 0x03: { return "uv1"; };
                        case 0x04: { return "uv2"; };
                        case 0x05: { return "uv3"; };
                        case 0x06: { return "uv4"; };
                        case 0x07: { return "color1"; };
                        case 0x08: { return "color2"; };
                        case 0x0b: { return "bone_id"; };
                        case 0x0c: { return "bone_weight"; };
                        default: { return value; };
                    }
                };

                object.format = format(object.formatID);
                object.type = format(object.typeID);

                break;
            };

            default: {
                break;
            }

        }

        delete object.@layouts;

    });

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

module.exports = parse;
