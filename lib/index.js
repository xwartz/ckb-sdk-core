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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ckb_sdk_rpc_1 = __importDefault(require("@nervosnetwork/ckb-sdk-rpc"));
const validators_1 = require("@nervosnetwork/ckb-sdk-utils/lib/validators");
const exceptions_1 = require("@nervosnetwork/ckb-sdk-utils/lib/exceptions");
const utils = __importStar(require("@nervosnetwork/ckb-sdk-utils"));
const generateRawTransaction_1 = __importDefault(require("./generateRawTransaction"));
const loadCells_1 = __importDefault(require("./loadCells"));
const signWitnesses_1 = __importStar(require("./signWitnesses"));
const hrpSize = 6;
class CKB {
    constructor(nodeUrl = 'http://localhost:8114') {
        this.cells = new Map();
        this.utils = utils;
        this.config = {};
        this.generateLockHash = (publicKeyHash, deps = this.config.secp256k1Dep) => {
            if (!deps) {
                throw new exceptions_1.ArgumentRequired('deps');
            }
            return this.utils.scriptToHash({
                hashType: deps.hashType,
                codeHash: deps.codeHash,
                args: publicKeyHash,
            });
        };
        this.loadSecp256k1Dep = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const genesisBlock = yield this.rpc.getBlockByNumber('0x0');
            const secp256k1DepTxHash = (_a = genesisBlock) === null || _a === void 0 ? void 0 : _a.transactions[1].hash;
            const typeScript = (_d = (_c = (_b = genesisBlock) === null || _b === void 0 ? void 0 : _b.transactions[0]) === null || _c === void 0 ? void 0 : _c.outputs[1]) === null || _d === void 0 ? void 0 : _d.type;
            if (!secp256k1DepTxHash) {
                throw new Error('Cannot load the transaction which has the secp256k1 dep cell');
            }
            if (!typeScript) {
                throw new Error('Secp256k1 type script not found');
            }
            const secp256k1TypeHash = this.utils.scriptToHash(typeScript);
            this.config.secp256k1Dep = {
                hashType: 'type',
                codeHash: secp256k1TypeHash,
                outPoint: {
                    txHash: secp256k1DepTxHash,
                    index: '0x0',
                },
            };
            return this.config.secp256k1Dep;
        });
        this.loadDaoDep = () => __awaiter(this, void 0, void 0, function* () {
            var _e, _f, _g, _h, _j, _k;
            const genesisBlock = yield this.rpc.getBlockByNumber('0x0');
            const daoDepTxHash = (_e = genesisBlock) === null || _e === void 0 ? void 0 : _e.transactions[0].hash;
            const typeScript = (_h = (_g = (_f = genesisBlock) === null || _f === void 0 ? void 0 : _f.transactions[0]) === null || _g === void 0 ? void 0 : _g.outputs[2]) === null || _h === void 0 ? void 0 : _h.type;
            const data = (_k = (_j = genesisBlock) === null || _j === void 0 ? void 0 : _j.transactions[0]) === null || _k === void 0 ? void 0 : _k.outputsData[2];
            if (!daoDepTxHash) {
                throw new Error('Cannot load the transaction which has the dao dep cell');
            }
            if (!typeScript) {
                throw new Error('DAO type script not found');
            }
            if (!data) {
                throw new Error('DAO data not found');
            }
            const typeHash = this.utils.scriptToHash(typeScript);
            const s = utils.blake2b(32, null, null, utils.PERSONAL);
            s.update(utils.hexToBytes(data));
            const codeHash = `0x${s.digest('hex')}`;
            this.config.daoDep = {
                hashType: 'type',
                codeHash,
                typeHash,
                outPoint: {
                    txHash: daoDepTxHash,
                    index: '0x2',
                },
            };
            return this.config.daoDep;
        });
        this.loadCells = ({ lockHash, start = '0x0', end, STEP = '0x64', save = false, }) => __awaiter(this, void 0, void 0, function* () {
            const cells = yield loadCells_1.default({ lockHash, start, end, STEP, rpc: this.rpc });
            if (save) {
                this.cells.set(lockHash, cells);
            }
            return cells;
        });
        this.signWitnesses = signWitnesses_1.default;
        this.signTransaction = (key) => (transaction, cells) => {
            if (!key)
                throw new exceptions_1.ArgumentRequired('Private key or address object');
            if (!transaction)
                throw new exceptions_1.ArgumentRequired('Transaction');
            if (!transaction.witnesses)
                throw new exceptions_1.ArgumentRequired('Witnesses');
            if (!transaction.outputsData)
                throw new exceptions_1.ArgumentRequired('OutputsData');
            if (transaction.outputsData.length < transaction.outputs.length)
                throw new Error('Invalid count of outputsData');
            const transactionHash = this.utils.rawTransactionToHash(transaction);
            const inputCells = signWitnesses_1.isMap(key) ? transaction.inputs.map(input => {
                const outPoint = input.previousOutput;
                const cell = cells.find(c => { var _a, _b, _c, _d; return ((_a = c.outPoint) === null || _a === void 0 ? void 0 : _a.txHash) === ((_b = outPoint) === null || _b === void 0 ? void 0 : _b.txHash) && ((_c = c.outPoint) === null || _c === void 0 ? void 0 : _c.index) === ((_d = outPoint) === null || _d === void 0 ? void 0 : _d.index); });
                if (!cell) {
                    throw new Error(`Cell of ${JSON.stringify(outPoint)} is not found`);
                }
                return cell;
            }) : undefined;
            const signedWitnesses = this.signWitnesses(key)({
                transactionHash,
                witnesses: transaction.witnesses,
                inputCells,
            });
            return Object.assign(Object.assign({}, transaction), { witnesses: signedWitnesses.map(witness => typeof witness === 'string' ? witness : this.utils.serializeWitnessArgs(witness)) });
        };
        this.generateRawTransaction = (_a) => {
            var { fee, safeMode = true, deps, capacityThreshold, changeThreshold } = _a, params = __rest(_a, ["fee", "safeMode", "deps", "capacityThreshold", "changeThreshold"]);
            if ('fromAddress' in params && 'toAddress' in params) {
                let availableCells = params.cells || [];
                const [fromPublicKeyHash, toPublicKeyHash] = [params.fromAddress, params.toAddress].map(this.extractPayloadFromAddress);
                if (!availableCells.length && deps) {
                    const lockHash = this.utils.scriptToHash({
                        codeHash: deps.codeHash,
                        hashType: deps.hashType,
                        args: toPublicKeyHash,
                    });
                    const cachedCells = this.cells.get(lockHash);
                    if (cachedCells && cachedCells.length) {
                        availableCells = cachedCells;
                    }
                }
                return generateRawTransaction_1.default({
                    fromPublicKeyHash,
                    toPublicKeyHash,
                    capacity: params.capacity,
                    fee,
                    safeMode,
                    cells: availableCells,
                    deps,
                    capacityThreshold,
                    changeThreshold,
                });
            }
            if ('fromAddresses' in params && 'receivePairs' in params) {
                const fromPublicKeyHashes = params.fromAddresses.map(this.extractPayloadFromAddress);
                const receivePairs = params.receivePairs.map(pair => ({
                    publicKeyHash: this.extractPayloadFromAddress(pair.address),
                    capacity: pair.capacity,
                }));
                return generateRawTransaction_1.default({
                    fromPublicKeyHashes,
                    receivePairs,
                    cells: params.cells || this.cells,
                    fee,
                    safeMode,
                    deps,
                    capacityThreshold,
                    changeThreshold,
                });
            }
            throw new Error('Parameters of generateRawTransaction are invalid');
        };
        this.generateDaoDepositTransaction = ({ fromAddress, capacity, fee, cells = [], }) => {
            this.secp256k1DepsShouldBeReady();
            this.DAODepsShouldBeReady();
            const rawTx = this.generateRawTransaction({
                fromAddress,
                toAddress: fromAddress,
                capacity,
                fee,
                safeMode: true,
                cells,
                deps: this.config.secp256k1Dep,
            });
            rawTx.outputs[0].type = {
                codeHash: this.config.daoDep.typeHash,
                args: '0x',
                hashType: this.config.daoDep.hashType,
            };
            rawTx.outputsData[0] = '0x0000000000000000';
            rawTx.cellDeps.push({
                outPoint: this.config.daoDep.outPoint,
                depType: 'code',
            });
            rawTx.witnesses.unshift({ lock: '', inputType: '', outputType: '' });
            return rawTx;
        };
        this.generateDaoWithdrawStartTransaction = ({ outPoint, fee, cells = [], }) => __awaiter(this, void 0, void 0, function* () {
            this.secp256k1DepsShouldBeReady();
            this.DAODepsShouldBeReady();
            const cellStatus = yield this.rpc.getLiveCell(outPoint, false);
            if (cellStatus.status !== 'live')
                throw new Error('Cell is not live yet.');
            const tx = yield this.rpc.getTransaction(outPoint.txHash);
            if (tx.txStatus.status !== 'committed')
                throw new Error('Transaction is not committed yet');
            const depositBlockHeader = yield this.rpc.getBlock(tx.txStatus.blockHash).then(b => b.header);
            const encodedBlockNumber = this.utils.toHexInLittleEndian(depositBlockHeader.number, 8);
            const fromAddress = this.utils.bech32Address(cellStatus.cell.output.lock.args);
            const rawTx = this.generateRawTransaction({
                fromAddress,
                toAddress: fromAddress,
                capacity: '0x0',
                fee,
                safeMode: true,
                deps: this.config.secp256k1Dep,
                capacityThreshold: '0x0',
                cells,
            });
            rawTx.outputs.splice(0, 1);
            rawTx.outputsData.splice(0, 1);
            rawTx.inputs.unshift({ previousOutput: outPoint, since: '0x0' });
            rawTx.outputs.unshift(tx.transaction.outputs[+outPoint.index]);
            rawTx.cellDeps.push({ outPoint: this.config.daoDep.outPoint, depType: 'code' });
            rawTx.headerDeps.push(depositBlockHeader.hash);
            rawTx.outputsData.unshift(encodedBlockNumber);
            rawTx.witnesses.unshift({
                lock: '',
                inputType: '',
                outputType: '',
            });
            return rawTx;
        });
        this.generateDaoWithdrawTransaction = ({ depositOutPoint, withdrawOutPoint, fee, }) => __awaiter(this, void 0, void 0, function* () {
            var _l, _m;
            this.secp256k1DepsShouldBeReady();
            this.DAODepsShouldBeReady();
            const { JSBI } = this.utils;
            const DAO_LOCK_PERIOD_EPOCHS = 180;
            const cellStatus = yield this.rpc.getLiveCell(withdrawOutPoint, true);
            if (cellStatus.status !== 'live')
                throw new Error('Cell is not live yet');
            const tx = yield this.rpc.getTransaction(withdrawOutPoint.txHash);
            if (tx.txStatus.status !== 'committed')
                throw new Error('Transaction is not committed yet');
            const depositBlockNumber = this.utils.bytesToHex(this.utils.hexToBytes((_m = (_l = cellStatus.cell.data) === null || _l === void 0 ? void 0 : _l.content, (_m !== null && _m !== void 0 ? _m : ''))).reverse());
            const depositBlockHeader = yield this.rpc.getBlockByNumber(BigInt(depositBlockNumber)).then(block => block.header);
            const depositEpoch = this.utils.parseEpoch(depositBlockHeader.epoch);
            const withdrawBlockHeader = yield this.rpc.getBlock(tx.txStatus.blockHash).then(block => block.header);
            const withdrawEpoch = this.utils.parseEpoch(withdrawBlockHeader.epoch);
            const withdrawFraction = JSBI.multiply(JSBI.BigInt(withdrawEpoch.index), JSBI.BigInt(depositEpoch.length));
            const depositFraction = JSBI.multiply(JSBI.BigInt(depositEpoch.index), JSBI.BigInt(withdrawEpoch.length));
            let depositedEpochs = JSBI.subtract(JSBI.BigInt(withdrawEpoch.number), JSBI.BigInt(depositEpoch.number));
            if (JSBI.greaterThan(withdrawFraction, depositFraction)) {
                depositedEpochs = JSBI.add(depositedEpochs, JSBI.BigInt(1));
            }
            const lockEpochs = JSBI.multiply(JSBI.divide(JSBI.add(depositedEpochs, JSBI.BigInt(DAO_LOCK_PERIOD_EPOCHS - 1)), JSBI.BigInt(DAO_LOCK_PERIOD_EPOCHS)), JSBI.BigInt(DAO_LOCK_PERIOD_EPOCHS));
            const minimalSince = this.absoluteEpochSince({
                length: `0x${JSBI.BigInt(depositEpoch.length).toString(16)}`,
                index: `0x${JSBI.BigInt(depositEpoch.index).toString(16)}`,
                number: `0x${JSBI.add(JSBI.BigInt(depositEpoch.number), lockEpochs).toString(16)}`,
            });
            const outputCapacity = yield this.rpc.calculateDaoMaximumWithdraw(depositOutPoint, withdrawBlockHeader.hash);
            const targetCapacity = JSBI.BigInt(outputCapacity);
            const targetFee = JSBI.BigInt(`${fee}`);
            if (JSBI.lessThan(targetCapacity, targetFee)) {
                throw new Error(`The fee(${targetFee}) is too big that withdraw(${targetCapacity}) is not enough`);
            }
            const outputs = [
                {
                    capacity: `0x${(JSBI.subtract(targetCapacity, targetFee)).toString(16)}`,
                    lock: tx.transaction.outputs[+withdrawOutPoint.index].lock,
                },
            ];
            const outputsData = ['0x'];
            return {
                version: '0x0',
                cellDeps: [
                    { outPoint: this.config.secp256k1Dep.outPoint, depType: 'depGroup' },
                    { outPoint: this.config.daoDep.outPoint, depType: 'code' },
                ],
                headerDeps: [depositBlockHeader.hash, withdrawBlockHeader.hash],
                inputs: [
                    {
                        previousOutput: withdrawOutPoint,
                        since: minimalSince,
                    },
                ],
                outputs,
                outputsData,
                witnesses: [
                    {
                        lock: '',
                        inputType: '0x0000000000000000',
                        outputType: '',
                    },
                ],
            };
        });
        this.absoluteEpochSince = ({ length, index, number, }) => {
            const { JSBI } = this.utils;
            validators_1.assertToBeHexString(length);
            validators_1.assertToBeHexString(index);
            validators_1.assertToBeHexString(number);
            const epochSince = JSBI.add(JSBI.add(JSBI.add(JSBI.leftShift(JSBI.BigInt(0x20), JSBI.BigInt(56)), JSBI.leftShift(JSBI.BigInt(length), JSBI.BigInt(40))), JSBI.leftShift(JSBI.BigInt(index), JSBI.BigInt(24))), JSBI.BigInt(number));
            return `0x${epochSince.toString(16)}`;
        };
        this.extractPayloadFromAddress = (address) => {
            const addressPayload = this.utils.parseAddress(address, 'hex');
            return `0x${addressPayload.slice(hrpSize)}`;
        };
        this.secp256k1DepsShouldBeReady = () => {
            if (!this.config.secp256k1Dep) {
                throw new exceptions_1.ArgumentRequired('Secp256k1 dep');
            }
        };
        this.DAODepsShouldBeReady = () => {
            if (!this.config.daoDep) {
                throw new exceptions_1.ArgumentRequired('Dao dep');
            }
        };
        this._node = {
            url: nodeUrl,
        };
        this.rpc = new ckb_sdk_rpc_1.default(nodeUrl);
        const computeTransactionHashMethod = {
            name: 'computeTransactionHash',
            method: '_compute_transaction_hash',
            paramsFormatters: [this.rpc.paramsFormatter.toRawTransaction],
        };
        this.rpc.addMethod(computeTransactionHashMethod);
        const computeScriptHashMethod = {
            name: 'computeScriptHash',
            method: '_compute_script_hash',
            paramsFormatters: [this.rpc.paramsFormatter.toScript],
        };
        this.rpc.addMethod(computeScriptHashMethod);
    }
    setNode(node) {
        if (typeof node === 'string') {
            this._node.url = node;
        }
        else {
            this._node = node;
        }
        this.rpc.setNode(this._node);
        return this._node;
    }
    get node() {
        return this._node;
    }
}
exports.default = CKB;
//# sourceMappingURL=index.js.map