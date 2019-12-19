/// <reference types="../types/global" />
declare type Key = string;
declare type LockHash = string;
declare type TransactionHash = string;
declare type CachedLock = Pick<CachedCell, 'lock'>;
export interface SignWitnesses {
    (key: Key): (params: {
        transactionHash: TransactionHash;
        witnesses: StructuredWitness[];
    }) => StructuredWitness[];
    (key: Map<LockHash, Key>): (params: {
        transactionHash: TransactionHash;
        witnesses: StructuredWitness[];
        inputCells: CachedLock[];
    }) => StructuredWitness[];
    (key: Key | Map<LockHash, Key>): (params: {
        transactionHash: TransactionHash;
        witnesses: StructuredWitness[];
        inputCells?: CachedLock[];
    }) => StructuredWitness[];
}
export declare const isMap: <K = any, V = any>(val: any) => val is Map<K, V>;
declare const signWitnesses: SignWitnesses;
export default signWitnesses;
