"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ckb_sdk_utils_1 = require("@nervosnetwork/ckb-sdk-utils");
exports.groupScripts = (inputCells) => {
    const groups = new Map();
    inputCells.forEach((cell, i) => {
        const lockhash = ckb_sdk_utils_1.scriptToHash(cell.lock);
        const group = groups.get(lockhash) || [];
        groups.set(lockhash, [...group, i]);
    });
    return groups;
};
exports.default = exports.groupScripts;
//# sourceMappingURL=groupScripts.js.map