var parse = function (reader) {

    var magic = reader.readString(8);
    if (magic !== "BNSH") {
        throw new Error("Invalid BNSH file magic");
    }

    var result = {
        "version": reader.readHash32(), // more like version
        "bom": reader.readUInt16() === 0xfeff ? "le" : "be",
        "version2": reader.readUInt16(), // bntx version?
        "name": reader.snapshot(reader.readUInt32()).readAutostring(),
        "layouts": {
            "grsc": (reader.readUInt32() >> 16),
            "relateds": reader.readUInt32(),
        },
        "fileLength": reader.readUInt32(),
    };

    let grscReader = reader.snapshot(result.layouts.grsc);
    if (grscReader.readString(4) !== "grsc") { // maybe graphics source code?
        throw new Error("Invalid grsc magic");
    }

    result.grsc = {
        "length": grscReader.readUInt32(),
        "paddedLength": grscReader.readUInt64(),
        "version": grscReader.readUInt64(), // maybe version?
        "flags": grscReader.readUInt8(),
        "unknown": grscReader.readUInt8(),
        "reversed": grscReader.readUInt16(),
        "unknown2": grscReader.readUInt32(),
        "unknownOffset": grscReader.readUInt64(), // 192, always 0
        "unknownOffset2": grscReader.readUInt64(), // 5288, always 97
        "unknown3": grscReader.readUInt16(), // 15
        "unknown4": grscReader.readUInt16(), // 1
        "unknown5": grscReader.readUInt16(), // 17
        "unknown6": grscReader.readUInt16() // 17
    };

    {   let rltReader = reader.snapshot(result.layouts.relateds);
        if (rltReader.readString(4) !== "_RLT") {
            throw new Error("Invlid RLT section magic header");
        }
        if (result.layouts.relateds !== rltReader.readUInt32()) {
            throw new Error("RLT section offset not correct");
        }
        let sections = rltReader.readUInt64(); // why 64 bit?
        if (rltReader.readUInt64() !== 0) {
            throw new Error("Unknown padding not zero");
        }
        result.sections = [];
        let looper = 0;
        while (looper < sections) {
            let section = {
                "offset": rltReader.readUInt32(),
                "length": rltReader.readUInt32(),
                "unknown": rltReader.readUInt32(),
                "unknown2": rltReader.readUInt32(),
                "flag": [rltReader.readUInt16(), rltReader.readUInt16(), rltReader.readUInt16(), rltReader.readUInt16()],
                "type": "unknown"
            };
            // there are 3 unknown section, last 2 seems always zero length
            let magic = reader.snapshot(section.offset).readUInt32().toString(16);
            switch (magic) {
                case "12345678": { section.type = "binary"; break; };
                case "5254535f": { section.type = "string"; break; };
                case "48534e42": { section.type = "bnsh"; break; };
                default: { break; };
            }
            result.sections.push(section);
            ++looper;
        }

        result.offsets = []; // according to data, there are 3 groups, but no more info
        while (rltReader.offset < rltReader.buffer.length) {
            result.offsets.push({
                "offset": rltReader.readUInt32(),
                "flag": rltReader.readUInt16(),
                "flag2": rltReader.readUInt16()
            });
        }

    }

    let codeOffset = reader.snapshot(reader.snapshot(result.offsets[0].offset).readUInt64()).skip(8, 0).readUInt64();
    let codeReader = reader.snapshot(codeOffset);
    // interesting magic, btw the magic of machine data is 12345678
    if (codeReader.readHash32() !== "98761234") {
        throw new Error("Invalid code magic");
    }
    result.code = {
        "unknown": codeReader.readUInt32(),
        "unknown2": codeReader.readUInt32(),
        "unknown3": codeReader.readUInt32(),
        "unknown4": codeReader.readUInt32(),
        "offset": codeReader.readUInt32(),
        "length": codeReader.readUInt32(),
        // rest no care
    };

    result.code.content = reader.snapshot(result.code.offset + codeOffset).readAutostring(result.code.length);

    @dump("---");
    let dictReader = reader.snapshot(result.offsets[1].offset);
    dictReader.readUInt64(); // ignore, 192, unknownOffset
    let dictOffset = dictReader.readUInt64(); // 480
    dictReader = reader.snapshot(reader.snapshot(dictOffset).readUInt64());
    if (dictReader.offset === 0) {
        reader.snapshot(0).dump();
    }
    // let dictReader = reader.snapshot(result.code.offset + codeOffset + result.code.length-32).dump(400);
    // result.mapping = [
    //     dictReader.readUInt64(),
    //     dictReader.readUInt64(),
    //     dictReader.readUInt64(),
    //     dictReader.readUInt64(),
    //     dictReader.readUInt64()
    // ];
    // @dump(result.mapping);

    // let nextOffset = reader.snapshot(result.grsc.unknownOffset).skip(16).readUInt64();
    // @dump(nextOffset);
    // reader.snapshot(nextOffset).skip(8).readUInt64(64);

    // scReader.dump(128);

    return result;

};

module.exports = parse;
