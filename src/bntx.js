var parseTree = function (reader) {

    if (reader.readString(4) !== "_DIC") {
        throw new Error("Invalid dictionary magic");
    }

    let result = {
        "nodes": [],
        "indices": {}
    };

    let nodes = reader.readUInt32();

    let looper = 0;
    while (looper <= result.nodes) {

        let bits = reader.readUInt32();
        let left = reader.readUInt16();
        let right = reader.readUInt16();

        let nameReader = reader.snapshot(reader.readUInt32());
        let name = nameReader.readString(nameReader.readUInt16());

        let dataOffset = reader.readUInt32();

        let node = {
            "bits": bits,
            "left": left,
            "right": right,
            "name": name,
            "offset": dataOffset
        };

        result.nodes.push(node);

        if (name) {
            indices[name] = node;
        }

        ++looper;
    }

    return result;

};

var parseChannelType = function (type) {
    switch (type) {
        case 0: { return "zero"; };
        case 1: { return "one"; };
        case 2: { return "red"; };
        case 3: { return "green"; };
        case 4: { return "blue"; };
        case 5: { return "alpha"; };
        default: { throw new Error("Unknown channel type"); };
    }
};

var parseTextureType = function (type) {
    switch (type) {
        case 0: { return "image-1d"; };
        case 1: { return "image-2d"; };
        case 2: { return "image-3d"; };
        case 3: { return "cube"; };
        case 8: { return "cube-far"; };
        default: { throw new Error("Unknown texture type"); };
    }
};

var parseFormatUnit = function (unit) {
    switch (unit) {
        case 1: { return "unorm"; };
        case 2: { return "norm"; };
        case 3: { return "u32"; };
        case 4: { return "i32"; };
        case 5: { return "f32"; };
        case 6: { return "srgb"; };
        case 10: { return "uhalf"; };
        default: { throw new Error("unknown format unit"); };
    }
};

var parseFormatType = function (type) {
    switch (type) {
        case 0x02: { return "r8"; };
        case 0x07: { return "r5g6b5"; };
        case 0x09: { return "r8r8"; };
        case 0x0a: { return "r16"; };
        case 0x0b: { return "r8g8b8a8"; };
        case 0x0f: { return "r11g11b10"; };
        case 0x14: { return "r32"; };
        case 0x1a: { return "bc1"; };
        case 0x1b: { return "bc2"; };
        case 0x1c: { return "bc3"; };
        case 0x1d: { return "bc4"; };
        case 0x1e: { return "bc5"; };
        case 0x1f: { return "bc6"; };
        case 0x20: { return "bc7"; };
        case 0x2d: { return "astc4x4"; };
        case 0x2e: { return "astc5x4"; };
        case 0x2f: { return "astc5x5"; };
        case 0x30: { return "astc6x5"; };
        case 0x31: { return "astc6x6"; };
        case 0x32: { return "astc8x5"; };
        case 0x33: { return "astc8x6"; };
        case 0x34: { return "astc8x8"; };
        case 0x35: { return "astc10x5"; };
        case 0x36: { return "astc10x6"; };
        case 0x37: { return "astc10x8"; };
        case 0x38: { return "astc10x10"; };
        case 0x39: { return "astc12x10"; };
        case 0x3a: { return "astc12x12"; };
        default: { throw new Error("Unknown format type"); }
    }
};

var parse = function (reader) {

    var magic = reader.readString(8);
    if (magic !== "BNTX") {
        throw new Error("Invalid BNTX file magic");
    }

    var result = {
        "version": reader.readHash32(), // more like version
        "bom": reader.readUInt16() === 0xfeff ? "le" : "be",
        "version2": reader.readUInt16(), // bntx version?
        "name": reader.snapshot(reader.readUInt32()).readAutostring(),
        "layouts": {
            "strings": (reader.readUInt32() >> 16),
            "relocations": reader.readUInt32(), // file contents
        },
        "fileLength": reader.readUInt32(),
        "textures": []
    };

    if (reader.readString(4) !== "NX  ") {
        throw new Error("Invalid bntx for NX device");
    }

    let texturesCount = reader.readUInt32();

    result.layouts.info = reader.readUInt64();
    result.layouts.data = reader.readUInt64();
    result.layouts.tree = reader.readUInt64();
    result.layouts.dicts = reader.readUInt32();

    result.tree = parseTree(reader.snapshot(result.layouts.tree));

    let textureOffsetReader = reader.snapshot(result.layouts.info);

    let looper = 0;
    while (looper < texturesCount) {

        let textureReader = reader.snapshot(textureOffsetReader.readUInt64());

        if (textureReader.readString(4) !== "BRTI") {
            throw new Error("Invalid BRTI magic");
        }

        let texture = {
            "brtiLength": textureReader.readUInt32(),
            "brtiPaddedLength": textureReader.readUInt64(),
            "flags": textureReader.readUInt8(),
            "dimensions": textureReader.readUInt8(),
            "tileMode": textureReader.readUInt16(),
            "swizzleSize": textureReader.readUInt16(),
            "mipmapLevels": textureReader.readUInt16(),
            "multisampleCount": textureReader.readUInt16(),
            "reversed": textureReader.readUInt16(),
            "formatUnit": parseFormatUnit(textureReader.readUInt8()),
            "formatType": parseFormatType(textureReader.readUInt8()),
            "reversed2": textureReader.readUInt16(),
            "accessFlags": textureReader.readUInt32(),
            "width": textureReader.readUInt32(),
            "height": textureReader.readUInt32(),
            "depth": textureReader.readUInt32(),
            "arrayCount": textureReader.readUInt32(),
            "sizeLevel": textureReader.readUInt32(),
            "reversed3": textureReader.readUInt32(),
            "reversed4": textureReader.readUInt32(),
            "reversed5": textureReader.readUInt32(),
            "reversed6": textureReader.readUInt32(),
            "reversed7": textureReader.readUInt32(),
            "reversed8": textureReader.readUInt32(),
            "dataLength": textureReader.readUInt32(),
            "alignment": textureReader.readUInt32(),
            "channelTypes": [
                parseChannelType(textureReader.readUInt8()),
                parseChannelType(textureReader.readUInt8()),
                parseChannelType(textureReader.readUInt8()),
                parseChannelType(textureReader.readUInt8())
            ],
            "textureType": parseTextureType(textureReader.readUInt32()),
            "nameOffset": textureReader.readUInt64(),
            "parentOffset": textureReader.readUInt64(),
            "dataOffset": textureReader.readUInt64(),
        };

        let nameReader = reader.snapshot(texture.nameOffset);
        texture.name = nameReader.readString(nameReader.readUInt16());

        let mipReader = reader.snapshot(texture.dataOffset);
        baseOffset = mipReader.readInt64();
        texture.mipOffsets = [baseOffset];

        let looper2 = 1; // zero is self
        while (looper2 < texture.mipmapLevels) {
            texture.mipOffsets[looper2] = mipReader.readInt64() - baseOffset;
            ++looper2;
        }

        texture.data = reader.snapshot(texture.mipOffsets[0]).readBLOB(texture.dataLength);

        if (texture.reversed !== 0) {
            throw new Error("Unknown reversed data, expected 0");
        }

        result.textures.push(texture);

        ++looper;
    }

    return result;

};

module.exports = parse;
