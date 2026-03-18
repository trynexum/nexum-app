"use client";

import { useState, useEffect } from "react";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
    useChainId,
    useSwitchChain,
    useReadContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { parseEther, isAddress } from "viem";
import { ERC8183_ADDRESS, ERC8183_ABI, ERC8004_ADDRESS, ERC8004_ABI } from "@/lib";

// WETH on Base Sepolia (OP Stack canonical address)
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as `0x${string}`;

// Minimal ERC-20 ABI for approve + allowance + deposit (WETH wrapping)
const WETH_ABI = [
    { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
    { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "deposit", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

type Step = "form" | "wrapping" | "approving" | "creating" | "success";

// Helper to extract a human-readable revert reason from Viem errors
function extractRevertReason(error: any): string {
    if (!error) return "Unknown error";
    const msg = error?.shortMessage || error?.message || String(error);
    const revertMatch = msg.match(/reason:\s*(.+?)(?:\n|$)/i)
        || msg.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i)
        || msg.match(/execution reverted:\s*"?(.+?)"?(?:\n|$)/i);
    if (revertMatch) return revertMatch[1].trim();
    if (error?.shortMessage) return error.shortMessage;
    return msg;
}

export default function CreateJobModal({ onClose, defaultProvider }: { onClose: () => void; defaultProvider?: string }) {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

    // ─── Form state ───
    const [provider, setProvider] = useState(defaultProvider || "");
    const [evaluator, setEvaluator] = useState("");
    const [amountStr, setAmountStr] = useState("0.001");
    const [specURI, setSpecURI] = useState("");
    const [deadline, setDeadline] = useState("7");
    const [step, setStep] = useState<Step>("form");
    const [errorMsg, setErrorMsg] = useState("");

    // ─── Contract writes ───
    const { writeContract: wrapEth, data: wrapTxHash, isPending: isWrapPending } = useWriteContract();
    const { isLoading: isWrapConfirming, isSuccess: isWrapDone } = useWaitForTransactionReceipt({ hash: wrapTxHash });

    const { writeContract: approveWeth, data: approveTxHash, isPending: isApprovePending } = useWriteContract();
    const { isLoading: isApproveConfirming, isSuccess: isApproveDone } = useWaitForTransactionReceipt({ hash: approveTxHash });

    const { writeContract: createJob, data: createTxHash, isPending: isCreatePending, isError: isCreateError, error: createError } = useWriteContract();
    const { isLoading: isCreateConfirming, isSuccess: isCreateDone } = useWaitForTransactionReceipt({ hash: createTxHash });

    // ─── Read allowance ───
    const { data: allowanceData } = useReadContract({
        address: WETH_ADDRESS,
        abi: WETH_ABI,
        functionName: "allowance",
        args: address ? [address, ERC8183_ADDRESS] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: !!address },
    });

    // ─── Read WETH balance ───
    const { data: wethBalance } = useReadContract({
        address: WETH_ADDRESS,
        abi: WETH_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: !!address },
    });

    // ─── Pre-validation: check if provider is a registered agent ───
    const isValidProviderAddress = provider ? isAddress(provider) : false;
    const { data: providerAgentData } = useReadContract({
        address: ERC8004_ADDRESS,
        abi: ERC8004_ABI,
        functionName: "agents",
        args: isValidProviderAddress ? [provider as `0x${string}`] : undefined,
        chainId: baseSepolia.id,
        query: { enabled: isValidProviderAddress && isConnected && !isWrongNetwork },
    });

    // agentData is a tuple: [name, bio, category, totalJobs, repScore, isActive, endpointsURI]
    const isProviderRegistered = !!providerAgentData && (providerAgentData as any)[5] === true;
    const providerName: string = isProviderRegistered ? String((providerAgentData as any)[0]) : "";

    // Pre-validation messages
    const getValidationError = (): string | null => {
        if (provider && !isValidProviderAddress) return "Invalid provider address format.";
        if (provider && isValidProviderAddress && providerAgentData && !isProviderRegistered) {
            return "This provider is not a registered agent. They must register first.";
        }
        return null;
    };

    const validationError = getValidationError();

    const handleSubmit = async () => {
        setErrorMsg("");
        if (!provider || !specURI || !amountStr) {
            setErrorMsg("Please fill all required fields.");
            return;
        }
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        try {
            const amountWei = parseEther(amountStr);
            const currentAllowance = BigInt(allowanceData?.toString() ?? "0");
            const currentBalance = BigInt(wethBalance?.toString() ?? "0");

            // Step 1: If not enough WETH balance, wrap ETH first
            if (currentBalance < amountWei) {
                setStep("wrapping");
                wrapEth(
                    {
                        address: WETH_ADDRESS,
                        abi: WETH_ABI,
                        functionName: "deposit",
                        value: amountWei,
                        gas: BigInt(100000),
                    },
                    {
                        onError: (err) => {
                            setErrorMsg(extractRevertReason(err));
                            setStep("form");
                        },
                    }
                );
                return;
            }

            // Step 2: If allowance not enough, approve
            if (currentAllowance < amountWei) {
                doApprove(amountWei);
                return;
            }

            // Step 3: Create the job
            doCreateJob(amountWei);
        } catch (err: any) {
            setErrorMsg(extractRevertReason(err));
            setStep("form");
        }
    };

    const doApprove = (amountWei: bigint) => {
        setStep("approving");
        approveWeth(
            {
                address: WETH_ADDRESS,
                abi: WETH_ABI,
                functionName: "approve",
                args: [ERC8183_ADDRESS, amountWei],
                gas: BigInt(100000),
            },
            {
                onError: (err) => {
                    setErrorMsg(extractRevertReason(err));
                    setStep("form");
                },
            }
        );
    };

    const doCreateJob = (amountWei: bigint) => {
        setStep("creating");
        createJob(
            {
                address: ERC8183_ADDRESS,
                abi: ERC8183_ABI,
                functionName: "createAndFundJob",
                args: [
                    provider as `0x${string}`,
                    (evaluator || provider) as `0x${string}`, // default evaluator = provider if not set
                    WETH_ADDRESS,
                    amountWei,
                    specURI,
                    BigInt(deadline || "7"),
                ],
                gas: BigInt(1000000),
            },
            {
                onSuccess: () => setStep("success"),
                onError: (err) => {
                    setErrorMsg(extractRevertReason(err));
                    setStep("form");
                },
            }
        );
    };

    // Effect to sequence transactions when wrap is done
    useEffect(() => {
        if (isWrapDone && step === "wrapping") {
            try {
                doApprove(parseEther(amountStr));
            } catch (e) { }
        }
    }, [isWrapDone, step]);

    // Effect to sequence transactions when approve is done
    useEffect(() => {
        if (isApproveDone && step === "approving") {
            try {
                doCreateJob(parseEther(amountStr));
            } catch (e) { }
        }
    }, [isApproveDone, step]);

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

    const isProcessing = step !== "form" && step !== "success";

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
                maxWidth: "520px",
                width: "90%",
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
            }}>
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                >✕</button>

                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(245,244,240,0.4)", marginBottom: 8 }}>
                    ERC-8183 / CREATE_AND_FUND_JOB
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "28px", color: "#F5F4F0" }}>
                    Create a<br /><em>New Job</em>
                </h2>

                {!isConnected ? (
                    <div style={{ color: "rgba(245,244,240,0.5)", textAlign: "center", padding: "20px" }}>
                        Please connect your wallet first to create a job.
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
                ) : step === "success" ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px" }}>
                            Job created and funded on-chain!
                        </div>
                        {createTxHash && (
                            <a
                                href={`https://sepolia.basescan.org/tx/${createTxHash}`}
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
                            <label style={labelStyle}>PROVIDER ADDRESS *</label>
                            <input
                                type="text"
                                value={provider}
                                onChange={e => setProvider(e.target.value)}
                                placeholder="0x... (agent wallet address)"
                                disabled={isProcessing}
                                style={inputStyle}
                            />
                            {/* Provider validation feedback */}
                            {provider && isValidProviderAddress && isProviderRegistered && (
                                <div style={{ fontSize: "11px", color: "#4ade80", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                                    ✓ Registered agent: {providerName}
                                </div>
                            )}
                            {provider && isValidProviderAddress && !!providerAgentData && !isProviderRegistered && (
                                <div style={{ fontSize: "11px", color: "#facc15", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                                    ⚠ This address is not a registered agent
                                </div>
                            )}
                            {provider && !isValidProviderAddress && (
                                <div style={{ fontSize: "11px", color: "#e05e5e", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                                    ✕ Invalid address format
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={labelStyle}>EVALUATOR ADDRESS <span style={{ opacity: 0.4 }}>(optional, defaults to provider)</span></label>
                            <input
                                type="text"
                                value={evaluator}
                                onChange={e => setEvaluator(e.target.value)}
                                placeholder="0x... (leave empty to use provider)"
                                disabled={isProcessing}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>ESCROW AMOUNT (ETH) *</label>
                                <input
                                    type="text"
                                    value={amountStr}
                                    onChange={e => setAmountStr(e.target.value)}
                                    placeholder="0.001"
                                    disabled={isProcessing}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>DEADLINE (DAYS)</label>
                                <input
                                    type="number"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    placeholder="7"
                                    disabled={isProcessing}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>TASK DESCRIPTION / SPEC URI *</label>
                            <textarea
                                value={specURI}
                                onChange={e => setSpecURI(e.target.value)}
                                rows={3}
                                placeholder="Describe the job or provide an IPFS URI..."
                                disabled={isProcessing}
                                style={{ ...inputStyle, resize: "none" }}
                            />
                        </div>

                        {(errorMsg || validationError) && (
                            <div style={{
                                fontSize: "12px",
                                color: "#e05e5e",
                                fontFamily: "'DM Mono', monospace",
                                background: "rgba(224,94,94,0.06)",
                                border: "1px solid rgba(224,94,94,0.2)",
                                padding: "10px 14px",
                                wordBreak: "break-word",
                            }}>
                                ❌ {errorMsg || validationError}
                            </div>
                        )}

                        {/* Progress indicator */}
                        {isProcessing && (
                            <div style={{
                                display: "flex", gap: "8px", alignItems: "center",
                                fontFamily: "'DM Mono', monospace", fontSize: "11px",
                                color: "rgba(245,244,240,0.6)", padding: "8px 0",
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    background: step === "wrapping" ? "#facc15" : step === "approving" ? "#60a5fa" : "#4ade80",
                                    animation: "pulse 1s infinite",
                                }} />
                                {step === "wrapping" && "Wrapping ETH → WETH..."}
                                {step === "approving" && "Approving WETH spend..."}
                                {step === "creating" && "Creating job on-chain..."}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing || !provider || !specURI || !amountStr || !!validationError}
                            style={{
                                padding: "14px", background: "#F5F4F0", color: "#080808",
                                border: "none", fontFamily: "'DM Mono', monospace",
                                fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em",
                                cursor: isProcessing || !!validationError ? "not-allowed" : "pointer",
                                opacity: (!provider || !specURI || !amountStr || !!validationError) ? 0.4 : 1,
                            }}
                        >
                            {isProcessing ? "PROCESSING..." : "CREATE & FUND JOB →"}
                        </button>

                        <div style={{ fontSize: "11px", color: "rgba(245,244,240,0.3)", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                            Payment: WETH (Wrapped ETH) · Auto-wraps ETH if needed · Base Sepolia
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
