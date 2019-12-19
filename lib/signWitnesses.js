"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("@nervosnetwork/ckb-sdk-utils/lib/exceptions");
const signWitnessGroup_1 = __importDefault(require("./signWitnessGroup"));
const groupScripts_1 = __importDefault(require("./groupScripts"));
exports.isMap = (val) => {
    return val.size !== undefined;
};
const signWitnesses = (key) => ({ transactionHash, witnesses = [], inputCells = [], }) => {
    if (!key)
        throw new exceptions_1.ArgumentRequired('Private key');
    if (!transactionHash)
        throw new exceptions_1.ArgumentRequired('Transaction hash');
    if (!witnesses.length)
        throw new Error('Witnesses is empty');
    if (exports.isMap(key)) {
        const rawWitnesses = witnesses;
        const restWitnesses = witnesses.slice(inputCells.length);
        const groupedScripts = groupScripts_1.default(inputCells);
        groupedScripts.forEach((indices, lockhash) => {
            const sk = key.get(lockhash);
            if (!sk) {
                throw new Error(`The private key to sign lockhash ${lockhash} is not found`);
            }
            const ws = [...indices.map(idx => witnesses[idx]), ...restWitnesses];
            const witnessIncludeSignature = signWitnessGroup_1.default(sk, transactionHash, ws)[0];
            rawWitnesses[indices[0]] = witnessIncludeSignature;
        });
        return rawWitnesses;
    }
    const signedWitnesses = signWitnessGroup_1.default(key, transactionHash, witnesses);
    return signedWitnesses;
};
exports.default = signWitnesses;
//# sourceMappingURL=signWitnesses.js.map