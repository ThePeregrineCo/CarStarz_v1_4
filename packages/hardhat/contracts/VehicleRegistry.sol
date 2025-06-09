// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VehicleRegistry
 * @dev ERC721 token representing vehicle ownership with gas optimizations
 */
contract VehicleRegistry is ERC721, ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Struct to store vehicle information
    struct Vehicle {
        string vin;
        string name;
        string metadataURI;
    }

    // Mapping from tokenId to Vehicle
    mapping(uint256 => Vehicle) public vehicles;
    
    // New mappings for VIN tracking
    mapping(uint256 => string) public tokenIdToVin;
    mapping(string => uint256) public vinToTokenId;

    // Events
    event VehicleRegistered(address indexed owner, string vin, string name, string metadataURI, uint256 tokenId);
    event VehicleTransferred(address indexed from, address indexed to, string vin, uint256 tokenId);

    constructor() ERC721("Carstarz Vehicle", "CARZ") {}

    /**
     * @dev Mint a new vehicle with specified token ID
     * @param tokenId The token ID to mint
     * @param vin The Vehicle Identification Number
     * @param name The name of the vehicle
     * @param metadataURI The URI of the vehicle's metadata
     */
    function mintVehicleWithId(
        uint256 tokenId,
        string memory vin,
        string memory name,
        string memory metadataURI
    ) public {
        require(!_exists(tokenId), "Token ID already exists");
        require(vinToTokenId[vin] == 0, "VIN already registered");

        _safeMint(msg.sender, tokenId);
        vehicles[tokenId] = Vehicle(vin, name, metadataURI);
        tokenIdToVin[tokenId] = vin;
        vinToTokenId[vin] = tokenId;

        emit VehicleRegistered(msg.sender, vin, name, metadataURI, tokenId);
    }

    /**
     * @dev Get vehicle information by token ID
     * @param tokenId The token ID
     */
    function getVehicleByTokenId(uint256 tokenId) public view returns (Vehicle memory) {
        require(_exists(tokenId), "Token does not exist");
        return vehicles[tokenId];
    }

    /**
     * @dev Get vehicle information by VIN
     * @param vin The Vehicle Identification Number
     */
    function getVehicleByVin(string memory vin) public view returns (Vehicle memory) {
        uint256 tokenId = vinToTokenId[vin];
        require(tokenId != 0, "Vehicle not registered");
        return vehicles[tokenId];
    }

    /**
     * @dev Get vehicle owner by VIN
     * @param vin The Vehicle Identification Number
     */
    function getVehicleOwnerByVin(string memory vin) public view returns (address) {
        uint256 tokenId = vinToTokenId[vin];
        require(tokenId != 0, "Vehicle not registered");
        return ownerOf(tokenId);
    }

    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId The token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return vehicles[tokenId].metadataURI;
    }

    /**
     * @dev Override transfer function to update vehicle ownership
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0)) {
            Vehicle memory vehicle = vehicles[tokenId];
            emit VehicleTransferred(from, to, vehicle.vin, tokenId);
        }
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 