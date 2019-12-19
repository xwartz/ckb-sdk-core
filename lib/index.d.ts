/// <reference types="../types/global" />
/// <reference types="@nervosnetwork/ckb-types" />
import RPC from '@nervosnetwork/ckb-sdk-rpc';
import * as utils from '@nervosnetwork/ckb-sdk-utils';
import { Cell, RawTransactionParamsBase } from './generateRawTransaction';
declare type Address = string;
declare type LockHash = string;
declare type Capacity = bigint | string;
declare type URL = string;
interface RawTransactionParams extends RawTransactionParamsBase {
    fromAddress: Address;
    toAddress: Address;
    capacity: Capacity;
    cells?: Cell[];
}
interface ComplexRawTransactoinParams extends RawTransactionParamsBase {
    fromAddresses: Address[];
    receivePairs: {
        address: Address;
        capacity: Capacity;
    }[];
    cells: Map<LockHash, CachedCell[]>;
}
declare class CKB {
    cells: Map<LockHash, CachedCell[]>;
    rpc: RPC;
    utils: typeof utils;
    private _node;
    config: {
        secp256k1Dep?: DepCellInfo;
        daoDep?: DepCellInfo;
    };
    constructor(nodeUrl?: URL);
    setNode(node: URL | CKBComponents.Node): CKBComponents.Node;
    get node(): CKBComponents.Node;
    generateLockHash: (publicKeyHash: string, deps?: Pick<DepCellInfo, "codeHash" | "hashType" | "typeHash"> | undefined) => string;
    loadSecp256k1Dep: () => Promise<DepCellInfo>;
    loadDaoDep: () => Promise<DepCellInfo>;
    loadCells: ({ lockHash, start, end, STEP, save, }: {
        lockHash: string;
        start?: string | bigint | undefined;
        end?: string | bigint | undefined;
        STEP?: string | bigint | undefined;
        save?: boolean | undefined;
    }) => Promise<CachedCell[]>;
    signWitnesses: import("./signWitnesses").SignWitnesses;
    signTransaction: (key: string | Map<string, string>) => (transaction: CKBComponents.RawTransactionToSign, cells: CachedCell[]) => {
        witnesses: string[];
        version: string;
        cellDeps: CKBComponents.CellDep[];
        headerDeps: string[];
        inputs: CKBComponents.CellInput[];
        outputs: CKBComponents.CellOutput[];
        outputsData: string[];
    };
    generateRawTransaction: ({ fee, safeMode, deps, capacityThreshold, changeThreshold, ...params }: RawTransactionParams | ComplexRawTransactoinParams) => CKBComponents.RawTransactionToSign;
    generateDaoDepositTransaction: ({ fromAddress, capacity, fee, cells, }: {
        fromAddress: string;
        capacity: string | bigint;
        fee: string | bigint;
        cells?: CachedCell[] | undefined;
    }) => CKBComponents.RawTransactionToSign;
    generateDaoWithdrawStartTransaction: ({ outPoint, fee, cells, }: {
        outPoint: CKBComponents.OutPoint;
        fee: string | bigint;
        cells?: CachedCell[] | undefined;
    }) => Promise<CKBComponents.RawTransactionToSign>;
    generateDaoWithdrawTransaction: ({ depositOutPoint, withdrawOutPoint, fee, }: {
        depositOutPoint: CKBComponents.OutPoint;
        withdrawOutPoint: CKBComponents.OutPoint;
        fee: string | bigint;
    }) => Promise<CKBComponents.RawTransactionToSign>;
    private absoluteEpochSince;
    private extractPayloadFromAddress;
    private secp256k1DepsShouldBeReady;
    private DAODepsShouldBeReady;
}
export default CKB;
