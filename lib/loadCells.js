"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const validators_1 = require("@nervosnetwork/ckb-sdk-utils/lib/validators");
const ckb_sdk_utils_1 = require("@nervosnetwork/ckb-sdk-utils");
const exceptions_1 = require("@nervosnetwork/ckb-sdk-utils/lib/exceptions");
const getMinBigInt = (x, y) => {
    return ckb_sdk_utils_1.JSBI.greaterThan(x, y) ? y : x;
};
const loadCells = ({ lockHash, start = '0x0', end, STEP = '0x64', rpc, }) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn(`This method is only for demo, don't use it in production`);
    if (!lockHash) {
        throw new exceptions_1.ArgumentRequired('lockHash');
    }
    if (!rpc) {
        throw new exceptions_1.ArgumentRequired('RPC object');
    }
    validators_1.assertToBeHexStringOrBigint(start);
    if (end !== undefined) {
        validators_1.assertToBeHexStringOrBigint(end);
    }
    const from = ckb_sdk_utils_1.JSBI.BigInt(`${start}`);
    const tipBlockNumber = yield rpc.getTipBlockNumber().then(n => ckb_sdk_utils_1.JSBI.BigInt(n));
    let to = end === undefined ? tipBlockNumber : getMinBigInt(ckb_sdk_utils_1.JSBI.BigInt(`${end}`), tipBlockNumber);
    to = getMinBigInt(to, tipBlockNumber);
    if (ckb_sdk_utils_1.JSBI.lessThan(to, from)) {
        throw new Error(`start(${start}) should not be less than end(${to})`);
    }
    const range = ckb_sdk_utils_1.JSBI.subtract(to, from);
    const groups = ckb_sdk_utils_1.JSBI.greaterThan(range, ckb_sdk_utils_1.JSBI.BigInt(0))
        ? Array.from({ length: Math.ceil(ckb_sdk_utils_1.JSBI.toNumber(range) / Number(STEP)) }, (_, idx) => [
            ckb_sdk_utils_1.JSBI.add(ckb_sdk_utils_1.JSBI.add(from, ckb_sdk_utils_1.JSBI.multiply(ckb_sdk_utils_1.JSBI.BigInt(idx), ckb_sdk_utils_1.JSBI.BigInt(`${STEP}`))), idx ? ckb_sdk_utils_1.JSBI.BigInt(1) : ckb_sdk_utils_1.JSBI.BigInt(0)),
            getMinBigInt(ckb_sdk_utils_1.JSBI.add(from, ckb_sdk_utils_1.JSBI.multiply(ckb_sdk_utils_1.JSBI.BigInt(idx + 1), ckb_sdk_utils_1.JSBI.BigInt(`${STEP}`))), to),
        ])
        : [[from, to]];
    const cells = [];
    for (let i = 0; i < groups.length; i++) {
        const cellDigestsInRange = yield rpc.getCellsByLockHash(lockHash, `0x${groups[i][0].toString(16)}`, `0x${groups[i][1].toString(16)}`);
        const cellDetailInRange = yield Promise.all(cellDigestsInRange.map(cellDigest => rpc.getLiveCell(cellDigest.outPoint, true)));
        cells.push(...cellDigestsInRange
            .map((digest, idx) => (Object.assign(Object.assign({}, digest), { dataHash: cellDetailInRange[idx].cell.data.hash, status: cellDetailInRange[idx].status, type: cellDetailInRange[idx].cell.output.type })))
            .filter(cell => cell.status === 'live'));
    }
    return cells;
});
exports.default = loadCells;
//# sourceMappingURL=loadCells.js.map