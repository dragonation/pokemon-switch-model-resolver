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

};

parsers[".bnsh"] = function (reader, type) {

};

parsers[".bin-14-like-animation"] = function (reader, type) {

    var result = gfbin.file(reader, "animation", {
        "animation": [
            ["empty", "void"],
            [null, "&t0"],
            [null, "&t1"],
            [null, "&"],
            [null, "&"],
            [null, "&"],
        ],
        "t0": [
            ["empty", "void"],
            [null, "i32"],
            [null, "i32"],
            [null, "i32"],
        ],
        "t1": [

        ]
    }, (object) => {

        // @dump(object);

        // reader.snapshot(object["1-unknown"] - 32).dump(128);

    });

    return result;
};

parsers[".gfbsm"] = function (reader, type) {

    var result = gfbin.file(reader, "animation_logic", {
        "animation_logic": [
            ["empty", "void"],
            ["parts", "&part_list"],
            [null, "&test4"],
            [null, "i32", 0], // zero
            [null, "i32", 0], // zero
            ["states", "&state_list"],
            [null, "&test2"],
            ["animations", "&animation_list"],
        ],
        "animation_list": [
            ["count", "i32"],
            ["list", "&[&animation_reference]"]
        ],
        "animation_reference": [
            ["empty", "void"],
            ["name", "&str"],
            ["file", "&str"],
        ],
        "test2": [
            ["clips", "[&string]"],
            ["intTracks", "&[&int_track]"],
            ["floatTracks", "&[&key_frame]"],
            ["triggers", "&[&string]"],
            [null, "i32", 4]
        ],
        "part_list": [
            ["empty", "void"],
            ["list", "&[&test12]"],
            [null, "i32", 4] // check why 4
        ],
        "test4": [
            ["tracks", "[&track]"],
            [null, "i32", 4]
        ],
        "state_list": [
            ["empty", "void"],
            ["list", "&[&state_machine]"]
        ],
        "state_machine": [
            ["empty", "void"],
            ["name", "&str"],
            ["rootNode", "&state_node"],
        ],
        "state_node": [
            ["empty", "void"],
            ["path", "&str"],
            ["type", "i32"], // 1: ; 3: wildcard; 4: root
            ["space", "&str"],
            ["animation", "&state_animation"],
            ["nextStates", "&[&next_state]"],
            ["children", "&[&state_node]"],
        ],
        "next_state": [
            [null, "i32"],
            ["path", "&str"],
            [null, "i32"],
            [null, "f32"],
            [null, "i32"],
            [null, "f32"],
            [null, "i32"],
            [null, "i32"], // 4
        ],
        "state_animation": [
            ["empty", "void"],
            ["space", "&str"],
            ["name", "&string"],
            [null, "f32"],
        ],
        "test12": [
            ["empty", "void"],
            ["id", "i32"],
            ["name", "&str"],
            ["objects", "&model_reference"],
        ],
        "model_reference": [
            ["empty", "void"],
            ["bones", "&string_list"],
            ["meshes", "&mesh_list"],
            [null, "&string_list"],
        ],
        "mesh_list": [
            ["empty", "void"],
            ["notEmpty", "u8"],
            ["list", "&[&mesh]"],
        ],
        "mesh": [
            ["empty", "void"],
            ["name", "&str"],
            ["flag", "&byte"],
            ["variants", "&string_list"],
            [null, "&string_list"],
        ],
        "track": [
            ["empty", "void"],
            ["name", "&str"],
            [null, "i32"],
            [null, "[2:f32]"],
            [null, "[2:f32]"],
            [null, "f32"]
        ],
        "int_track": [
            ["name", "str"],
            [null, "i32"],
            [null, "i32"],
            [null, "i32"],
        ],
        "key_frame": [
            ["name", "str"],
            [null, "i32"],
            [null, "i32"],
            [null, "i32"],
        ],
        "string_list": [
            ["empty", "void"],
            ["notEmpty", "u8"],
            ["list", "&[&string]"],
        ],
        "string": [
            ["empty", "void"],
            ["content", "&str"],
        ],
        "byte": [
            ["empty", "void"],
            ["value", "u8"]
        ],
    }, (object) => {

        switch (object.@type) {

            case "animation_pack": {

                object.animations = object.animations.list;
                object.states = object.states.list;

                break;
            };

            case "byte": {
                return object.value;
            };

            case "string": {
                return object.content;
            };

            case "string_list":
            case "mesh_list": {
                if (object.notEmpty && object.list) {
                    return object.list;
                } else {
                    return [];
                }
                break;
            };

            case "animation_list":
            case "state_list":
            case "part_list": {
                return object.list;
            };

            case "mesh": {

                if (object["4-unknown"].length) {
                    @dump(object);
                    reader.snapshot(Math.max(0, object.@offset - 32)).dump(128);
                }
                break;
            };

            // case "model_reference": {

            //     if (object["3-unknown"].length) {
            //         @dump(object);
            //         // reader.snapshot(Math.max(0, object.@offset - 32)).dump(128);
            //         reader.snapshot(Math.max(0, object["0-unknown"] - 32)).dump(128);
            //     }
            //     break;
            // };

            default: {
                break;
            };

        }

        delete object.@layouts;
        delete object.@offset;

    });

    // @dump(result);

    return result;

};

