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
contract Stream is Initializable {
  Member[] private _members;
  struct Member {
    address account;
    uint32 value;
    uint32 total;
  }
  function initialize(Member[] calldata m) initializer public {
    for(uint i=0; i<m.length; ++i) {
      _members.push(m[i]);
    }
  }
  receive () external payable {
    require(_members.length > 0, "1");
    for(uint i=0; i<_members.length; ++i) {
      Member memory member = _members[i];
      _transfer(member.account, msg.value * member.value / member.total);
    }
  }
  function members() external view returns (Member[] memory) {
    return _members;
  }
  // adopted from https://github.com/lexDAO/Kali/blob/main/contracts/libraries/SafeTransferLib.sol
  error TransferFailed();
  function _transfer(address to, uint256 amount) internal {
    bool callStatus;
    assembly {
      callStatus := call(gas(), to, amount, 0, 0, 0, 0)
    }
    if (!callStatus) revert TransferFailed();
  }
}
