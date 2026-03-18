import ERC8004Json from "./ERC8004.json";
import ERC8183Json from "./ERC8183.json";

export const ERC8004_ADDRESS = process.env.NEXT_PUBLIC_ERC8004_ADDRESS as `0x${string}`;
export const ERC8183_ADDRESS = process.env.NEXT_PUBLIC_ERC8183_ADDRESS as `0x${string}`;

export const ERC8004_ABI = ERC8004Json.abi;
export const ERC8183_ABI = ERC8183Json.abi;
