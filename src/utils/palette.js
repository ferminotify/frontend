// Bright tones readable on the dark surface, as "r, g, b" for rgba() tints
export const palette = {
    blue: '138, 180, 248',
    green: '129, 201, 149',
    yellow: '253, 214, 99',
    red: '242, 139, 130',
    purple: '197, 138, 249',
    orange: '252, 173, 112',
    teal: '120, 217, 236',
    pink: '255, 139, 203'
};

const rotation = ['blue', 'orange', 'green', 'purple', 'red', 'teal', 'yellow', 'pink'];

// Walks the rotation so neighbouring cards never share a color; offset varies it per section
export const colorAt = (index, offset = 0) => palette[rotation[(index + offset) % rotation.length]];
