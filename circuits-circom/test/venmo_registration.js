const chai = require("chai");
const path = require("path");
const crypto = require("crypto");
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);
const buildPoseidon = require("circomlibjs").buildPoseidonOpt;

const assert = chai.assert;

const wasm_tester = require("circom_tester").wasm;

const fs = require('fs');


// TODO: move helpers into utils, update to use TS
function buffer2bitArray(b) {
    const res = [];
    for (let i = 0; i < b.length; i++) {
        for (let j = 0; j < 8; j++) {
            res.push((b[i] >> (7 - j) & 1));
        }
    }
    return res;
}

function bitArray2buffer(a) {
    const len = Math.floor((a.length - 1) / 8) + 1;
    const b = new Buffer.alloc(len);

    for (let i = 0; i < a.length; i++) {
        const p = Math.floor(i / 8);
        b[p] = b[p] | (Number(a[i]) << (7 - (i % 8)));
    }
    return b;
}

function bytesToPacked(arr) {
    // Convert into bigint from string
    let arrInt = arr.map(BigInt);
    let n = arrInt.length;
    let out = BigInt(0);
    for (let k = 0; k < n; k++) {
        out += arrInt[k] * BigInt(2 ** (8 * k));  // little endian
    }
    return out;
}

function chunkArray(arr, chunkSize, length) {
    let chunks = [];
    for (let i = 0; i < length; i += chunkSize) {
        let chunk = arr.slice(i, i + chunkSize);
        if (chunk.length < chunkSize) {
            chunk = chunk.concat(new Array(chunkSize - chunk.length).fill('0'));
        }
        chunks.push(chunk);
    }
    return chunks;
}

