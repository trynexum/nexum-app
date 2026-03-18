"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useSwitchChain, useReadContract } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ERC8004_ADDRESS, ERC8004_ABI } from "@/lib";

// Helper to extract a human-readable revert reason from Viem errors
function extractRevertReason(error: any): string {
    if (!error) return "Unknown error";
    const msg = error?.shortMessage || error?.message || String(error);
    // Try to extract the revert reason from the message
    const revertMatch = msg.match(/reason:\s*(.+?)(?:\n|$)/i)
        || msg.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i)
        || msg.match(/execution reverted:\s*"?(.+?)"?(?:\n|$)/i);
    if (revertMatch) return revertMatch[1].trim();
    // If it's a short message, return it directly
    if (error?.shortMessage) return error.shortMessage;
    return msg;
}

export default function RegisterAgentModal({ onClose }: { onClose: () => void }) {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

    const [name, setName] = useState("");
    const [category, setCategory] = useState("Code");
    const [bio, setBio] = useState("");

    const { writeContract, data: txHash, isPending, isError, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    // ─── Pre-validation: check if agent is already registered ───
    const { data: agentData } = useReadContract({
        address: ERC8004_ADDRESS,
        abi: ERC8004_ABI,
        functionName: "agents",
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: !!address && isConnected && !isWrongNetwork },
    });

    // agentData is a tuple: [name, bio, category, totalJobs, repScore, isActive, endpointsURI]
    const isAlreadyRegistered = !!agentData && (agentData as any)[5] === true;
    const registeredName = isAlreadyRegistered ? (agentData as any)[0] : "";

    const handleRegister = () => {
        if (!name || !bio) return;
        if (isAlreadyRegistered) return; // blocked by pre-validation
        writeContract({
            address: ERC8004_ADDRESS,
            abi: ERC8004_ABI,
            functionName: "registerAgent",
            args: [name, bio, category, "ipfs://"],
            gas: BigInt(1000000), // registerAgent stores 4 strings on-chain, needs high gas
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
                            This app runs on Base Sepolia Testnet.
                        </div>
                        <button
                            onClick={() => switchChain({ chainId: baseSepolia.id })}
                            disabled={isSwitching}
                            style={{
                                padding: "14px 28px", background: "#F5F4F0", color: "#080808",
                                border: "none", fontFamily: "'DM Mono', monospace",
                                fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em",
                                cursor: isSwitching ? "wait" : "pointer"
                            }}
                        >
                            {isSwitching ? "SWITCHING..." : "SWITCH TO BASE SEPOLIA →"}
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
                                href={`https://sepolia.basescan.org/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "block", marginTop: 12, fontSize: "11px", color: "rgba(245,244,240,0.4)" }}
                            >
                                View on BaseScan ↗
                            </a>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* Pre-validation: already registered warning */}
                        {isAlreadyRegistered && (
                            <div style={{
                                padding: "12px 16px",
                                background: "rgba(250,204,21,0.08)",
                                border: "1px solid rgba(250,204,21,0.25)",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "12px",
                                color: "#facc15",
                            }}>
                                ⚠️ This wallet is already registered as agent <strong>&quot;{registeredName}&quot;</strong>. Each wallet can only register once.
                            </div>
                        )}

                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.5)", marginBottom: 6 }}>
                                AGENT NAME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. CodeSentinel-v2"
                                disabled={isAlreadyRegistered}
                                style={{
                                    width: "100%", padding: "10px 12px",
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,244,240,0.1)",
                                    color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
                                    outline: "none", boxSizing: "border-box",
                                    opacity: isAlreadyRegistered ? 0.4 : 1,
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
                                disabled={isAlreadyRegistered}
                                style={{
                                    width: "100%", padding: "10px 12px",
                                    background: "#0d0d0d", border: "1px solid rgba(245,244,240,0.1)",
                                    color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
                                    outline: "none",
                                    opacity: isAlreadyRegistered ? 0.4 : 1,
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
                                disabled={isAlreadyRegistered}
                                style={{
                                    width: "100%", padding: "10px 12px",
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,244,240,0.1)",
                                    color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
                                    outline: "none", resize: "none", boxSizing: "border-box",
                                    opacity: isAlreadyRegistered ? 0.4 : 1,
                                }}
                            />
                        </div>

                        {isError && (
                            <div style={{
                                fontSize: "12px",
                                color: "#e05e5e",
                                fontFamily: "'DM Mono', monospace",
                                background: "rgba(224,94,94,0.06)",
                                border: "1px solid rgba(224,94,94,0.2)",
                                padding: "10px 14px",
                                wordBreak: "break-word",
                            }}>
                                ❌ {extractRevertReason(error)}
                            </div>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={isPending || isConfirming || !name || !bio || isAlreadyRegistered}
                            style={{
                                padding: "14px", background: "#F5F4F0", color: "#080808",
                                border: "none", fontFamily: "'DM Mono', monospace",
                                fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em",
                                cursor: isPending || isConfirming || isAlreadyRegistered ? "not-allowed" : "pointer",
                                opacity: (!name || !bio || isAlreadyRegistered) ? 0.4 : 1
                            }}
                        >
                            {isAlreadyRegistered ? "ALREADY REGISTERED" : isPending ? "AWAITING SIGNATURE..." : isConfirming ? "CONFIRMING ON-CHAIN..." : "REGISTER ON-CHAIN →"}
                        </button>

                        <div style={{ fontSize: "11px", color: "rgba(245,244,240,0.3)", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                            Network: Base Sepolia Testnet · Requires Base Sepolia ETH for gas
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
