const gfbin = require("./gfbin.js");
const gfpak = require("./gfpak.js");

const fnv1a64 = require("./fnv1a64.js");

const Reader = require("./reader.js");

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

    var result = {};

    @dump(reader.buffer.length);
    if (reader.readString(4) !== "BNSH") {
        throw new Error("Invalid BNSH magic header");
    }

    if (reader.readUInt32() !== 0) {
        throw new Error("Expected 0, but not found");
    }

    result.hash = [reader.readUInt32(), reader.readUInt32()];

    let nameOffset = reader.readUInt32();
    let nameReader = reader.snapshot(nameOffset - 2);
    result.name = nameReader.readString(nameReader.readUInt16());

    @dump(result);
    reader.dump(128);

    return result;

};

parsers[".gfbanmcfg"] = function (reader, type) {

    var result = gfbin.file(reader, "animation_logic", {
        "animation_logic": [
            ["parts", "&part_list"],
            ["floatings", "&floating_list"],
            [null, "i32", 0], // zero
            [null, "i32", 0], // zero
            ["states", "&state_list"],
            ["initial", "&initial"],
            ["animations", "&animation_list"],
        ],
        "animation_list": [
            ["@content", "&[&animation_reference]"]
        ],
        "animation_reference": [
            ["name", "&str"],
            ["file", "&str"],
        ],
        "initial": [
            ["states", "&[&initial_state]"],
            ["values", "&[&initial_value]"],
            ["variants", "&[&string]"],
            ["tweens", "&[&string]"]
        ],
        "part_list": [
            ["list", "&[&part]"],
            ["affectings", "&affectings"]
        ],
        "empty": [],
        "affectings": [
            ["empty", "&empty"],
            ["parts", "&affecting_part_list"],
            ["empty2", "&empty"],
        ],
        "affecting_part_list": [
            ["notEmpty", "u8"], 
            ["list", "&[&affecting_part]"]
        ],
        "affecting_part": [
            ["name", "&str"],
            ["empty", "&empty"],
            ["variants", "&string_list"],
            ["empty2", "&empty"],
        ],
        "floating_list": [
            ["@content", "&[&floating]"]
        ],
        "state_list": [
            ["@content", "&[&state_machine]"]
        ],
        "state_machine": [
            ["name", "&str"],
            ["rootNode", "&state_node"],
        ],
        "state_node": [
            ["path", "&str"],
            ["type", "i32"], // 1: ; 3: wildcard; 4: root
            ["space", "&str"],
            ["animation", "&state_animation"],
            ["nextStates", "&[&next_state]"],
            ["children", "&[&state_node]"],
        ],
        "next_state": [
            ["path", "&str"],
            [null, "i32"],
            [null, "f32"],
            [null, "i32"],
            [null, "f32"],
            [null, "i32"],
            ["state_variants", "&[&state_variant]"],
        ],
        "state_variant": [
            ["name", "&str"],
            [null, "u32"], // frame
            ["type", "u8"],
            ["value", "&state_variant_${type;{1?'number', 2?'value', 3?'switch', 4?'switch_2'}}"]
        ],
        "state_variant_number": [
            ["value", "i32"]
        ],
        "state_variant_value": [
            ["value", "f32"]
        ],
        "state_variant_switch": [
            ["value", "u8"]
        ],
        "state_variant_switch_2": [
            ["value", "u8"]
        ],
        "state_animation": [
            ["space", "&str"],
            ["name", "&string"],
            [null, "f32"],
        ],
        "part": [
            ["id", "i32"],
            ["name", "&str"],
            ["objects", "&model_reference"],
        ],
        "model_reference": [
            ["bones", "&string_list"],
            ["meshes", "&mesh_list"],
            ["polygons", "&string_list"],
        ],
        "mesh_list": [
            ["notEmpty", "u8"],
            ["list", "&[&mesh]"],
        ],
        "mesh": [
            ["name", "&str"],
            ["flag", "&byte"],
            ["variants", "&string_list"],
            [null, "&string_list"],
        ],
        "floating": [
            ["name", "&str"],
            ["type", "i32"],
            ["rangeX", "[2:f32]"],
            ["rangeY", "[2:f32]"],
            ["speed", "f32"]
        ],
        "initial_state": [
            ["name", "&str"],
            [null, "i32", 0],
            ["value", "i32"],
        ],
        "initial_value": [
            ["name", "&str"],
            [null, "i32", 0],
            ["value", "f32"],
        ],
        "string_list": [
            ["notEmpty", "u8"],
            ["list", "&[&string]"],
        ],
        "string": [
            ["@content", "&str"],
        ],
        "byte": [
            ["@content", "u8"]
        ],
    }, (object) => {

        switch (object.@type) {

            case "animation_pack": {
                break;
            };

            case "affectings": 
            case "affecting_part": {

                if (Object.keys(object.empty).length === 1) {
                    delete object.empty;
                } else {
                    @warn("Non empty empty object found in affectings");
                }

                if (Object.keys(object.empty2).length === 1) {
                    delete object.empty2;
                } else {
                    @warn("Non empty empty object found in affectings");
                }

                break;
            }

            case "string_list":
            case "mesh_list": 
            case "affecting_part_list": {
                if (object.notEmpty && object.list) {
                    return object.list;
                } else {
                    return [];
                }
                break;
            };

            default: {
                break;
            };

        }

        delete object.@offset;
        delete object.@stride;
        delete object.@layouts;

    });

    // @dump(result);

    return result;

};

