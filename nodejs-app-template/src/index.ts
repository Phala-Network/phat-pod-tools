(globalThis as any).WebAssembly = undefined;
import '@polkadot/wasm-crypto/initOnlyAsm';
import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { mnemonicGenerate, cryptoWaitReady, signatureVerify } from '@polkadot/util-crypto';

import * as ra from "@phala/ra-report"

const VALIDATOR_CONTRACT_ADDRESS = "0xc5985b7b4ca226195032082eefe741dd746e469ed594c30a662450fbe8aebbdd";

function generateKeyPair(): KeyringPair {
    const keyring = new Keyring({ type: 'sr25519' })
    return keyring.addFromUri(mnemonicGenerate());
}

async function main() {
    console.log("Waiting for crypto...");
    await cryptoWaitReady();
    console.log("Generating key pair...");
    const pair = generateKeyPair();
    const publicKey = pair.publicKey;
    console.log("Getting report...");
    const report = await ra.createRemoteAttestationReport({
        userReportData: Buffer.from(publicKey),
        iasKey: process.env.IAS_API_KEY ?? "",
    });
    console.log("Report: ", report);

    const validatorContract = await ra.Contract.connect({
        rpc: "wss://poc6.phala.network/ws",
        contractId: VALIDATOR_CONTRACT_ADDRESS,
        pair,
        abi: ra.DEFAULT_VALIDATOR_ABI,
    });
    const validateResult = await validatorContract.call('validate', report) as any;
    if (validateResult?.isErr) {
        throw new Error(`Failed to sign the report: ${validateResult.asErr}`);
    }
    const sigOfPubkey = validateResult.asOk.toHex();
    console.log("Signature of public key: ", sigOfPubkey);

    const computedResult = "foo";
    const sigOfComputedResult = pair.sign(computedResult);

    // User verifies the result
    const verifyResult = signatureVerify(computedResult, sigOfComputedResult, publicKey);
}

main().catch(console.error);