describe("Venmo Registration", function () {
    this.timeout(100000);

    let cir;
    let poseidon;

    before(async () => {
        cir = await wasm_tester(
            path.join(__dirname, "../venmo_registration.circom"),
            {
                include: path.join(__dirname, "../node_modules"),
                output: path.join(__dirname, "../build/venmo_registration"),
                recompile: false, // setting this to true will recompile the circuit (~3-5min)
                verbose: true,
            }
        );

        poseidon = await buildPoseidon();
    });


    it("Should generate witnesses", async () => {
        // To preserve privacy of emails, load inputs generated using `yarn gen-input`. Ping us if you want an example venmo_send.eml to run tests 
        // Otherwise, you can download the original eml from any Venmo send payment transaction
        const venmo_path = path.join(__dirname, "../inputs/input_venmo_registration.json");
        const jsonString = fs.readFileSync(venmo_path, "utf8");
        const input = JSON.parse(jsonString);
        const witness = await cir.calculateWitness(
            input,
            true
        );

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    }).timeout(1000000);

    it("Should return the correct packed from email", async () => {
        // To preserve privacy of emails, load inputs generated using `yarn gen-input`. Ping us if you want an example venmo_send.eml to run tests 
        // Otherwise, you can download the original eml from any Venmo send payment transaction
        const venmo_path = path.join(__dirname, "../inputs/input_venmo_registration.json");
        const jsonString = fs.readFileSync(venmo_path, "utf8");
        const input = JSON.parse(jsonString);
        const witness = await cir.calculateWitness(
            input,
            true
        );

        // Get returned packed from email
        // Indexes 1 to 6 represent the packed from email (30 bytes \ 7)
        const packed_from_email = witness.slice(1, 6);

        // Get expected packed from email
        const regex_start = Number(input["email_from_idx"]);
        const regex_start_sub_array = input["in_padded"].slice(regex_start);
        const regex_end = regex_start_sub_array.indexOf("62"); // Look for `>` to end the from which is 62 in ascii. e.g. `from:<venmo@venmo.com>`
        const from_email_array = regex_start_sub_array.slice(0, regex_end);

        // Chunk bytes into 7 and pack
        let chunkedArrays = chunkArray(from_email_array, 7, 30);

        chunkedArrays.map((arr, i) => {
            // Pack each chunk
            let expectedValue = bytesToPacked(arr);

            // Check packed email is the same
            assert.equal(expectedValue, packed_from_email[i], true);
        });
    }).timeout(1000000);

    it("Should return the correct packed offramper id", async () => {
        // To preserve privacy of emails, load inputs generated using `yarn gen-input`. Ping us if you want an example venmo_send.eml to run tests 
        // Otherwise, you can download the original eml from any Venmo send payment transaction
        const venmo_path = path.join(__dirname, "../inputs/input_venmo_registration.json");
        const jsonString = fs.readFileSync(venmo_path, "utf8");
        const input = JSON.parse(jsonString);
        const witness = await cir.calculateWitness(
            input,
            true
        );

        // Get returned packed offramper_id
        // Indexes 6 to 11 represent the packed actor_id (30 bytes \ 7)
        const packed_actor_id = witness.slice(6, 11);

        // Get expected packed offramper_id
        const regex_start = Number(input["venmo_actor_id_idx"]);
        const regex_start_sub_array = input["in_body_padded"].slice(regex_start);
        const regex_end = regex_start_sub_array.indexOf("34"); // Look for `"` to end the actor_id which is 34 in ascii 
        const actor_id_array = regex_start_sub_array.slice(0, regex_end);

        // Chunk bytes into 7 and pack
        let chunkedArrays = chunkArray(actor_id_array, 7, 30);

        chunkedArrays.map((arr, i) => {
            // Pack each chunk
            let expectedValue = bytesToPacked(arr);

            // Check packed actor_id is the same
            assert.equal(expectedValue, packed_actor_id[i], true);
        });
    }).timeout(1000000);

    it("Should return the correct hashed actor id", async () => {
        // To preserve privacy of emails, load inputs generated using `yarn gen-input`. Ping us if you want an example venmo_send.eml to run tests 
        // Otherwise, you can download the original eml from any Venmo send payment transaction
        const venmo_path = path.join(__dirname, "../inputs/input_venmo_registration.json");
        const jsonString = fs.readFileSync(venmo_path, "utf8");
        const input = JSON.parse(jsonString);
        const witness = await cir.calculateWitness(
            input,
            true
        );

        // Get returned hashed actor_id
        // Indexes 11 represents the hashed actor_id
        const hashed_actor_id = witness[11];

        // Get expected hashed actor_id
        const packed_actor_id = witness.slice(6, 11);
        const expected_hash = poseidon(packed_actor_id);

        assert.equal(JSON.stringify(poseidon.F.e(hashed_actor_id)), JSON.stringify(expected_hash), true);
    }).timeout(1000000);

    it("Should return the correct modulus", async () => {
        // To preserve privacy of emails, load inputs generated using `yarn gen-input`. Ping us if you want an example venmo_send.eml to run tests 
        // Otherwise, you can download the original eml from any Venmo send payment transaction
        const venmo_path = path.join(__dirname, "../inputs/input_venmo_registration.json");
        const jsonString = fs.readFileSync(venmo_path, "utf8");
        const input = JSON.parse(jsonString);
        const witness = await cir.calculateWitness(
            input,
            true
        );

        // Get returned modulus
        const modulus = witness.slice(12, 29);

        // Get expected modulus
        const expected_modulus = input["modulus"];

        assert.equal(JSON.stringify(modulus), JSON.stringify(expected_modulus), true);
    }).timeout(1000000);

    it("Should return the correct signature", async () => {
        // To preserve privacy of emails, load inputs generated using `yarn gen-input`. Ping us if you want an example venmo_send.eml to run tests 
        // Otherwise, you can download the original eml from any Venmo send payment transaction
        const venmo_path = path.join(__dirname, "../inputs/input_venmo_registration.json");
        const jsonString = fs.readFileSync(venmo_path, "utf8");
        const input = JSON.parse(jsonString);
        const witness = await cir.calculateWitness(
            input,
            true
        );

        // Get returned signature
        const signature = witness.slice(29, 46);

        // Get expected signature
        const expected_signature = input["signature"];

        assert.equal(JSON.stringify(signature), JSON.stringify(expected_signature), true);
    }).timeout(1000000);
});