parsers[".gfbmdl"] = function (reader, type) {

    var result = gfbin.file(reader, "model", {
        "model": [
            ["version", "hex"],
            ["boundingBox", "[2:[3:f32]]"],
            ["textures", "&[&str]"],
            ["shaders", "&[&str]"],
            ["emptyList", "&[&]"], // always zero length ??
            ["materialNames", "&[&str]"],
            ["materials", "&[&material]"],
            ["groups", "&[&group]"],
            ["meshes", "&[&mesh]"],
            ["bones", "&[&bone]"],
            ["renderings", "&[&rendering]"] // rendering layer configuations ??
        ],
        "rendering": [
            [null, "u32"],
            null,
            [null, "&[u32]"],
            [null, "[6:f32]"]
        ],
        "bone": [
            ["name", "&str"],
            [null, "u32"], // animatable, particle ...
            ["parent", "i32"],
            [null, "u32", 0],
            [null, "u8"], // unknown
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
            ["name", "&str"],
            ["shaderGroup", "&str"],
            [null, "i32"], // render layer maybe
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
            ["common", "&common"],
        ],
        "switch": [
            ["name", "&str"],
            ["value", "u8"]
        ],
        "value": [
            ["name", "&str"],
            ["value", "f32"]
        ],
        "color": [
            ["name", "&str"],
            ["value", "[3:f32]"]
        ],
        "number": [
            ["name", "&str"],
            ["value", "i32"]
        ],
        "common": [
            ["switches", "&[&switch]"],
            ["values", "&[&number]"],
            ["colors", "&[&color]"],
        ],
        "texture": [
            ["channel", "&str"],
            ["id", "i32"],
            ["mapping", "&texture_mapping"]
        ],
        "texture_mapping": [
            // mappingType, scale, translation, rotation,
            // wrapS, wrapT, magFilter, minFilter
            // minLOD
            [null, "i32"], // 0 or 1
            [null, "i32"], // 0 or 1
            [null, "i32"], // 0 or 1
            [null, "i32"], // 0 or 1
            ["allzero", "[4:i32]"],
            [null, "f32"], // -2.0
        ],
        "group": [
            ["boneID", "u32"],
            ["meshID", "u32"],
            ["boundingBox", "[2:[3:f32]]"],
            ["layer", "u32"]
        ],
        "mesh": [
            ["polygons", "&[&mesh_polygon]"],
            ["alignments", "&[&mesh_alignment]"],
            ["data", "&blob"]
        ],
        "mesh_alignment": [
            ["typeID", "u32"],
            ["formatID", "u32"],
            ["unitCount", "u32"]
        ],
        "mesh_polygon": [
            ["materialID", "u32"],
            ["data", "&[u16]"]
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
                    group.name = object.bones[group.boneID].name;
                    object.meshes[group.meshID].name = group.name;
                });

                object.materials.forEach((material) => {
                    material.textures.forEach((texture) => {
                        texture.name = object.textures[texture.id];
                    });
                });

                object.meshes.forEach((mesh) => {
                    mesh.polygons.forEach((polygon) => {
                        polygon.material = object.materials[polygon.materialID].name;
                    });
                });

                break;
            };

            case "common": {

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
                    values[value.name] = value.value ? value.value : 0;
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

                var offset = 0;
                object.alignments.forEach((alignment) => {
                    alignment.dataOffset = offset;
                    offset += alignment.dataSize;
                });

                object.dataStride = offset;
                object.vertexCount = object.data.length / object.dataStride;

                object.vertices = [];

                let dataReader = new Reader(object.data);

                let looper = 0;
                while (looper < object.vertexCount) {

                    let vertex = {};

                    let looper2 = 0;
                    while (looper2 < object.alignments.length) {

                        let values = [];
                        let method = null;
                        let alignment = object.alignments[looper2];
                        switch (alignment.format) {
                            case "f32": { method = "readFloat32"; break; };
                            case "f16": { method = "readFloat16"; break; };
                            case "u8": { method = "readUInt8"; break; };
                            case "u16": { method = "readUInt16"; break; };
                            case "u8_f32": { method = "readUInt8"; break; };
                            default: { method = "readFloat32"; break; };
                        }

                        let looper3 = 0;
                        while (looper3 < alignment.unitCount) {
                            values.push(dataReader[method]());
                            ++looper3;
                        }

                        if (alignment.type === "u8_f32") {
                            values = values.map((value) => value / 255);
                        }

                        vertex[alignment.type] = values;

                        ++looper2;
                    }

                    object.vertices.push(vertex);

                    ++looper;
                }

                delete object.data;
                delete object.dataStride;
                delete object.alignments;

                break;
            };

            case "mesh_polygon": {

                let triangles = object.data.length / 3;

                let data = [];

                let looper = 0;
                while (looper < triangles) {
                    data.push([object.data[looper * 3],
                               object.data[looper * 3 + 1],
                               object.data[looper * 3 + 2]]);
                    ++looper;
                }

                object.data = data;

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
                        case 0x0b: { return "boneID"; };
                        case 0x0c: { return "boneWeight"; };
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
        delete object.@stride;

    });

    return result;

};

