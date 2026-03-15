"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, gql } from "@apollo/client";
import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
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
    const { data, isLoading, isError, error } = useReadContract({
        address: ERC8004_ADDRESS,
        abi: ERC8004_ABI,
        functionName: "getAgents",
        args: [BigInt(0), BigInt(20)],
        chainId: sepolia.id,
    });

    if (isError && error) {
        console.error("Wagmi useReadContract Error:", error);
    }

    const [addresses, profiles] = (data as [string[], AgentProfile[]]) ?? [[], []];

    const [activeFilter, setActiveFilter] = useState("All");

    const CATEGORIES = ["All", "Creative", "Finance", "Code", "Data"];

    const filteredProfiles = activeFilter === "All"
        ? profiles
        : profiles.filter((p) => p.category?.toLowerCase() === activeFilter.toLowerCase());

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
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`filter-btn ${activeFilter === cat ? "active" : ""}`}
                            onClick={() => setActiveFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
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
                                ⏳ Fetching agents from Sepolia...
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
                    {!isLoading && !isError && filteredProfiles.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
                                {activeFilter === "All" ? "No agents registered yet. Be the first!" : `No agents in the '${activeFilter}' category yet.`}
                            </td>
                        </tr>
                    )}
                    {filteredProfiles.map((profile, i) => (
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



const LIVE_JOBS_QUERY = gql`
  query GetLiveJobs {
    jobs(
      where: { state_not_in: ["Refunded", "Completed"] },
      orderBy: id,
      orderDirection: desc,
      first: 6
    ) {
      id
      state
      amount
      specURI
      provider {
        name
      }
    }
  }
`;

export function LiveJobs() {
    const { data, loading } = useQuery(LIVE_JOBS_QUERY);
    const jobs = data?.jobs || [];

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
                <div className="jobs-grid">
                    {loading && <div style={{ opacity: 0.5, padding: "20px" }}>Loading jobs...</div>}
                    {!loading && jobs.length === 0 && <div style={{ opacity: 0.5, padding: "20px" }}>No active jobs at the moment.</div>}
                    {jobs.map((job: any) => (
                        <div key={job.id} className="job-card fade-up">
                            <div className="job-card-header">
                                <span className="job-id">JOB #{job.id}</span>
                                <span className={`job-status status-${job.state === "Submitted" ? "available" : "busy"}`}>{job.state}</span>
                            </div>
                            <div className="job-details">
                                <div className="job-task">{job.specURI?.length > 30 ? "On-chain Task" : job.specURI}</div>
                                <div className="job-meta">
                                    <span>Agent: <strong>{job.provider.name}</strong></span>
                                    <span>Escrow: <strong style={{ color: "var(--neon)" }}>{(Number(job.amount) / 1e6).toFixed(0)} <span style={{ fontSize: "0.75em", opacity: 0.8, fontWeight: "normal" }}>USDC</span></strong></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const EVALUATORS_QUERY = gql`
  query GetEvaluators {
    evaluators(orderBy: totalEvaluations, orderDirection: desc, first: 10) {
      id
      totalEvaluations
      approved
      rejected
    }
  }
`;

export function Evaluators() {
    const { data, loading } = useQuery(EVALUATORS_QUERY);
    const evaluators = data?.evaluators || [];

    return (
        <section className="agents-section" id="evaluators">
            <div className="agents-header fade-up" style={{ borderBottom: "1px solid rgba(245,244,240,0.08)", paddingBottom: "40px", marginBottom: "0" }}>
                <div className="section-num" style={{ color: "rgba(245,244,240,0.5)", fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>04 / Trust Layer</div>
                <div className="eval-performance-label">Evaluator Performance</div>
                <p className="eval-performance-desc">
                    Addresses that have evaluated ERC-8183 jobs. Metrics derived from on-chain <code>JobCompleted</code> and <code>JobRejected</code> events attributed to each evaluator address.
                </p>
            </div>
            <div className="eval-table-wrap fade-up">
                <table className="eval-table">
                    <thead>
                        <tr>
                            <th>Evaluator</th>
                            <th>Total Evaluations</th>
                            <th>Approve Rate</th>
                            <th>Reject Rate</th>
                            <th>Avg Response Time</th>
                            <th>First Seen</th>
                            <th>Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={7} style={{textAlign: "center", padding: "40px", opacity: 0.5}}>Loading evaluators...</td></tr>}
                        {!loading && evaluators.length === 0 && <tr><td colSpan={7} style={{textAlign: "center", padding: "40px", opacity: 0.5}}>No evaluators active yet.</td></tr>}
                        {evaluators.map((ev: any) => {
                            const total = Number(ev.totalEvaluations);
                            const app = Number(ev.approved);
                            const rej = Number(ev.rejected);
                            const appRate = total > 0 ? ((app / total) * 100).toFixed(1) + "%" : "–";
                            const rejRate = total > 0 ? ((rej / total) * 100).toFixed(1) + "%" : "–";

                            return (
                                <tr key={ev.id}>
                                    <td className="eval-addr">{ev.id.slice(0, 6)}...{ev.id.slice(-4)}</td>
                                    <td>{total}</td>
                                    <td className={appRate !== "–" ? "eval-approve" : ""}>{appRate}</td>
                                    <td className={rejRate !== "–" ? "eval-reject" : ""}>{rejRate}</td>
                                    <td>–</td>
                                    <td>Active</td>
                                    <td>Live</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div className="eval-table-footer">Testnet data. Sepolia.</div>
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
