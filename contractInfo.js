export const CONTRACT_ADDRESS = "0x70D12394abc043E0C456c8C4b82c59E94516f616";

export const CONTRACT_ABI = [
    // roles
    "function getMyRole() public view returns (uint8)",
    "function setRole(address user, uint8 role) public",

    // products
    "function registerProduct(string _name, string _ipfsHash) public",
    "function getProductDetails(uint256 _id) public view returns uint256,string memory,string memory,address,address)",
    "function products(uint256) public view returns (uint256 id, string name, string ipfsHash, address registeredBy, address currentOwner, bool exists)",
    "function productCount() public view returns (uint256)"

];