parsers[".gfbanm"] = function (reader, type) {

    var result = gfbin.file(reader, "animation", {
        "animation": [
            ["config", "&config"],
            ["bones", "&bone_list"],
            ["materials", "&material_list"],
            ["groups", "&group_list"],
            ["triggers", "&trigger_list"]
        ],
        "trigger_list": [
            ["@content", "&[&trigger]"]
        ],
        "trigger": [
            ["name", "&str"],
            ["frameStart", "i32"],
            ["frameEnd", "i32"],
            ["parameters", "&[&trigger_parameter]"]
        ],
        "trigger_parameter": [
            ["name", "&str"],
            ["type", "u8"],
            ["value", "&trigger_parameter_${type;{1?'number', 2?'value', 3?'switch', 4?'string'}}"]
        ],
        "trigger_parameter_number": [
            ["@content", "i32"]
        ],
        "trigger_parameter_value": [
            ["@content", "f32"]
        ],
        "trigger_parameter_switch": [
            ["@content", "u8"]
        ],
        "trigger_parameter_string": [
            ["@content", "&str"]
        ],
        "config": [
            [null, "i32"], // loopable or autostart ??
            ["keyFrames", "i32"],
            ["fps", "i32"],
        ],
        "bone_list": [
            ["bones", "&[&bone]"],
            ["defaults", "&bone_defaults"]
        ],
        "bone_defaults": [
            [null, "i32"],
            ["srt", "[10:f32]"], // scale, rotation(quaternion), transation
        ],
        "group_list": [
            ["@content", "&[&group]"],
        ],
        "material_list": [
            ["@content", "&[&material]"]
        ],
        "group": [
            ["name", "&str"],
            ["visibleType", "u8"],
            ["visible", "&${visibleType;{1?'fixed_boolean_track',3?'framed_boolean_track'}}"]
        ],
        "fixed_boolean_track": [
            ["value", "u8"],
        ],
        "framed_boolean_track": [
            ["frames", "&[u16]"],
            ["values", "&[u16]"], // bits with value shifting
        ],
        "bone": [
            ["name", "&str"],
            ["scaleType", "u8"],
            ["scale", "&${scaleType;{1?'fixed_vector_track',2?'dynamic_vector_track',3?'framed_vector_track'}}"],
            ["rotationType", "u8"],
            ["rotation", "&${rotationType;{1?'fixed_quaternion_track', 2?'dynamic_quaternion_track',3?'framed_quaternion_track'}}"],
            ["translationType", "u8"],
            ["translation", "&${translationType;{1?'fixed_vector_track',2?'dynamic_vector_track',3?'framed_vector_track'}}"],
            [null, "&frame_ranges"],
            [null, "&frame_ranges"],
            [null, "&frame_ranges"],
        ],
        "material": [
            ["name", "&str"],
            ["switches", "&[&switch]"],
            ["values", "&[&value]"],
            ["vectors", "&[&vector]"],
        ],
        "fixed_vector_track": [
            ["value", "[3:f32]"]
        ],
        "dynamic_vector_track": [
            ["values", "&[[3:f32]]"]
        ],
        "framed_vector_track": [
            ["frames", "&[u16]"],
            ["values", "&[[3:f32]]"]
        ],
        "fixed_quaternion_track": [
            ["value", "[3:u16]"]
        ],
        "dynamic_quaternion_track": [
            ["values", "&[[3:u16]]"]
        ],
        "framed_quaternion_track": [
            ["frames", "&[u16]"],
            ["values", "&[[3:u16]]"] // maybe we need more solution for quaternion, see old codes in 3ds, it precalculate the value for accelerations
        ],
        "frame_ranges": [
            [null, "&[u16]"],
            [null, "&[u16]"],
        ],
        "vector": [
            ["name", "&str"],
            ["type", "u8"],
            ["value", "&${type;{1?'fixed_vector_track', 2?'dynamic_vector_track', 3?'framed_vector_track'}}"],
            ["frames", "&frame_ranges"]
        ],
        "switch": [
            ["name", "&str"],
            ["type", "u8"],
            ["value", "&${type;{1?'fixed_boolean_track', 2?'dynamic_boolean_track', 3?'framed_boolean_track'}}"],
            ["frames", "&frame_ranges"]
        ],
        "value": [
            ["name", "&str"],
            ["type", "u8"],
            ["value", "&${type;{1?'fixed_value_track', 2?'dynamic_value_track', 3?'framed_value_track'}}"],
            ["frames", "&frame_ranges"]
        ],
        "fixed_value_track": [
            ["value", "f32"],
        ],
        "dynamic_value_track": [
            ["values", "&[f32]"]
        ],
        "framed_value_track": [
            ["frames", "&[u16]"],
            ["values", "&[f32]"],
        ]
    }, (object) => {

        switch (object.@type) {

            default: {
                break;
            };

        }

        delete object.@offset;
        delete object.@stride;
        delete object.@layouts;

    });

    return result;

};

