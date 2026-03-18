"use client";

import { useState } from "react";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
    useChainId,
    useSwitchChain,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ERC8183_ADDRESS, ERC8183_ABI } from "@/lib";

export default function SubmitWorkModal({ onClose, defaultJobId }: { onClose: () => void; defaultJobId?: string }) {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

    const [jobId, setJobId] = useState(defaultJobId || "");
    const [resultURI, setResultURI] = useState("");

    const { writeContract, data: txHash, isPending, isError, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    const handleSubmit = () => {
        if (!jobId || !resultURI) return;
        writeContract({
            address: ERC8183_ADDRESS,
            abi: ERC8183_ABI,
            functionName: "submitWork",
            args: [BigInt(jobId), resultURI],
        });
    };

    const inputStyle = {
        width: "100%", padding: "10px 12px",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,244,240,0.1)",
        color: "#F5F4F0", fontFamily: "'DM Mono', monospace", fontSize: "13px",
        outline: "none", boxSizing: "border-box" as const,
    };

    const labelStyle = {
        display: "block", fontFamily: "'DM Mono', monospace",
        fontSize: "11px", color: "rgba(245,244,240,0.5)", marginBottom: 6,
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(6px)",
        }}>
            <div style={{
                background: "#0d0d0d",
                border: "1px solid rgba(245,244,240,0.1)",
                padding: "40px",
                maxWidth: "480px",
                width: "90%",
                position: "relative",
            }}>
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                >✕</button>

                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.4)", marginBottom: 8 }}>
                    ERC-8183 / SUBMIT_WORK
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "28px", color: "#F5F4F0" }}>
                    Submit<br /><em>Deliverable</em>
                </h2>

                {!isConnected ? (
                    <div style={{ color: "rgba(245,244,240,0.5)", textAlign: "center", padding: "20px" }}>
                        Please connect your wallet first to submit work.
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
                                cursor: isSwitching ? "wait" : "pointer",
                            }}
                        >
                            {isSwitching ? "SWITCHING..." : "SWITCH TO BASE SEPOLIA →"}
                        </button>
                    </div>
                ) : isSuccess ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px" }}>
                            Work submitted on-chain! Awaiting evaluation.
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
                        <div>
                            <label style={labelStyle}>JOB ID *</label>
                            <input
                                type="number"
                                value={jobId}
                                onChange={e => setJobId(e.target.value)}
                                placeholder="e.g. 1"
                                disabled={isPending || isConfirming}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>RESULT / DELIVERABLE URI *</label>
                            <textarea
                                value={resultURI}
                                onChange={e => setResultURI(e.target.value)}
                                rows={3}
                                placeholder="IPFS URI, URL, or description of completed work..."
                                disabled={isPending || isConfirming}
                                style={{ ...inputStyle, resize: "none" }}
                            />
                        </div>

                        {isError && (
                            <div style={{ fontSize: "12px", color: "#e05e5e", fontFamily: "'DM Mono', monospace" }}>
                                ⚠️ {error?.message?.slice(0, 120)}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isPending || isConfirming || !jobId || !resultURI}
                            style={{
                                padding: "14px", background: "#F5F4F0", color: "#080808",
                                border: "none", fontFamily: "'DM Mono', monospace",
                                fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em",
                                cursor: isPending || isConfirming ? "wait" : "pointer",
                                opacity: (!jobId || !resultURI) ? 0.4 : 1,
                            }}
                        >
                            {isPending ? "AWAITING SIGNATURE..." : isConfirming ? "CONFIRMING ON-CHAIN..." : "SUBMIT WORK →"}
                        </button>

                        <div style={{ fontSize: "11px", color: "rgba(245,244,240,0.3)", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                            Only the assigned provider can submit work · Base Sepolia
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
