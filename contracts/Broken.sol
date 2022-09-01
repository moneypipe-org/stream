// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Broken {
    receive() external payable {
        revert("NOT ACCEPTING TRANSFERS");
    }

}
