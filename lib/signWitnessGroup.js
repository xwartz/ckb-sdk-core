"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ckb_sdk_utils_1 = require("@nervosnetwork/ckb-sdk-utils");
const ecpair_1 = __importDefault(require("@nervosnetwork/ckb-sdk-utils/lib/ecpair"));
const signWitnessGroup = (sk, transactionHash, witnessGroup) => {
    if (!witnessGroup.length) {
        throw new Error('WitnessGroup cannot be empty');
    }
    if (typeof witnessGroup[0] !== 'object') {
        throw new Error('The first witness in the group should be type of WitnessArgs');
    }
    const emptyWitness = Object.assign(Object.assign({}, witnessGroup[0]), { lock: `0x${'0'.repeat(130)}` });
    const serializedEmptyWitnessBytes = ckb_sdk_utils_1.hexToBytes(ckb_sdk_utils_1.serializeWitnessArgs(emptyWitness));
    const serialziedEmptyWitnessSize = serializedEmptyWitnessBytes.length;
    const s = ckb_sdk_utils_1.blake2b(32, null, null, ckb_sdk_utils_1.PERSONAL);
    s.update(ckb_sdk_utils_1.hexToBytes(transactionHash));
    s.update(ckb_sdk_utils_1.hexToBytes(ckb_sdk_utils_1.toHexInLittleEndian(`0x${serialziedEmptyWitnessSize.toString(16)}`, 8)));
    s.update(serializedEmptyWitnessBytes);
    witnessGroup.slice(1).forEach(w => {
        const bytes = ckb_sdk_utils_1.hexToBytes(typeof w === 'string' ? w : ckb_sdk_utils_1.serializeWitnessArgs(w));
        s.update(ckb_sdk_utils_1.hexToBytes(ckb_sdk_utils_1.toHexInLittleEndian(`0x${bytes.length.toString(16)}`, 8)));
        s.update(bytes);
    });
    const message = `0x${s.digest('hex')}`;
    const keyPair = new ecpair_1.default(sk);
    emptyWitness.lock = keyPair.signRecoverable(message);
    return [ckb_sdk_utils_1.serializeWitnessArgs(emptyWitness), ...witnessGroup.slice(1)];
};
exports.default = signWitnessGroup;
//# sourceMappingURL=signWitnessGroup.js.map