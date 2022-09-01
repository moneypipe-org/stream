// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Test {
    receive() external payable {}

    function withdrawFail1(address addr) external payable {
        bool success = payable(addr).send(address(this).balance);
        require(success, "ran out of gas");
    }

    function withdrawFail2(address addr) external payable {
        payable(addr).transfer(address(this).balance);
    }

    function withdrawSuccess(address addr) external payable {
        (bool success, ) = payable(address(addr)).call{
            value: address(this).balance
        }("");
        require(success);
    }
}
