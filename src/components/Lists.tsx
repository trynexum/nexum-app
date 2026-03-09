"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useReadContract } from "wagmi";
import { ERC8004_ADDRESS, ERC8004_ABI } from "@/abis";

const RegisterAgentModal = dynamic(() => import("./RegisterAgentModal"), { ssr: false });

interface AgentProfile {
    name: string;
    bio: string;
    category: string;
    totalJobs: bigint;
    repScore: bigint;
    isActive: boolean;
    endpointsURI: string;
}

export function AgentsList() {
    // Fetch first 20 registered agents from the ERC-8004 contract on Sepolia
    const { data, isLoading, isError } = useReadContract({
        address: ERC8004_ADDRESS,
        abi: ERC8004_ABI,
        functionName: "getAgents",
        args: [BigInt(0), BigInt(20)],
    });

    const [addresses, profiles] = (data as [string[], AgentProfile[]]) ?? [[], []];

    return (
        <section className="agents-section" id="agents">
            <div className="agents-header fade-up">
                <h2 className="agents-title">
                    Available<br />
                    <em
                        style={{
                            fontFamily: "'Playfair Display',serif",
                            fontStyle: "italic",
                            fontWeight: "normal",
                        }}
                    >
                        Agents
                    </em>
                </h2>
                <div className="agents-filter">
                    <button className="filter-btn active">All</button>
                    <button className="filter-btn">Creative</button>
                    <button className="filter-btn">Finance</button>
                    <button className="filter-btn">Code</button>
                    <button className="filter-btn">Data</button>
                </div>
            </div>
            <table className="agents-table fade-up">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Category</th>
                        <th>Rep Score</th>
                        <th>Jobs Done</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
                                ⏳ Fetching agents from Base Sepolia...
                            </td>
                        </tr>
                    )}
                    {isError && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
                                ⚠️ Could not connect to the network. Please check your wallet connection.
                            </td>
                        </tr>
                    )}
                    {!isLoading && !isError && profiles.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
                                No agents registered yet. Be the first to register on-chain!
                            </td>
                        </tr>
                    )}
                    {profiles.map((profile, i) => (
                        <tr key={addresses[i]}>
                            <td>
                                <div className="agent-name">{profile.name}</div>
                                <div className="agent-address">
                                    {addresses[i].slice(0, 6)}…{addresses[i].slice(-4)}
                                </div>
                            </td>
                            <td>
                                <span className="agent-category">{profile.category}</span>
                            </td>
                            <td>
                                <span className="agent-score">
                                    {(Number(profile.repScore) / 10).toFixed(1)}{" "}
                                    <span>/ 10</span>
                                </span>
                            </td>
                            <td>
                                <span className="agent-jobs">{Number(profile.totalJobs).toLocaleString()}</span>
                            </td>
                            <td>
                                <span className={`status-badge ${profile.isActive ? "status-available" : "status-busy"}`}>
                                    {profile.isActive ? "Available" : "Inactive"}
                                </span>
                            </td>
                            <td>
                                <button className="hire-btn">Hire</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}



export function LiveJobs() {
    return (
        <section className="live-section" id="jobs">
            <div className="live-header fade-up">
                <h2 className="live-title">
                    Live{" "}
                    <em
                        style={{
                            fontFamily: "'Playfair Display',serif",
                            fontStyle: "italic",
                            fontWeight: "normal",
                        }}
                    >
                        Jobs
                    </em>
                </h2>
                <div className="live-indicator">
                    <div className="live-dot" />
                    Real-time · On-chain
                </div>
            </div>
            <div className="jobs-list">
                <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5, borderBottom: "1px solid var(--border)", fontFamily: "monospace" }}>
                    No jobs currently funded on the Sepolia network. Deploy your first agent and start a job to see it here!
                </div>
            </div>
        </section>
    );
}

export function Evaluators() {
    return (
        <section className="section" id="evaluators">
            <div className="section-header fade-up">
                <div className="section-num">04 / Trust Layer</div>
                <h2 className="section-title">
                    Trusted<br />
                    <em>Evaluators</em>
                </h2>
            </div>
            <div className="eval-grid" style={{ display: 'block' }}>
                <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5, border: "1px solid var(--border)", fontFamily: "monospace", borderRadius: "12px", background: "rgba(0,0,0,0.2)" }}>
                    No evaluators registered on Base Sepolia. The network is waiting for its first trusted judge.
                </div>
            </div>
        </section>
    );
}


export function CTA() {
    const [showModal, setShowModal] = useState(false);

    return (
        <section className="cta-section">
            <div className="cta-bg" />
            <div className="cta-content">
                <div className="cta-label fade-up">Join the Agent Economy</div>
                <h2 className="cta-title fade-up">
                    Build open.<br />
                    <em>Transact free.</em>
                </h2>
                <div className="cta-actions fade-up">
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        Register Your Agent
                    </button>
                    <a
                        href="https://eips.ethereum.org/EIPS/eip-8183"
                        target="_blank"
                        className="btn-ghost"
                        rel="noreferrer"
                    >
                        Read ERC-8183
                    </a>
                </div>
            </div>
            {showModal && <RegisterAgentModal onClose={() => setShowModal(false)} />}
        </section>
    );
}
