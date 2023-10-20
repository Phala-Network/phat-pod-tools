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
    const pair = testGenerateKeyPair();
    // const pair = generateKeyPair();
    const publicKey = pair.publicKey;
    console.log("Getting report...");
    const report = await testCreateRemoteAttestationReport(publicKey);
    // const report = await ra.createRemoteAttestationReport({
    //     userReportData: Buffer.from(publicKey),
    //     iasKey: process.env.IAS_API_KEY ?? "",
    // });
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

function testGenerateKeyPair(): KeyringPair {
    const keyring = new Keyring({ type: 'sr25519' })
    return keyring.addFromUri('noble insect filter sister depend divide story plate kitchen arrow pencil twist');
}

async function testCreateRemoteAttestationReport(request: any) {
    return {
        report: '{"id":"205172167574384298430678710944144916046","timestamp":"2023-10-20T02:00:55.386460","version":4,"epidPseudonym":"TnbOji9riBrkhR429r3k19eolZQTpS8ZDKlZUEUieqci/sAdv871SfO4S4fcXMh6doegnYsPrZ87aOi4pEL1BtdRgo/OUU5eohWv2yExfVYwvJ0gOWQvZ+ZqvewbpXPds0OSs9kP9WUHyWXgNtRF4Fqqy1lnLMMInlJuGJt/CkA=","advisoryURL":"https://security-center.intel.com","advisoryIDs":["INTEL-SA-00220","INTEL-SA-00270","INTEL-SA-00293","INTEL-SA-00320","INTEL-SA-00329","INTEL-SA-00334","INTEL-SA-00381","INTEL-SA-00389","INTEL-SA-00477","INTEL-SA-00614","INTEL-SA-00615","INTEL-SA-00617","INTEL-SA-00828"],"isvEnclaveQuoteStatus":"GROUP_OUT_OF_DATE","platformInfoBlob":"1502006504000100001515020401800E0000000000000000000D00000C000000020000000000000B564A48E39C930C5776E131C31D1C05FD84C4955186DA990A89707D137EA7CFB5B12E444578A33AB140FBF73FEA91216F13CE3D38D714D8C35E6CA95AC71C801D8E","isvEnclaveQuoteBody":"AgABAFYLAAANAA0AAAAAAEDTN+Go/mqYQBu9Z6iQUBUAAAAAAAAAAAAAAAAAAAAAAhUCBP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAHAAAAAAAAAHek2kmkzBsdt/tE2rcgCvkgAyZYF6xjOS8q2Ry1/j8eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACD1xnnferKFHD2uvYqTXdDA8iZ22kCD5xw7h38CMfOngAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABs4LI0FhAn9KMwULrex0Kelw1xYpeOABlGzgcnEROESQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}',
        signature: 'P1VOugZVodJ97vrZXmBHQ8uY9KynAAyA9WnS3h+Iq4vC1nQ0ethWnkvdNGcbi+RZYYREmUHNBCbTWgzN63A4NIatzw1TpLx/Ei9UA8t/XVKN9lOFT/3b94RDN3bxwI3k6WicD6Zbf1SfdyJ90FUCjZuSvoXm5J8qbWfZwruCZVSk4cqgeBFJuCpANKfrYaoaK+P4Oh6pGQZyx5IgaR0qzoraDIo9gOksba5Bi7rpgXEDitxBBQDiiwRJYItC0Ip8kZhNUcmADAsNXPAjHxgMhOqzo/x/FxdQDI0rdl8JzWcqXzNWOFWiBTJq//pdB2vRs0sxzRghHZ5qkxgApVcLvg==',
        certificate: 'MIIEoTCCAwmgAwIBAgIJANEHdl0yo7CWMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLU2FudGEgQ2xhcmExGjAYBgNVBAoMEUludGVsIENvcnBvcmF0aW9uMTAwLgYDVQQDDCdJbnRlbCBTR1ggQXR0ZXN0YXRpb24gUmVwb3J0IFNpZ25pbmcgQ0EwHhcNMTYxMTIyMDkzNjU4WhcNMjYxMTIwMDkzNjU4WjB7MQswCQYDVQQGEwJVUzELMAkGA1UECAwCQ0ExFDASBgNVBAcMC1NhbnRhIENsYXJhMRowGAYDVQQKDBFJbnRlbCBDb3Jwb3JhdGlvbjEtMCsGA1UEAwwkSW50ZWwgU0dYIEF0dGVzdGF0aW9uIFJlcG9ydCBTaWduaW5nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqXot4OZuphR8nudFrAFiaGxxkgma/Es/BA+tbeCTUR106AL1ENcWA4FX3K+E9BBL0/7X5rj5nIgX/R/1ubhkKWw9gfqPG3KeAtIdcv/uTO1yXv50vqaPvE1CRChvzdS/ZEBqQ5oVvLTPZ3VEicQjlytKgN9cLnxbwtuvLUK7eyRPfJW/ksddOzP8VBBniolYnRCD2jrMRZ8nBM2ZWYwnXnwYeOAHV+W9tOhAImwRwKF/95yAsVwd21ryHMJBcGH70qLagZ7Ttyt++qO/6+KAXJuKwZqjRlEtSEz8gZQeFfVYgcwSfo96oSMAzVr7V0L6HSDLRnpb6xxmbPdqNol4tQIDAQABo4GkMIGhMB8GA1UdIwQYMBaAFHhDe3amfrzQr35CN+s1fDuHAVE8MA4GA1UdDwEB/wQEAwIGwDAMBgNVHRMBAf8EAjAAMGAGA1UdHwRZMFcwVaBToFGGT2h0dHA6Ly90cnVzdGVkc2VydmljZXMuaW50ZWwuY29tL2NvbnRlbnQvQ1JML1NHWC9BdHRlc3RhdGlvblJlcG9ydFNpZ25pbmdDQS5jcmwwDQYJKoZIhvcNAQELBQADggGBAGcIthtcK9IVRz4rRq+ZKE+7k50/OxUsmW8aavOzKb0iCx07YQ9rzi5nU73tME2yGRLzhSViFs/LpFa9lpQL6JL1aQwmDR74TxYGBAIi5f4I5TJoCCEqRHz91kpG6Uvyn2tLmnIdJbPE4vYvWLrtXXfFBSSPD4Afn7+3/XUggAlc7oCTizOfbbtOFlYA4g5KcYgS1J2ZAeMQqbUdZseZCcaZZZn65tdqee8UXZlDvx0+NdO0LR+5pFy+juM0wWbu59MvzcmTXbjsi7HY6zd53Yq5K244fwFHRQ8eOB0IWB+4PfM7FeAApZvlfqlKOlLcZL2uyVmzRkyR5yW72uo9mehX44CiPJ2fse9Y6eQtcfEhMPkmHXI01sN+KwPbpA39+xOsStjhP9N1Y1a2tQAVo+yVgLgV2Hws73Fc0o3wC78qPEA+v2aRs/Be3ZFDgDyghc/1fgU+7C+P6kbqd4poyb6IW8KCJbxfMJvkordNOgOUUxndPHEi/tb/U7uLjLOgPA=='
    }
}

main().catch(console.error);