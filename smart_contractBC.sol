// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract smart_contractBC {
    // === Roles ===
    enum Role { NONE, MANUFACTURER, SUPPLIER, RETAILER }

    address public owner;              // admin who manages roles
    mapping(address => Role) public roles;

    // === Product data ===
    uint256 public productCount;

    struct Product {
        uint256 id;
        string name;
        string ipfsHash;
        address registeredBy;
        bool exists;
    }

    mapping(uint256 => Product) public products;

    event ProductRegistered(
        uint256 indexed id,
        string name,
        string ipfsHash,
        address indexed registeredBy
    );

    event RoleUpdated(address indexed user, Role role);

    // === Constructor ===
    constructor() {
        owner = msg.sender;
        // The deployer is Manufacturer by default
        roles[msg.sender] = Role.MANUFACTURER;
    }

    // === Modifiers ===
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyRole(Role r) {
        require(roles[msg.sender] == r, "Forbidden: wrong role");
        _;
    }

    // === Role management ===
    function setRole(address user, Role role) external onlyOwner {
        roles[user] = role;
        emit RoleUpdated(user, role);
    }

    function getMyRole() external view returns (Role) {
        return roles[msg.sender];
    }

    // === Product functions ===

    // Manufacturer registers product (same as your old registerProduct, but role‑based)
    function registerProduct(
        string memory _name,
        string memory _ipfsHash
    ) public onlyRole(Role.MANUFACTURER) {
        productCount++;

        products[productCount] = Product(
            productCount,
            _name,
            _ipfsHash,
            msg.sender,
            true
        );

        emit ProductRegistered(
            productCount,
            _name,
            _ipfsHash,
            msg.sender
        );
    }

    // Anyone (Client, Supplier, Retailer, etc.) can verify
    function verifyProduct(uint256 _id)
    public
    view
    returns (bool, string memory, string memory)
    {
        require(products[_id].exists, "Product not found");

        Product memory p = products[_id];
        return (true, p.name, p.ipfsHash);
    }
}
