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

Reader.prototype.readInt8 = function () {

    var result = this.buffer.readInt8(this.offset);

    ++this.offset;

    return result;

};

Reader.prototype.readUInt8 = function () {

    var result = this.buffer.readUInt8(this.offset);

    ++this.offset;

    return result;

};

Reader.prototype.readInt16 = function () {

    var result = this.buffer.readInt16LE(this.offset);

    this.offset += 2;

    return result;

};

Reader.prototype.readUInt16 = function () {

    var result = this.buffer.readUInt16LE(this.offset);

    this.offset += 2;

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

Reader.prototype.readFloat16 = function () {

};

Reader.prototype.readFloat32 = function () {

    var result = this.buffer.readFloatLE(this.offset);

    // simplify the float 32 from float 64, make it more accurate
    var exponential = result.toExponential(7).toLowerCase();
    result = parseFloat(parseFloat(exponential.split("e")[0]).toFixed(7)) * Math.pow(10, exponential.split("e")[1]);

    // make it human readable, remove epsilons
    if (Math.abs(result) <= 1000000) {
        result = parseFloat(result.toFixed(5));
    }

    this.offset += 4;

    return result;

};

Reader.prototype.readBLOB = function (size) {

    if (arguments.length === 0) {
        size = this.readUInt32();
    }

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

Reader.prototype.dump = function (count) {

    var reader = this.snapshot();

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

module.exports = Reader;
