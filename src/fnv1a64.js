
let suffix = function (text) {
    
    let value = suffix.basis & suffix.mask;
    
    let looper = 0;
    while (looper < text.length) {
        value = value ^ text.charCodeAt(looper);
        value = value * suffix.prime;
        value = value & suffix.mask;
        ++looper;
    }
    
    return ("00000" + value.toString(16)).slice(-6);
    
};

// suffix.prime = 0x00000100_000001b3;
suffix.prime = 0x0001b3;

// suffix.basis = 0xCBF29CE484222645;
suffix.basis = 0x222645;

suffix.mask = 0xffffff;

module.exports = {
    "suffix": suffix // suffix is enough for gfpak, I think
};
