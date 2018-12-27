
var guessFileType = function (reader) {

    // var signature = reader.snapshot().readBLOB(8);
    var signature = Array.prototype.slice.call(reader.snapshot().readBLOB(32), 0).map((x) => ("0" + x.toString(16)).slice(-2)).join("").replace(/[0-9a-f]{8}/g, (x) => " " + x).trim();

    var reader = reader.snapshot();

    var data = [];
    var looper = 0;
    while ((looper < 8) && (data[data.length - 1] !== 0)) {
        data.push(reader.readUInt8());
        ++looper;
    }
    if (data[data.length - 1] === 0) {
        data.pop();
    }
    data = String.fromCharCode.apply(String, data);

    var type = ".bin";
    switch (data) {
        case "SARC": { type = ".sarc"; break; };
        case "Yaz": { type = ".szs"; break; };
        case "YB": { type = ".byaml"; break; };
        case "BY": { type = ".byaml"; break; };
        case "FRES": { type = ".bfres"; break; };
        case "Gfx2": { type = ".gtx"; break; };
        case "FLYT": { type = ".bflyt"; break; };
        case "CLAN": { type = ".bclan"; break; };
        case "CLYT": { type = ".bclyt"; break; };
        case "FLIM": { type = ".bclim"; break; };
        case "FLAN": { type = ".bflan"; break; };
        case "VFXB": { type = ".pctl"; break; };
        case "AAHS": { type = ".sharc"; break; };
        case "BAHS": { type = ".sharcb"; break; };
        case "BNTX": { type = ".bntx"; break; };
        case "BNSH": { type = ".bnsh"; break; };
        case "FSHA": { type = ".bfsha"; break; };
        case "FFNT": { type = ".bffnt"; break; };
        case "CFNT": { type = ".bcfnt"; break; };
        case "CSTM": { type = ".bcstm"; break; };
        case "FSTM": { type = ".bfstm"; break; };
        case "STM": { type = ".bfsha"; break; };
        case "STM": { type = ".bfsha"; break; };
        case "CWAV": { type = ".bcwav"; break; };
        case "FWAV": { type = ".bfwav"; break; };
        case "CTPK": { type = ".ctpk"; break; };
        case "CGFX": { type = ".bcres"; break; };
        case "AAMP": { type = ".aamp"; break; };
        default: {
            switch (signature.split(" ")[0]) {
                case "04000000": { type = ".bin-04-like-variant-table"; break; };
                case "14000000": { type = ".bin-14-like-animation"; break; };
                case "18000000": { type = ".bin-18-like-animation"; break; };
                case "20000000": { type = ".gfmdl"; break; };
                case "44000000": { type = ".bin-44-like-meta"; break; };
                default: {
                    break;
                };
            }
            break;
        }
    }

    return type;

};

module.exports = {
    "guessFileType": guessFileType
};
