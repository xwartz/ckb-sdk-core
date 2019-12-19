/// <reference types="@nervosnetwork/ckb-types" />
declare const signWitnessGroup: (sk: string, transactionHash: string, witnessGroup: (string | CKBComponents.WitnessArgs)[]) => (string | CKBComponents.WitnessArgs)[];
export default signWitnessGroup;
