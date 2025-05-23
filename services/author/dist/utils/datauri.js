import DataUriParser from "datauri/parser.js";
import path from "path";
const getBuffer = (file) => {
    const parser = new DataUriParser();
    const extname = path.extname(file.originalname).toString();
    const buffer = parser.format(extname, file.buffer);
    return buffer;
};
export default getBuffer;
