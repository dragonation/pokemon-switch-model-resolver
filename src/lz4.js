
var lz4 = function (input, output, sIdx, eIdx) {
    sIdx = sIdx || 0
    eIdx = eIdx || (input.length - sIdx)
    // Process each sequence in the incoming data
    for (var i = sIdx, n = eIdx, j = 0; i < n;) {
        var token = input[i++]

        // Literals
        var literals_length = (token >> 4)
        if (literals_length > 0) {
            // length of literals
            var l = literals_length + 240
            while (l === 255) {
                l = input[i++]
                literals_length += l
            }

            // Copy the literals
            var end = i + literals_length
            while (i < end) output[j++] = input[i++]

            // End of buffer?
            if (i === n) return j
        }

        // Match copy
        // 2 bytes offset (little endian)
        var offset = input[i++] | (input[i++] << 8)

        // 0 is an invalid offset value
        if (offset === 0 || offset > j) return -(i-2)

        // length of match copy
        var match_length = (token & 0xf)
        var l = match_length + 240
        while (l === 255) {
            l = input[i++]
            match_length += l
        }

        // Copy the match
        var pos = j - offset // position of the match copy in the current output
        var end = j + match_length + 4 // minmatch = 4
        while (j < end) output[j++] = output[pos++]
    }

    return j
};

module.exports = lz4;
