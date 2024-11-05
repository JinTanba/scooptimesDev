// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 

contract PositionToken is ERC20 {
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) ERC20(_name, _symbol) {
        _mint(msg.sender, _totalSupply);
    }
}