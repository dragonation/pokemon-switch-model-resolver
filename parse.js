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
            ["formatVersion", "hex"], // sometimes 1 ??
            ["modelVersion", "hex"],
            ["boundingBox", "[2:[3:f32]]"],
            ["textures", "&[&str]"],
            ["materialNames", "&[&str]"],
            ["emptyList", "&[&]"], // always zero length ??
            ["materialNames2", "&[&str]"], // TODO: the same as materialNames ??
            ["materials", "&[&material]"],
            ["groups", "&[&group]"],
            ["meshes", "&[&mesh]"],
            ["bones", "&[&bone]"],
            [null, "i32", 64]
        ],
        "bone": [
            ["name", "str"],
            [null, "u32", 4],
            ["flag", "u32"],
            ["parent", "i32"],
            [null, "u32", 0],
            ["flag2", "u8"],  // TODO: the same as flag ??
            ["scale", "[3:f32]"],
            ["rotation", "[3:f32]"],
            ["translation", "[3:f32]"],
            ["radiusStart", "[3:f32]"],
            ["radiusEnd", "[3:f32]"]
        ],
        "material": [
            // edgeType, edgeID, edgeEnabled, projectionType
            // idEdgeOffset, edgeMapAlphaMask
            // renderLayer
            ["shader", "shader"],
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
            ["switches", "&[&switch]"],
            ["values", "&[&value]"],
            ["colors", "&[&color]"],
            [null, "u8"],
            [null, "u8"],
            [null, "u8"],
            [null, "u8"],
            [null, "u8"],
            [null, "u32", 4],
        ],
        "switch": [
            ["name", "str"],
            ["format", "i32", 4],
            ["value", "u8"]
        ],
        "value": [
            ["name", "str"],
            ["format", "i32"], // 4 for i32, 8 for f32 in material, but reverse in shader?
            ["value", "i32"]
        ],
        "color": [
            ["name", "str"],
            ["format", "i32", 4], // 4 for f32, 8 for i32; but no found 8 in models currently
            ["value", "[3:f32]"] // [3:${if(format == 4, 'f32', 'i32')}]
        ],
        "shader": [
            ["name", "str"],
            ["switches", "&[&switch]"],
            ["values", "&[&value]"],
            ["colors", "&[&color]"],
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
            ["empty", "void"],
            [null, "i32"], // 0 or 1
            [null, "i32"], // 0 or 1
            [null, "i32"], // 0 or 1
            [null, "i32"], // 0 or 1
            ["allzero", "[4:i32]"],
            [null, "hex", "000000c0"],
        ],
        "group": [
            ["empty", "void"],
            ["bone", "u32"],
            ["index", "u32"],
            ["boundingBox", "[2:[3:f32]]"]
        ],
        "mesh": [
            ["dataSize", "u32"],
            ["polygons", "&[&mesh_polygon]"],
            ["alignments", "&[&mesh_alignment]"], // pos | uv | ...
            ["dataOffset", "&"]
        ],
        "mesh_alignment": [
            ["empty", "void"], 
            ["typeID", "u32"],
            ["formatID", "u32"],
            ["unitCount", "u32"]
        ],
        "mesh_polygon": [
            ["dataSize", "u32"],
            ["materialID", "u32"],
            ["dataOffset", "&"]
        ]
    }, (object) => {

        switch (object.@type) {

            case "model": {

                if (object.emptyList.length > 0) {
                    @warn("Unknown empty list in model is not empty");
                } else {
                    delete object.emptyList;
                }

                object.groups.forEach((group) => {
                    group.name = object.bones[group.bone].name;
                });

                object.materials.forEach((material) => {
                    material.textures.forEach((texture) => {
                        texture.name = object.textures[texture.id];
                    });
                });

                object.meshes.forEach((mesh) => {
                    mesh.polygons.forEach((polygon) => {

                        polygon.material = object.materials[polygon.materialID].name;

                        polygon.indexSize = 2;
                        polygon.unitSize = polygon.indexSize * 3;
                        polygon.unitCount = polygon.dataSize / polygon.unitSize;

                        // TODO: check for geometry shader

                        // @dump(polygon);

                    });
                });

                break;
            };

            case "shader": {

                var switches = {};
                object.switches.forEach((value) => {
                    switches[value.name] = value.value ? true : false;
                });
                object.switches = switches;

                var values = {};
                object.values.forEach((value) => {
                    // check type for 4 or 8
                    if (value.format === 4) { // f32
                        values[value.name] = value.value;
                        var buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value, 0);
                        values[value.name] = buffer.readFloatLE(0);
                    } else if (value.format === 8) { // i32
                        values[value.name] = value.value;
                    }
                });
                object.values = values;

                var colors = {};
                if (object.colors) {
                    object.colors.forEach((value) => {
                        colors[value.name] = value.value;
                    });
                }
                object.colors = colors;

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

                break;
            };

            case "mesh": {

                var blobReader = reader.snapshot(object.dataOffset);

                if (object.dataSize !== blobReader.readUInt32()) {
                    throw new Error("Invalid data offset with invalid data size");
                }

                var offset = 0;
                object.alignments.forEach((alignment) => {
                    alignment.dataOffset = offset;
                    offset += alignment.dataSize;
                });

                object.dataStride = offset;
                object.vertexCount = object.dataSize / object.dataStride;

                object.vertices = blobReader.readBLOB(object.dataSize);

                break;
            };

            case "mesh_polygon": {

                var blobReader = reader.snapshot(object.dataOffset);

                if (object.dataSize !== blobReader.readUInt32()) {
                    throw new Error("Invalid data offset with invalid data size");
                }

                object.triangles = blobReader.readBLOB(object.dataSize);

                break;
            };

            case "mesh_alignment": {

                var format = function (value) {
                    switch (value) {
                        case 0x00: { return "f32"; };
                        case 0x01: { return "f16"; }; // half-float
                        case 0x02: { return "f32"; };
                        case 0x03: { return "u8"; };
                        case 0x05: { return "u16"; };
                        case 0x08: { return "u8_f32"; }; // byte / 255
                        default: { return value; };
                    }
                };

                var unitSize = function (value) {
                    switch (value) {
                        case 0x00: { return 4; };
                        case 0x01: { return 2; }; // half-float
                        case 0x02: { return 4; };
                        case 0x03: { return 1; };
                        case 0x05: { return 2; };
                        case 0x08: { return 1; }; // byte / 255
                        default: { return value; };
                    }
                };

                var type = function (value) {
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
                object.unitSize = unitSize(object.formatID);
                object.type = type(object.typeID);

                object.dataSize = object.unitSize * object.unitCount;

                break;
            };

            case "texture_mapping": {

                if ((object.allzero[0] !== 0) &&
                    (object.allzero[1] !== 0) &&
                    (object.allzero[2] !== 0) ||
                    (object.allzero[3] !== 0)) {
                    @warn("Not all zero in texture mapping info");
                } else {
                    delete object.allzero;
                }

                break;

            };

            default: { break; };

        }

        delete object.@layouts;
        delete object.@offset;

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
