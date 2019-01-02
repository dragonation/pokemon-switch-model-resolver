var hex = function (u32) {

    var result = ("0000000" + u32.toString(16)).slice(-8);

    return result.slice(6, 8) + result.slice(4, 6) + result.slice(2, 4) + result.slice(0, 2);

};

var parse = function (reader, name, types, listener, cache) {

    if (name === "void") {
        return undefined;
    }

    if (!cache) {
        cache = Object.create(null);
    }

    if (cache[reader.offset]) {
        if ((cache[reader.offset].type === name) || (name === undefined)) {
            @error("duplicated " + name + ": " + reader.offset);
            return cache[reader.offset].value;
        } else {
            throw new Error("Object be resolved as different type: " + name + ", expected " + cache[reader.offset].type);
        }
    }

    if (!name) {

        var value = {
            "i8": reader.snapshot().readInt8(),
            "i16": reader.snapshot().readInt16(),
            "i32": reader.snapshot().readInt32(),
            "hex": hex(reader.snapshot().readUInt32()),
            "f32": reader.snapshot().readFloat32()
        };

        if ((value.i8 === 0) || (value.i8 === value.i16)) {
            delete value.i8;
        }

        if ((value.i16 === 0) || (value.i16 === value.i32)) {
            delete value.i16;
        }

        if (value.i32 === value.f32) {
            delete value.f32;
        }

        return value;
    }

    switch (name) {

        case "&": { return reader.offset + reader.readInt32(); };

        case "void": { return undefined; };

        case "hex": { return hex(reader.readUInt32()); };

        case "i8": { return reader.readInt8(); };
        case "u8": { return reader.readUInt8(); };
        case "i16": { return reader.readInt16(); };
        case "u16": { return reader.readUInt16(); };
        case "i32": { return reader.readInt32(); };
        case "u32": { return reader.readUInt32(); };
        case "i64": { return reader.readInt64(); };
        case "u64": { return reader.readUInt64(); };

        case "f16": { return reader.readFloat16(); };
        case "f32": { return reader.readFloat32(); };
        case "f64": { return reader.readFloat64(); };

        case "str": { return reader.readString(); };

        case "blob": { return reader.readBLOB(); };

        default: {

            if (name[0] === "[") {

                var element = name.slice(1);
                if (element[element.length - 1] == "]") {
                    element = element.slice(0, -1);
                }

                var origin = reader.offset;

                // if (element === "u16") {
                //     @dump(reader.offset);
                //     @dump(reader.buffer.length);
                // }

                var count = 0;
                if (/^[0-9]+:/.test(element)) {
                    count = parseInt(element.split(":")[0]);
                    element = element.split(":").slice(1).join(":");
                } else {
                    count = reader.readUInt32();
                }

                var list = [];

                var looper = 0;
                while (looper < count) {
                    list.push(parse(reader, element, types, listener, cache));
                    ++looper;
                }

                cache[origin] = { "type": name, "value": list };

                return list;

            } else if (name[0] === "&") {

                var target = name.slice(1);

                var offset = reader.offset + reader.readInt32();

                return parse(reader.snapshot(offset), target, types, listener, cache);

            } else {

                var origin = reader.offset;

                var type = types[name];
                if (!type) {
                    @warn("Type not found: " + name);
                    type = [];
                }

                var layoutReader = reader.snapshot(origin - reader.readInt32());

                var layoutSize = layoutReader.readUInt16();

                var layouts = {};

                var result = {
                    "@type": name,
                    "@offset": origin,
                    "@stride": layoutReader.readUInt16(),
                    "@layouts": layouts,
                };

                var looper = 4;
                while (looper < layoutSize) {

                    var column = type[looper / 2 - 2];
                    if (!column) {
                        column = [];
                    }
                    if (!column[0]) {
                        column[0] = ((looper - 4) / 2) + "-unknown";
                        if (column.length < 3) {
                            @warn("Unknown field " + name + "." + column[0]);
                        }
                    }

                    layouts[column[0]] = layoutReader.readUInt16();
                    if (layouts[column[0]] !== 0) {

                        var resultReader = reader.snapshot(origin + layouts[column[0]]);

                        var columnType = column[1];
                        if (columnType && (columnType.indexOf("${") !== -1)) {
                            columnType = @.format(columnType, result, {});
                        }

                        result[column[0]] = parse(resultReader, columnType, types, listener, cache);
                        if (result[column[0]] === undefined) {
                            delete result[column[0]];
                        }

                        if (column.length > 2) {
                            if (result[column[0]] === column[2]) {
                                delete result[column[0]];
                            } else {
                                @warn("Fixed data changed [" + name + "." + column[0] + "]: " + result[column[0]] + ", expected: " + column[2]);
                            }
                        }
                    } else {
                        if (column.length < 3) {
                            if (column[1]) {
                                var columnType = column[1];
                                if (columnType && (columnType.indexOf("${") !== -1)) {
                                    columnType = @.format(columnType, result, {});
                                }
                                switch (columnType.replace(/^#+/, "")) {
                                    case "hex": { result[column[0]] = "00000000"; break; };
                                    case "i8": case "u8":
                                    case "i16": case "u16":
                                    case "i32": case "u32":
                                    case "i64": case "u64":
                                    case "f32": case "f64": { result[column[0]] = 0; break; };
                                    case "str": { result[column[0]] = ""; break; };
                                    default: {
                                        if (columnType.replace(/^#+/, "")[0] === "[") {
                                            result[column[0]] = [];
                                        } else {
                                            delete result[column[0]];
                                        }
                                        break;
                                    }
                                }
                            } else {
                                result[column[0]] = 0;
                            }

                        }
                    }

                    looper += 2;
                }

                if (listener) {
                    var result2 = listener(result);
                    if (result2 !== undefined) {
                        result = result2;
                    } else if (result.@content) {
                        result = result.@content;
                    }
                }

                if (name) {
                    cache[origin] = { "type": name, "value": result };
                }

                return result;

            }

        }

    }

    throw new Error("Impossible");

};

parse.file = function (reader, name, types, listener) {

    var offset = reader.readUInt32();

    return parse(reader.snapshot(reader.offset + offset - 4), name, types, listener);

};

module.exports = parse;

