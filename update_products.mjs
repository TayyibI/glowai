import fs from 'fs';
import path from 'path';

const fileEnv = 'd:/Projects/glowai/data/products.ts';
let content = fs.readFileSync(fileEnv, 'utf-8');

// The images currently look like:
// image: `https://images.placeholders.dev/?text=${encodeURIComponent("...")}&width=400&height=400`,
// We want to replace this with:
// image: `https://storage.googleapis.com/product-imgs-glowai/${id}.jpg`,

// To do this reliably, we can replace the `image: ` line within each object block.
// Or simply regex: image:\s*`.*?`, => we need to make sure we don't accidentally replace something else, but it seems safe.
// Wait! id is not a JS variable available in the string, we want the literal string if we use template literals but wait!
// The user asks "image: https://storage.googleapis.com/product-imgs-glowai/${id}.jpg,"
// In the object, id is properties like id: "ponds-001".
// So we can parse the file and replace the image field with the actual ID value, or just a string literal.
// E.g. image: "https://storage.googleapis.com/product-imgs-glowai/ponds-001.jpg",

content = content.replace(/id:\s*"([^"]+)",[\s\S]*?image:\s*`.*?`/mg, (match, idValue) => {
    return match.replace(/image:\s*`.*?`/, `image: "https://storage.googleapis.com/product-imgs-glowai/${idValue}.jpg"`);
});

fs.writeFileSync(fileEnv, content, 'utf-8');
console.log('Update complete');
