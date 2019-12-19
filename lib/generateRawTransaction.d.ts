/// <reference types="../types/global" />
/// <reference types="@nervosnetwork/ckb-types" />
declare type LockHash = string;
declare type PublicKeyHash = string;
declare type Capacity = string | bigint;
export declare type Cell = Pick<CachedCell, 'dataHash' | 'type' | 'capacity' | 'outPoint'>;
export interface RawTransactionParamsBase {
    fee?: Capacity;
    safeMode: boolean;
    deps: DepCellInfo;
    capacityThreshold?: Capacity;
    changeThreshold?: Capacity;
    changePublicKeyHash?: PublicKeyHash;
}
interface RawTransactionParams extends RawTransactionParamsBase {
    fromPublicKeyHash: PublicKeyHash;
    toPublicKeyHash: PublicKeyHash;
    capacity: Capacity;
    cells?: Cell[];
}
interface ComplexRawTransactionParams extends RawTransactionParamsBase {
    fromPublicKeyHashes: PublicKeyHash[];
    receivePairs: {
        publicKeyHash: PublicKeyHash;
        capacity: Capacity;
    }[];
    cells: Map<LockHash, CachedCell[]>;
}
declare const generateRawTransaction: ({ fee, changePublicKeyHash, safeMode, deps, capacityThreshold, changeThreshold, ...params }: RawTransactionParams | ComplexRawTransactionParams) => CKBComponents.RawTransactionToSign;
export default generateRawTransaction;
