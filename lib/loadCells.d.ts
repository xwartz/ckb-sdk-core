/// <reference types="../types/global" />
import RPC from '@nervosnetwork/ckb-sdk-rpc';
declare const loadCells: ({ lockHash, start, end, STEP, rpc, }: {
    lockHash: string;
    start?: string | bigint | undefined;
    end?: string | bigint | undefined;
    STEP?: string | bigint | undefined;
    rpc: RPC;
}) => Promise<CachedCell[]>;
export default loadCells;
