// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract smart_contractBC {
    // === Roles ===
    enum Role { NONE, MANUFACTURER, SUPPLIER, RETAILER }

    address public owner;
    mapping(address => Role) public roles;

    // === Product data ===
    uint256 public productCount;

    struct Product {
        uint256 id;
        string name;
        string ipfsHash;
        address registeredBy;
        address currentOwner;   // who currently holds the product
        bool exists;
    }

    mapping(uint256 => Product) public products;

    event ProductRegistered(
        uint256 indexed id,
        string name,
        string ipfsHash,
        address indexed currentOwner
    );

    event RoleUpdated(address indexed user, Role role);

    event ProductTransferred(
        uint256 indexed id,
        address indexed from,
        address indexed to
    );

    // === Constructor ===
    constructor() {
        owner = msg.sender;
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

    modifier productExists(uint256 _id) {
        require(products[_id].exists, "Product not found");
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

    // Transfer product between actors
    function transferProduct(uint256 _id, address _to)
    public
    productExists(_id)
    {
        Product storage p = products[_id];

        // Only current owner can transfer
        require(msg.sender == p.currentOwner, "Not product owner");

        // Recipient must have a valid role
        require(roles[_to] != Role.NONE, "Recipient has no role");

        address previousOwner = p.currentOwner;
        p.currentOwner = _to;

        emit ProductTransferred(_id, previousOwner, _to);
    }

    // Verify product details
    function verifyProduct(uint256 _id)
    public
    view
    productExists(_id)
    returns (bool, string memory, string memory, address, address)
    {
        Product memory p = products[_id];
        return (true, p.name, p.ipfsHash, p.registeredBy, p.currentOwner);
    }
}

