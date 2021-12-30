// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
//import 'hardhat/console.sol';
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
contract Stream is Initializable {
  Member[] private _members;
  struct Member {
    address account;
    uint32 value;
    uint32 total;
  }
  function initialize(Member[] calldata m) initializer public {
    for(uint i=0; i<m.length; i++) {
      _members.push(m[i]);
    }
  }
  receive () external payable {
    require(_members.length > 0, "1");
    for(uint i=0; i<_members.length; i++) {
      Member memory member = _members[i];
      (bool sent, ) = payable(address(member.account)).call{value: msg.value*member.value/member.total}("");
      require(sent, "2");
    }
  }
  function members() external view returns (Member[] memory) {
    return _members;
  }
}
