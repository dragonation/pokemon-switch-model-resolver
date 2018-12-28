var hex = function (u32) {

    var result = ("0000000" + u32.toString(16)).slice(-8);

    return result.slice(6, 8) + result.slice(4, 6) + result.slice(2, 4) + result.slice(0, 2);

};

var parse = function (reader, name, types, listener, cache) {

    if (!cache) {
        cache = Object.create(null);
    }

    if (cache[reader.offset]) {
        if (cache[reader.offset].type === "name") {
            return cache[reader.offset].value;
        } else {
            throw new Error("Object be resolved as different type: " + name + ", expected before " + cache[reader.offset].type);
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

        case "f32": { return reader.readFloat32(); };
        case "f64": { return reader.readFloat64(); };

        case "str": { return reader.readString(); };

        default: {

            if (name[0] === "[") {

                var element = name.slice(1);
                if (element[element.length - 1] == "]") {
                    element = element.slice(0, -1);
                }

                // var listReader = reader.snapshot();

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
                    "@layouts": layouts
                };

                var looper = 2;
                while (looper < layoutSize) {

                    var column = type[looper / 2 - 1];
                    if (!column) {
                        column = [];
                    }
                    if (!column[0]) {
                        column[0] = ((looper - 2) / 2) + "-unknown";
                        if (column.length < 3) {
                            @warn("Unknown field " + name + "." + column[0]);
                        }
                    }

                    layouts[column[0]] = layoutReader.readUInt16();
                    if (layouts[column[0]] !== 0) {

                        var resultReader = reader.snapshot(origin + layouts[column[0]]);

                        if (column[1] && (column[1][0] === "@")) {
                            result[column[0]] = parse(reader.snapshot(origin + reader.readInt32()), column[1].slice(1), types, listener, cache);
                        } else {
                            result[column[0]] = parse(resultReader, column[1], types, listener, cache);
                        }

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
                            result[column[0]] = 0;
                        }
                    }

                    looper += 2;
                }

                if (listener) {
                    listener(result);
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

