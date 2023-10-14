// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.0;

interface IDataStore {
    function getUint(bytes32 key) external view returns (uint256);

    function getInt(bytes32 key) external view returns (int256);

    function getAddress(bytes32 key) external view returns (address);

    function getBool(bytes32 key) external view returns (bool);

    function getString(bytes32 key) external view returns (string memory);

    function getBytes32(bytes32 key) external view returns (bytes32);

    function getUintArray(bytes32 key) external view returns (uint256[] memory);

    function getIntArray(bytes32 key) external view returns (int256[] memory);

    function getAddressArray(
        bytes32 key
    ) external view returns (address[] memory);

    function getBoolArray(bytes32 key) external view returns (bool[] memory);

    function getStringArray(
        bytes32 key
    ) external view returns (string[] memory);

    function getBytes32Array(
        bytes32 key
    ) external view returns (bytes32[] memory);

    function getBytes32Count(bytes32 setKey) external view returns (uint256);

    function getBytes32ValuesAt(
        bytes32 setKey,
        uint256 start,
        uint256 end
    ) external view returns (bytes32[] memory);

    function getAddressCount(bytes32 setKey) external view returns (uint256);

    function getAddressValuesAt(
        bytes32 setKey,
        uint256 start,
        uint256 end
    ) external view returns (address[] memory);

    function getUintCount(bytes32 setKey) external view returns (uint256);

    function getUintValuesAt(
        bytes32 setKey,
        uint256 start,
        uint256 end
    ) external view returns (uint256[] memory);
}
