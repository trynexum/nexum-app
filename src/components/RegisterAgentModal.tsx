"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ERC8004_ADDRESS, ERC8004_ABI } from "@/abis";

export default function RegisterAgentModal({ onClose }: { onClose: () => void }) {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const isWrongNetwork = isConnected && chainId !== sepolia.id;

    const [name, setName] = useState("");
    const [category, setCategory] = useState("Code");
    const [bio, setBio] = useState("");

    const { writeContract, data: txHash, isPending, isError, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    const handleRegister = () => {
        if (!name || !bio) return;
        writeContract({
            address: ERC8004_ADDRESS,
            abi: ERC8004_ABI,
            functionName: "registerAgent",
            args: [name, bio, category, "ipfs://"],
        });
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(6px)"
        }}>
            <div style={{
                background: "#0d0d0d",
                border: "1px solid rgba(245,244,240,0.1)",
                padding: "40px",
                maxWidth: "480px",
                width: "90%",
                position: "relative"
            }}>
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                >✕</button>

                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.4)", marginBottom: 8 }}>
                    ERC-8004 / REGISTER_AGENT
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "28px", color: "#F5F4F0" }}>
                    Register as<br /><em>an Agent</em>
                </h2>

                {!isConnected ? (
                    <div style={{ color: "rgba(245,244,240,0.5)", textAlign: "center", padding: "20px" }}>
                        Please connect your wallet first to register.
                    </div>
                ) : isWrongNetwork ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", marginBottom: "20px", color: "rgba(245,244,240,0.6)" }}>
                            You are on the wrong network.<br />
                            This app runs on Sepolia Testnet.
                        </div>
                        <button
                            onClick={() => switchChain({ chainId: sepolia.id })}
                            disabled={isSwitching}
                            style={{
                                padding: "14px 28px", background: "#F5F4F0", color: "#080808",
                                border: "none", fontFamily: "'DM Mono', monospace",
                                fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em",
                                cursor: isSwitching ? "wait" : "pointer"
                            }}
                        >
                            {isSwitching ? "SWITCHING..." : "SWITCH TO SEPOLIA →"}
                        </button>
                    </div>
                ) : isSuccess ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px" }}>
                            Agent successfully registered on-chain!
                        </div>
                        {txHash && (
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "block", marginTop: 12, fontSize: "11px", color: "rgba(245,244,240,0.4)" }}
                            >
                                View on Etherscan ↗
                            </a>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.5)", marginBottom: 6 }}>
                                AGENT NAME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. CodeSentinel-v2"
                                style={{
                                    width: "100%", padding: "10px 12px",
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,244,240,0.1)",
                                    color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
                                    outline: "none", boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.5)", marginBottom: 6 }}>
                                CATEGORY
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px 12px",
                                    background: "#0d0d0d", border: "1px solid rgba(245,244,240,0.1)",
                                    color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
                                    outline: "none"
                                }}
                            >
                                <option value="Code">Code / Audit</option>
                                <option value="Finance">Finance / DeFi</option>
                                <option value="Creative">Creative / Image</option>
                                <option value="Data">Data / Transform</option>
                                <option value="Legal">Legal / Analysis</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.5)", marginBottom: 6 }}>
                                CAPABILITIES / BIO
                            </label>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={3}
                                placeholder="Describe what your agent can do..."
                                style={{
                                    width: "100%", padding: "10px 12px",
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,244,240,0.1)",
                                    color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
                                    outline: "none", resize: "none", boxSizing: "border-box"
                                }}
                            />
                        </div>

                        {isError && (
                            <div style={{ fontSize: "12px", color: "#e05e5e", fontFamily: "'DM Mono', monospace" }}>
                                ⚠️ {error?.message?.slice(0, 120)}
                            </div>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={isPending || isConfirming || !name || !bio}
                            style={{
                                padding: "14px", background: "#F5F4F0", color: "#080808",
                                border: "none", fontFamily: "'DM Mono', monospace",
                                fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em",
                                cursor: isPending || isConfirming ? "wait" : "pointer",
                                opacity: (!name || !bio) ? 0.4 : 1
                            }}
                        >
                            {isPending ? "AWAITING SIGNATURE..." : isConfirming ? "CONFIRMING ON-CHAIN..." : "REGISTER ON-CHAIN →"}
                        </button>

                        <div style={{ fontSize: "11px", color: "rgba(245,244,240,0.3)", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                            Network: Sepolia Testnet · Requires Sepolia ETH for gas
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
