//SPDX-License-Identifier: MIT

import { StringUtils } from "@zk-email/contracts/utils/StringUtils.sol";

import { BaseProcessorV2 } from "../../processors/BaseProcessorV2.sol";
import { Groth16Verifier } from "../../verifiers/venmo_send_verifier_v2.sol";
import { IKeyHashAdapterV2 } from "../../processors/keyHashAdapters/IKeyHashAdapterV2.sol";
import { INullifierRegistry } from "../../processors/nullifierRegistries/INullifierRegistry.sol";
import { ISendProcessor } from "../venmo-v1/interfaces/ISendProcessor.sol";
import { StringConversionUtils } from "../../lib/StringConversionUtils.sol";

pragma solidity ^0.8.18;

contract VenmoSendProcessorV2 is Groth16Verifier, ISendProcessor, BaseProcessorV2 {
    
    using StringUtils for uint256[];
    using StringConversionUtils for string;

    /* ============ Constants ============ */
    uint256 constant public PACK_SIZE = 7;

    /* ============ Constructor ============ */
    constructor(
        address _ramp,
        IKeyHashAdapterV2 _venmoMailserverKeyHashAdapter,
        INullifierRegistry _nullifierRegistry,
        string memory _emailFromAddress,
        uint256 _timestampBuffer
    )
        Groth16Verifier()
        BaseProcessorV2(
            _ramp,
            _venmoMailserverKeyHashAdapter,
            _nullifierRegistry,
            _emailFromAddress,
            _timestampBuffer
        )
    {}
    
    /* ============ External Functions ============ */
    function processProof(
        ISendProcessor.SendProof calldata _proof
    )
        public
        override
        onlyRamp
        returns(uint256 amount, uint256 timestamp, bytes32 offRamperIdHash, bytes32 onRamperIdHash, bytes32 intentHash)
    {
        require(this.verifyProof(_proof.a, _proof.b, _proof.c, _proof.signals), "Invalid Proof"); // checks effects iteractions, this should come first

        require(isMailServerKeyHash(bytes32(_proof.signals[0])), "Invalid mailserver key hash");

        // Signals [1:4] are the packed from email address
        string memory fromEmail = _parseSignalArray(_proof.signals, 1, 4);
        require(keccak256(abi.encodePacked(fromEmail)) == keccak256(emailFromAddress), "Invalid email from address");

        // Signals [4:5] is the packed amount, since this is a USDC amount we want to make sure the returned number is
        // properly padded to 6 decimals. If the parsed has more than 6 figures to the right of the decimal it will revert
        amount = _parseSignalArray(_proof.signals, 4, 6).stringToUint(6);

        // Signals [5:7] are the packed timestamp, we do not expect there to be any decimal places in this number so we
        // specify 0 decimals, if any decimal appears this function will revert
        // Add the buffer to build in flexibility with L2 timestamps
        timestamp = _parseSignalArray(_proof.signals, 6, 8).stringToUint(0) + timestampBuffer;

        // Signals [8] is the packed offRamperIdHash
        offRamperIdHash = bytes32(_proof.signals[8]);

        // Signals [9] is the packed onRamperIdHash
        onRamperIdHash = bytes32(_proof.signals[9]);

        // Check if email has been used previously, if not nullify it so it can't be used again
        _validateAndAddNullifier(bytes32(_proof.signals[10]));

        // Signals [11] is intentHash
        intentHash = bytes32(_proof.signals[11]);
    }

    /* ============ Internal Functions ============ */

    function _parseSignalArray(uint256[12] calldata _signals, uint8 _from, uint8 _to) internal pure returns (string memory) {
        uint256[] memory signalArray = new uint256[](_to - _from);
        for (uint256 i = _from; i < _to; i++) {
            signalArray[i - _from] = _signals[i];
        }

        return signalArray.convertPackedBytesToString(signalArray.length * PACK_SIZE, PACK_SIZE);
    }
}
