/////////////////////////////////////////////////////////////////////////////////////
//
//  SPDX-License-Identifier: MIT
//
//  ███    ███  ██████  ███    ██ ███████ ██    ██ ██████  ██ ██████  ███████
//  ████  ████ ██    ██ ████   ██ ██       ██  ██  ██   ██ ██ ██   ██ ██
//  ██ ████ ██ ██    ██ ██ ██  ██ █████     ████   ██████  ██ ██████  █████
//  ██  ██  ██ ██    ██ ██  ██ ██ ██         ██    ██      ██ ██      ██
//  ██      ██  ██████  ██   ████ ███████    ██    ██      ██ ██      ███████
//
//  ███████ ████████ ██████  ███████  █████  ███    ███
//  ██         ██    ██   ██ ██      ██   ██ ████  ████
//  ███████    ██    ██████  █████   ███████ ██ ████ ██
//       ██    ██    ██   ██ ██      ██   ██ ██  ██  ██
//  ███████    ██    ██   ██ ███████ ██   ██ ██      ██
//
//  https://moneypipe.xyz
//
/////////////////////////////////////////////////////////////////////////////////////
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

contract Stream is Initializable {
    Member[] private _members;
    address private _fallback;
    uint private _cap;

    struct Member {
        address account;
        uint32 value;
        uint32 total;
    }

    function initialize(Member[] calldata m, address f) public initializer {
        for (uint i = 0; i < m.length; i++) {
            _members.push(m[i]);
        }

        _fallback = f;
    }

    receive() external payable {
        require(_members.length > 0, "1");

        for (uint i = 0; i < _members.length; i++) {
            Member memory member = _members[i];

            // IMPORTANT: ignores failed transfers, collects in fallback
            bool isSuccess = _transfer(
                member.account,
                (msg.value * member.value) / member.total
            );

            // if (isSuccess) {
            //     msgValue -= (msg.value * member.value) / member.total;
            // }
        }

        // failed transfers are accumulated and sent to fallback
        bool _isSuccess = _transfer(_fallback, address(this).balance);

        console.log("is success", _isSuccess);

        console.log("balance is", address(this).balance);
        // console.log("balance is", msgValue);
    }

    function members() external view returns (Member[] memory) {
        return _members;
    }

    function _calculateGasCap() internal view returns (uint) {
        if (_cap != 0) {
            return _cap;
        } else {
            return gasleft();
        }
    }

    // adopted from https://github.com/lexDAO/Kali/blob/main/contracts/libraries/SafeTransferLib.sol
    error TransferFailed();
    function _transfer(address to, uint256 amount) internal returns (bool) {
        bool callStatus;
        uint256 c = _calculateGasCap();
        assembly {
            callStatus := call(c, to, amount, 0, 0, 0, 0)
        }
        // if (!callStatus) revert TransferFailed();
        return callStatus;
    }

    function setHardCap(uint c) external {
        require(msg.sender == _fallback, "only fallback receiver can set hard cap");
        _cap = c;
    }

    function changeFallback(address f) external {
        require(msg.sender == f, "only the fallback receiver can change the fallback receiver");
        _fallback = f;
    }
}