parsers[".gfbmdl"] = function (reader, type) {

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

parsers[".gfbanim"] = function (reader, type) {

    var result = gfbin.file(reader, "animation", {
        "animation": [
            ["empty", "void"],
            ["config", "&config"],
            ["bones", "&bone_list"],
            [null, "&t10"],
            ["groups", "&group_list"],
        ],
        "config": [
            ["empty", "void"],
            [null, "i32", 0],
            ["keyFrames", "i32"],
            ["fps", "i32"],
        ],
        "bone_list": [
            ["empty", "void"],
            ["list", "&[&bone]"]
        ],
        "group_list": [
            ["empty", "void"],
            ["list", "&[&group]"],
        ],
        "group": [
            ["empty", "void"],
            ["name", "&str"],
            ["flag", "u8"], // 1 for normal, 3 for object?
            ["flag2", "&group_flag"]
        ],
        "group_flag": [
            ["empty", "void"],
            ["flag", "u8"],
        ],
        "t1": [
            ["empty", "void"],
            [null, "&[&t4]"]
        ],
        "bone": [
            ["empty", "void"],
            ["name", "&str"],
            ["flag", "u8"],
            [null, "&t3"],
        ],
        "t3": [
            ["empty", "void"],
            [null, "u8"],
        ],
        "t4": [
            ["empty", "void"],
            ["name", "&str"],
            [null, "u8"],
            [null, "&t8"],
            [null, "u8"],
            [null, "&t7"],
            [null, "u8"],
            [null, "&t6"],
            [null, "i32"], // 0
            [null, "&t5"],
            [null, "&t18"],
        ],
        "t5": [
            ["empty", "void"],
            [null, "&[i16]"],
            [null, "&[i16]"],
        ],
        "t6": [
            ["empty", "void"],
            [null, "[3:f32]"],
            [null, "&[f32]"],
        ],
        "t7": [
            ["empty", "void"],
            ["data", "[3:i16]"],
            [null, "&[i16]"]
        ],
        "t8": [
            ["empty", "void"],
            ["data", "[3:f32]"]
        ],

        "t10": [
            ["empty", "void"],
            [null, "&[&t11]"]
        ],
        "t11": [
            ["empty", "void"],
            [null, "&str"],
            [null, "&[&t14]"],
            [null, "&[&t16]"],
            [null, "&[&t12]"],
        ],
        "t12": [
            ["empty", "void"],
            [null, "&str"],
            [null, "u8"],
            [null, "&t13"],
        ],
        "t13": [
            ["empty", "void"],
            ["data", "[3:f32]"]
        ],
        "t14": [
            ["empty", "void"],
            [null, "&str"],
            [null, "u8"],
            [null, "&t15"],
        ],
        "t15": [
            ["empty", "void"],
            [null, "u8"],
        ],
        "t16": [
            ["empty", "void"],
            [null, "&str"],
            [null, "u8"],
            [null, "&t17"],
        ],
        "t17": [
            ["empty", "void"],
            [null], // unknwon i32 or f32
            [null, "&[f32]"]
        ],
        "t18": [
            ["empty", "void"],
            [null, "&[u16]"],
            [null, "&[u16]"]
        ]
    }, (object) => {

        switch (object.@type) {

            case "bone_list":
            case "group_list": {
                return object.list;
            };

            case "group_flag": {
                if (object["2-unknown"]) {
                    @dump(object);
                    reader.snapshot(object.@offset).dump(128);
                }
                break;
            };

            default: {
                break;
            };

        }

        delete object.@offset;
        delete object.@layouts;

    });

    return result;
};

parsers[".gfbpkm"] = function (reader, type) {

    var result = gfbin.file(reader, "meta", {
        "meta": [
            ["empty", "void"],
            [null, "i32", 3], // always 3?
            [null, "i32", 0], // 0
            ["pokemonID", "i16"],
            ["pokemonModelType", "i16"],
            [null, "&[&]"], // 80, 84,
            [null, "&[&]"], // 68, 72
            ["generation", "i8"], // 5 mega, 7 alola, 10?
            ["envolutionStage", "i8"],
            ["capsuleWidth", "f32"], // -9
            ["capsuleHeight", "f32"],
            ["capsuleDepth", "f32"],
            ["minX", "f32"],
            ["minY", "f32"],
            ["minZ", "f32"],
            ["maxX", "f32"],
            ["maxY", "f32"],
            ["maxZ", "f32"],
            ["cameraX", "f32"], // -18
            ["cameraY", "f32"],
            ["cameraZ", "f32"],
            ["centerY", "f32"],
            ["elevationMin", "f32"],
            ["elevationMax", "f32"], // -23
            [null, "i32"], // 0
            [null, "i8"], // -25 // 0 or 50
            [null, "i8"], // 0 or 50
            [null, "i32"], // 0
            [null, "i32"], // 0
            [null, "&[&string]"],
            [null, "&t1"],
        ],
        "string": [
            ["empty", "void"],
            ["content", "&str"],
        ],
        "t1": [
            ["empty", "void"],
            [null, "i32"], // 0
            [null, "&[&]"]
        ]
    }, (object) => {

        switch (object.@type) {

            case "string": {
                return object.content;
            };

            case "meta": {
                // @dump(object);
                // reader.snapshot(object.@offset).dump();
                break;
            };

            default: {
                break;
            };
        }

        delete object.@layouts;
        delete object.@offset;

        // reader.snapshot(object.@offset).dump();

    });

    return result;
};

module.exports = parse;
