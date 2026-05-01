"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function hashPassword(plainText) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(plainText, salt);
}
async function comparePassword(plainText, hash) {
    return bcryptjs_1.default.compare(plainText, hash);
}