parsers[".gfbpokecfg"] = function (reader, type) {

    var result = gfbin.file(reader, "meta", {
        "meta": [
            [null, "i32", 3],
            [null, "i32", 0],
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
            ["cameraX", "f32"],
            ["cameraY", "f32"],
            ["cameraZ", "f32"],
            ["centerY", "f32"],
            ["elevationMin", "f32"],
            ["elevationMax", "f32"],
            [null, "i32", 0],
            [null, "i8"], // 0 or 50
            [null, "i8"], // 0 or 50
            [null, "i32", 0],
            [null, "i32", 0],
            [null, "&[&string]"], // mesh names like 3ds, but no found definitions
            [null, "&t1"],
        ],
        "string": [
            ["@content", "&str"],
        ],
        "t1": [
            [null, "i32"], // 0
            [null, "&[&]"]
        ]
    }, (object) => {

        switch (object.@type) {

            // case "meta": {
            //     @dump(object);
            //     reader.snapshot(object.@offset).dump();
            //     break;
            // };

            default: {
                break;
            };
        }

        delete object.@offset;
        delete object.@stride;
        delete object.@layouts;

    });

    return result;

};

parsers[".gfbpmcatalog"] = function (reader, type) {

    var result = gfbin.file(reader, "catalog", {
        "catalog": [
            ["@content", "&[&model]"]
        ],
        "model": [
            ["pokemonID", "u16"], 
            ["isSpecial", "u16"],
            ["isFemale", "u8"],
            ["isRare", "u8"],
            ["modelPath", "&str"],
            ["configPath", "&str"],
            ["packageFile", "&str"],
            ["animations", "&[&animation]"]
        ],
        "animation": [
            ["type", "&str"],
            ["configPath", "&str"],
        ]
    }, (object) => {

        switch (object.@type) {
            default: {
                break;
            };
        }

        delete object.@offset;
        delete object.@stride;
        delete object.@layouts;

    });

    return result;

};

module.exports = parse;
