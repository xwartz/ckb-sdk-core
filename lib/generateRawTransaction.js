"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ckb_sdk_utils_1 = require("@nervosnetwork/ckb-sdk-utils");
const validators_1 = require("@nervosnetwork/ckb-sdk-utils/lib/validators");
const EMPTY_DATA_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MIN_CELL_CAPACITY = `0x${(6100000000).toString(16)}`;
const generateRawTransaction = (_a) => {
    var { fee = '0x0', changePublicKeyHash, safeMode = true, deps, capacityThreshold = MIN_CELL_CAPACITY, changeThreshold = MIN_CELL_CAPACITY } = _a, params = __rest(_a, ["fee", "changePublicKeyHash", "safeMode", "deps", "capacityThreshold", "changeThreshold"]);
    if (!deps) {
        throw new Error('The deps is not loaded');
    }
    const scriptBase = {
        codeHash: deps.codeHash,
        hashType: deps.hashType,
    };
    validators_1.assertToBeHexStringOrBigint(fee);
    validators_1.assertToBeHexStringOrBigint(capacityThreshold);
    validators_1.assertToBeHexStringOrBigint(changeThreshold);
    const targetFee = ckb_sdk_utils_1.JSBI.BigInt(`${fee}`);
    const minCapacity = ckb_sdk_utils_1.JSBI.BigInt(`${capacityThreshold}`);
    const minChange = ckb_sdk_utils_1.JSBI.BigInt(`${changeThreshold}`);
    const fromPkhes = 'fromPublicKeyHash' in params ? [params.fromPublicKeyHash] : params.fromPublicKeyHashes;
    const toPkhAndCapacityPairs = 'toPublicKeyHash' in params
        ? [{ publicKeyHash: params.toPublicKeyHash, capacity: params.capacity }]
        : params.receivePairs;
    let unspentCellsMap = new Map();
    if ('fromPublicKeyHash' in params) {
        const lockHash = ckb_sdk_utils_1.scriptToHash(Object.assign(Object.assign({}, scriptBase), { args: params.fromPublicKeyHash }));
        unspentCellsMap.set(lockHash, params.cells || []);
    }
    else {
        unspentCellsMap = params.cells;
    }
    const targetOutputs = toPkhAndCapacityPairs.map(pkhAndCapacity => {
        const capacity = ckb_sdk_utils_1.JSBI.BigInt(`${pkhAndCapacity.capacity}`);
        if (ckb_sdk_utils_1.JSBI.lessThan(capacity, minCapacity)) {
            throw new Error(`Capacity should not be less than ${minCapacity} shannon`);
        }
        return {
            capacity,
            lock: Object.assign(Object.assign({}, scriptBase), { args: pkhAndCapacity.publicKeyHash }),
        };
    });
    const changeOutput = {
        capacity: ckb_sdk_utils_1.JSBI.BigInt(0),
        lock: Object.assign(Object.assign({}, scriptBase), { args: changePublicKeyHash || fromPkhes[0] }),
    };
    const targetCapacity = targetOutputs.reduce((acc, o) => ckb_sdk_utils_1.JSBI.add(acc, o.capacity), ckb_sdk_utils_1.JSBI.BigInt(0));
    const costCapacity = ckb_sdk_utils_1.JSBI.add(ckb_sdk_utils_1.JSBI.add(targetCapacity, targetFee), minChange);
    const inputs = [];
    let inputCapacity = ckb_sdk_utils_1.JSBI.BigInt(0);
    for (let i = 0; i < fromPkhes.length; i++) {
        const pkh = fromPkhes[i];
        const lockhash = ckb_sdk_utils_1.scriptToHash(Object.assign(Object.assign({}, scriptBase), { args: pkh }));
        const unspentCells = unspentCellsMap.get(lockhash) || [];
        for (let j = 0; j < unspentCells.length; j++) {
            const c = unspentCells[j];
            if (!safeMode || (c.dataHash === EMPTY_DATA_HASH && !c.type)) {
                inputs.push({
                    previousOutput: c.outPoint,
                    since: '0x0',
                });
                inputCapacity = ckb_sdk_utils_1.JSBI.add(inputCapacity, ckb_sdk_utils_1.JSBI.BigInt(c.capacity));
                if (ckb_sdk_utils_1.JSBI.greaterThan(inputCapacity, costCapacity)) {
                    break;
                }
            }
        }
        if (ckb_sdk_utils_1.JSBI.greaterThan(inputCapacity, costCapacity)) {
            break;
        }
    }
    if (ckb_sdk_utils_1.JSBI.lessThan(inputCapacity, costCapacity)) {
        throw new Error('Input capacity is not enough');
    }
    if (ckb_sdk_utils_1.JSBI.greaterThan(inputCapacity, ckb_sdk_utils_1.JSBI.add(targetCapacity, targetFee))) {
        changeOutput.capacity = ckb_sdk_utils_1.JSBI.subtract(ckb_sdk_utils_1.JSBI.subtract(inputCapacity, targetCapacity), targetFee);
    }
    const outputs = targetOutputs.map(o => (Object.assign(Object.assign({}, o), { capacity: `0x${o.capacity.toString(16)}` })));
    if (ckb_sdk_utils_1.JSBI.greaterThan(changeOutput.capacity, ckb_sdk_utils_1.JSBI.BigInt(0))) {
        outputs.push(Object.assign(Object.assign({}, changeOutput), { capacity: `0x${changeOutput.capacity.toString(16)}` }));
    }
    const outputsData = outputs.map(() => '0x');
    const tx = {
        version: '0x0',
        cellDeps: [
            {
                outPoint: deps.outPoint,
                depType: 'depGroup',
            },
        ],
        headerDeps: [],
        inputs,
        outputs,
        witnesses: [],
        outputsData,
    };
    return tx;
};
exports.default = generateRawTransaction;
//# sourceMappingURL=generateRawTransaction.js.map