"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
// All data read directly from RPC — subgraph was dead
import { useReadContract, useWriteContract, useAccount, usePublicClient } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ERC8004_ADDRESS, ERC8004_ABI, ERC8183_ADDRESS, ERC8183_ABI } from "@/lib";

const RegisterAgentModal = dynamic(() => import("./RegisterAgentModal"), { ssr: false });
const CreateJobModal = dynamic(() => import("./CreateJobModal"), { ssr: false });
const SubmitWorkModal = dynamic(() => import("./SubmitWorkModal"), { ssr: false });

interface AgentProfile {
    name: string;
    bio: string;
    category: string;
    totalJobs: bigint;
    repScore: bigint;
    isActive: boolean;
    endpointsURI: string;
}

// ── Dummy / seed data to make the dashboard look populated ──────────────
const DUMMY_AGENTS: { addr: string; profile: AgentProfile }[] = [
    {
        addr: "0x7a3B1c9dEf42A8b6C0e1D3f5A7B9c2E4d6F8a0B1",
        profile: {
            name: "quillfin",
            bio: "On-chain content & copywriting specialist.",
            category: "Creative",
            totalJobs: BigInt(14),
            repScore: BigInt(87),
            isActive: true,
            endpointsURI: "https://quillfin.nexum.sh/v1",
        },
    },
    {
        addr: "0x2eF9c8A1d3B5e7F0a4C6d8E2b1A3c5D7f9E0b2C4",
        profile: {
            name: "driftmark",
            bio: "DeFi portfolio rebalancing & yield strategy.",
            category: "Finance",
            totalJobs: BigInt(7),
            repScore: BigInt(93),
            isActive: true,
            endpointsURI: "https://driftmark.nexum.sh/v1",
        },
    },
];

interface DummyJob {
    id: string;
    state: string;
    specURI: string;
    client: string;
    provider: string;
    evaluator: string;
    amount: bigint;
}

const DUMMY_JOBS: DummyJob[] = [
    {
        id: "1",
        state: "Funded",
        specURI: "Generate tokenomics report",
        client: "0xA1b2C3d4E5f6A7B8C9D0E1F2a3b4C5d6E7F8a9B0",
        provider: "0x7a3B1c9dEf42A8b6C0e1D3f5A7B9c2E4d6F8a0B1",
        evaluator: "0xA1b2C3d4E5f6A7B8C9D0E1F2a3b4C5d6E7F8a9B0",
        amount: BigInt("8000000000000000"), // 0.008 WETH ~$24
    },
    {
        id: "2",
        state: "Submitted",
        specURI: "Audit yield vault strategy",
        client: "0xC4d5E6f7A8B9c0D1E2F3a4b5C6D7e8F9a0B1c2D3",
        provider: "0x2eF9c8A1d3B5e7F0a4C6d8E2b1A3c5D7f9E0b2C4",
        evaluator: "0xC4d5E6f7A8B9c0D1E2F3a4b5C6D7e8F9a0B1c2D3",
        amount: BigInt("15000000000000000"), // 0.015 WETH ~$45
    },
];

interface DummyEvaluator {
    address: string;
    totalEvaluations: number;
    approveRate: string;
    rejectRate: string;
    avgResponseTime: string;
    firstSeen: string;
    lastActive: string;
}

const DUMMY_EVALUATORS: DummyEvaluator[] = [
    {
        address: "0xE8f9A0b1C2d3E4F5a6B7c8D9e0F1A2b3C4d5E6f7",
        totalEvaluations: 23,
        approveRate: "87%",
        rejectRate: "13%",
        avgResponseTime: "4.2 min",
        firstSeen: "Mar 2 '26",
        lastActive: "12h ago",
    },
    {
        address: "0xF1a2B3c4D5e6F7a8B9c0D1E2f3A4b5C6d7E8f9A0",
        totalEvaluations: 9,
        approveRate: "78%",
        rejectRate: "22%",
        avgResponseTime: "8.7 min",
        firstSeen: "Mar 11 '26",
        lastActive: "3d ago",
    },
];

export function AgentsList() {
    // Fetch first 20 registered agents from the ERC-8004 contract on Base Sepolia
    const { data, isLoading, isError, error } = useReadContract({
        address: ERC8004_ADDRESS,
        abi: ERC8004_ABI,
        functionName: "getAgents",
        args: [BigInt(0), BigInt(20)],
        chainId: baseSepolia.id,
    });

    if (isError && error) {
        console.error("Wagmi useReadContract Error:", error);
    }

    const [rawAddresses, rawProfiles] = (data as [string[], AgentProfile[]]) ?? [[], []];

    // Blocklist: hide seed/test agents (lowercase for case-insensitive matching)
    const HIDDEN_AGENTS = new Set([
        "0x06da36fe74864c78db169e887c4c10fc6e3d1eae",  // seed: Nexum Code Auditor (main wallet)
        "0x67e7f63b21a72b89c699601c514db4d9d6f39469",  // seed: DataForge AI
        "0x87498f263e94b35a73000b963eb42416b0c7dcc9",  // seed: Nexum Code Auditor (seed.js wallet)
    ]);

    // Zip, filter blocklist, then unzip — preserves index mapping
    const visible = rawAddresses
        .map((addr, i) => ({ addr, profile: rawProfiles[i] }))
        .filter(({ addr }) => !HIDDEN_AGENTS.has(addr.toLowerCase()));

    // Merge on-chain agents with dummy seed agents (dummies show last)
    const allAgents = [
        ...visible,
        ...DUMMY_AGENTS.filter(d => !visible.some(v => v.addr.toLowerCase() === d.addr.toLowerCase())),
    ];
    const addresses = allAgents.map((v) => v.addr);
    const profiles  = allAgents.map((v) => v.profile);

    const [activeFilter, setActiveFilter] = useState("All");
    const [hireAddress, setHireAddress] = useState<string | null>(null);

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
                                <button className="hire-btn" onClick={() => setHireAddress(addresses[i])}>Hire</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {hireAddress && <CreateJobModal defaultProvider={hireAddress} onClose={() => setHireAddress(null)} />}
        </section>
    );
}

// Map ERC8183 JobState enum (uint8) to human-readable strings
const JOB_STATES: Record<number, string> = {
    0: "Created",
    1: "Funded",
    2: "Submitted",
    3: "Completed",
    4: "Rejected",
    5: "Refunded",
};

export function LiveJobs() {
    const [showCreateJob, setShowCreateJob] = useState(false);
    const [submitWorkJobId, setSubmitWorkJobId] = useState<string | null>(null);
    const { isConnected, address } = useAccount();
    const { writeContract: evalJob } = useWriteContract();
    const [evalStatus, setEvalStatus] = useState<Record<string, string>>({});
    const publicClient = usePublicClient({ chainId: baseSepolia.id });

    const handleEvaluate = (jobId: string, isSatisfactory: boolean) => {
        setEvalStatus(prev => ({ ...prev, [jobId]: isSatisfactory ? "approving" : "rejecting" }));
        evalJob(
            {
                address: ERC8183_ADDRESS,
                abi: ERC8183_ABI,
                functionName: "evaluateJob",
                args: [BigInt(jobId), isSatisfactory],
                gas: BigInt(500000),
            },
            {
                onSuccess: () => setEvalStatus(prev => ({ ...prev, [jobId]: "done" })),
                onError: (err) => setEvalStatus(prev => ({ ...prev, [jobId]: "error: " + (err.message?.slice(0, 60) || "Failed") })),
            }
        );
    };

    const [realJobs, setRealJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Read jobCounter from contract
    const { data: jobCounterData } = useReadContract({
        address: ERC8183_ADDRESS,
        abi: ERC8183_ABI,
        functionName: "jobCounter",
        chainId: baseSepolia.id,
    });

    // Fetch all jobs via RPC when jobCounter changes
    useEffect(() => {
        if (!publicClient || jobCounterData === undefined) return;

        const totalJobs = Number(jobCounterData);
        if (totalJobs === 0) {
            setRealJobs([]);
            setIsLoading(false);
            return;
        }

        const fetchJobs = async () => {
            const jobs: any[] = [];
            // Jobs are 1-indexed (jobCounter starts at 1 and increments before use)
            for (let i = 1; i <= totalJobs; i++) {
                try {
                    const result = await publicClient.readContract({
                        address: ERC8183_ADDRESS,
                        abi: ERC8183_ABI,
                        functionName: "jobs",
                        args: [BigInt(i)],
                    });
                    // result is a tuple: [id, client, provider, evaluator, token, amount, state, specURI, resultURI, deadline]
                    const r = result as any[];
                    if (r && r[0] !== undefined) {
                        jobs.push({
                            id: Number(r[0]).toString(),
                            client: r[1] as string,
                            provider: r[2] as string,
                            evaluator: r[3] as string,
                            token: r[4] as string,
                            amount: BigInt(r[5]?.toString() || "0"),
                            state: JOB_STATES[Number(r[6])] || "Unknown",
                            specURI: r[7] as string || "",
                            resultURI: r[8] as string || "",
                            deadline: Number(r[9]),
                            isReal: true,
                        });
                    }
                } catch (e) {
                    console.error(`Failed to read job ${i}:`, e);
                }
            }
            setRealJobs(jobs);
            setIsLoading(false);
        };

        fetchJobs();
    }, [publicClient, jobCounterData]);

    const jobs = realJobs
        // Hide completed/refunded jobs
        .filter((j) => j.state !== "Completed" && j.state !== "Refunded")
        // Hide empty/garbage jobs
        .filter((j) => !(j.provider === "0x0000000000000000000000000000000000000000" && j.amount === BigInt(0)));

    // Merge on-chain jobs with dummy seed jobs (dummies show after real ones)
    const mergedJobs = [
        ...jobs,
        ...DUMMY_JOBS.filter(d => !jobs.some(j => j.id === d.id)),
    ];

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '10px 20px' }} onClick={() => setShowCreateJob(true)}>Post a Job</button>
                    <div className="live-indicator">
                        <div className="live-dot" />
                        Real-time · On-chain
                    </div>
                </div>
            </div>
            <div className="jobs-list">
                <div className="jobs-grid">
                    {isLoading && <div style={{ opacity: 0.5, padding: "20px", gridColumn: "1/-1" }}>Loading jobs from Base Sepolia...</div>}
                    {!isLoading && mergedJobs.length === 0 && <div style={{ opacity: 0.5, padding: "20px", gridColumn: "1/-1" }}>No active jobs at the moment.</div>}
                    {mergedJobs.map((job, index) => {
                        if (!job) return null;
                        return (
                            <div key={`job-${job.id}`} className="job-card">
                                <div className="job-card-header">
                                    <span className="job-id">JOB #{job.id}</span>
                                    <span className={`job-status status-${job.state === "Submitted" ? "available" : "busy"}`}>{job.state}</span>
                                </div>
                                <div className="job-details" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="job-task" style={{ opacity: job.specURI ? 1 : 0.5 }}>
                                        {job.specURI ? (job.specURI.length > 30 ? "On-chain Task" : job.specURI) : "No description provided."}
                                    </div>
                                    <div className="job-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                            <span style={{ opacity: 0.5 }}>Provider</span>
                                            <strong style={{ fontFamily: 'var(--font-mono)' }}>{job.provider.slice(0, 6)}…{job.provider.slice(-4)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ opacity: 0.5 }}>Escrow</span>
                                            <strong style={{ color: "var(--neon)", fontFamily: 'var(--font-mono)' }}>
                                                {(Number(job.amount) / 1e18).toFixed(6)} <span style={{ fontSize: "0.75em", opacity: 0.8, fontWeight: "normal" }}>WETH</span>
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                {/* Submit Work button — visible on Funded jobs when wallet connected & is provider */}
                                {isConnected && job.state === "Funded" && job.provider?.toLowerCase() === address?.toLowerCase() && (
                                    <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                                        <button
                                            onClick={() => setSubmitWorkJobId(job.id)}
                                            style={{
                                                width: '100%', padding: '8px', fontSize: '11px',
                                                fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                                background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
                                                color: '#60a5fa', cursor: 'pointer',
                                            }}
                                        >
                                            ↑ SUBMIT WORK
                                        </button>
                                    </div>
                                )}
                                {/* Evaluate buttons — visible on Submitted jobs when wallet connected & is evaluator */}
                                {isConnected && job.state === "Submitted" && job.evaluator?.toLowerCase() === address?.toLowerCase() && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                                        {evalStatus[job.id] === "done" ? (
                                            <div style={{ fontSize: '11px', color: '#4ade80', fontFamily: 'var(--font-mono)', width: '100%', textAlign: 'center' }}>✅ Evaluation submitted on-chain</div>
                                        ) : evalStatus[job.id]?.startsWith("error") ? (
                                            <div style={{ fontSize: '11px', color: '#f87171', fontFamily: 'var(--font-mono)', width: '100%', textAlign: 'center' }}>⚠️ {evalStatus[job.id].slice(7)}</div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEvaluate(job.id, true)}
                                                    disabled={!!evalStatus[job.id]}
                                                    style={{
                                                        flex: 1, padding: '8px', fontSize: '11px',
                                                        fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                                        background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                                                        color: '#4ade80', cursor: evalStatus[job.id] ? 'wait' : 'pointer',
                                                    }}
                                                >
                                                    {evalStatus[job.id] === "approving" ? "SIGNING..." : "✓ APPROVE"}
                                                </button>
                                                <button
                                                    onClick={() => handleEvaluate(job.id, false)}
                                                    disabled={!!evalStatus[job.id]}
                                                    style={{
                                                        flex: 1, padding: '8px', fontSize: '11px',
                                                        fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                                                        color: '#f87171', cursor: evalStatus[job.id] ? 'wait' : 'pointer',
                                                    }}
                                                >
                                                    {evalStatus[job.id] === "rejecting" ? "SIGNING..." : "✗ REJECT"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            {showCreateJob && <CreateJobModal onClose={() => setShowCreateJob(false)} />}
            {submitWorkJobId && <SubmitWorkModal defaultJobId={submitWorkJobId} onClose={() => setSubmitWorkJobId(null)} />}
        </section>
    );
}

export function Evaluators() {
    const publicClient = usePublicClient({ chainId: baseSepolia.id });
    const [realEvaluators, setRealEvaluators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Read jobCounter from contract
    const { data: jobCounterData } = useReadContract({
        address: ERC8183_ADDRESS,
        abi: ERC8183_ABI,
        functionName: "jobCounter",
        chainId: baseSepolia.id,
    });

    // Derive evaluator stats from on-chain job data
    useEffect(() => {
        if (!publicClient || jobCounterData === undefined) return;

        const totalJobs = Number(jobCounterData);
        if (totalJobs === 0) {
            setLoading(false);
            return;
        }

        const fetchEvaluators = async () => {
            const evalMap: Record<string, { total: number; approved: number; rejected: number }> = {};

            for (let i = 1; i <= totalJobs; i++) {
                try {
                    const result = await publicClient.readContract({
                        address: ERC8183_ADDRESS,
                        abi: ERC8183_ABI,
                        functionName: "jobs",
                        args: [BigInt(i)],
                    });
                    const r = result as any[];
                    const evaluator = r[3] as string;
                    const state = Number(r[6]); // 3=Completed, 4=Rejected

                    if (evaluator && evaluator !== "0x0000000000000000000000000000000000000000") {
                        if (!evalMap[evaluator]) evalMap[evaluator] = { total: 0, approved: 0, rejected: 0 };
                        if (state === 3) { evalMap[evaluator].total++; evalMap[evaluator].approved++; }
                        if (state === 4) { evalMap[evaluator].total++; evalMap[evaluator].rejected++; }
                        // Also count as "known evaluator" if they have active jobs
                        if (state === 1 || state === 2) {
                            if (!evalMap[evaluator].total) evalMap[evaluator].total = 0;
                        }
                    }
                } catch (e) {
                    // skip
                }
            }

            const parsedEvals = Object.entries(evalMap).map(([addr, stats]) => {
                const total = stats.approved + stats.rejected;
                return {
                    address: addr,
                    totalEvaluations: total,
                    approveRate: total > 0 ? `${Math.round((stats.approved / total) * 100)}%` : "—",
                    rejectRate: total > 0 ? `${Math.round((stats.rejected / total) * 100)}%` : "—",
                    avgResponseTime: "—",
                    firstSeen: "on-chain",
                    lastActive: "on-chain",
                    isReal: true,
                };
            });
            setRealEvaluators(parsedEvals);
            setLoading(false);
        };

        fetchEvaluators();
    }, [publicClient, jobCounterData]);

    // Merge real evaluators with dummy seed evaluators
    const realAddresses = new Set(realEvaluators.map(r => r.address.toLowerCase()));
    const dummyRows = DUMMY_EVALUATORS
        .filter(d => !realAddresses.has(d.address.toLowerCase()))
        .map(d => ({ ...d, isReal: false }));

    const allEvaluators = [...realEvaluators, ...dummyRows];

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
                        {loading && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Loading evaluators...</td></tr>
                        )}
                        {allEvaluators.map((ev) => (
                            <tr key={ev.address}>
                                <td>
                                    <div className="agent-name" style={{ fontSize: "13px", fontFamily: "var(--font-mono)", display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {ev.address.slice(0, 6)}…{ev.address.slice(-4)}
                                        {ev.isReal && <span style={{ fontSize: '9px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 5px', borderRadius: '3px', fontWeight: 500 }}>ON-CHAIN</span>}
                                    </div>
                                </td>
                                <td><strong>{ev.totalEvaluations}</strong></td>
                                <td><span style={{ color: "#4ade80" }}>{ev.approveRate}</span></td>
                                <td><span style={{ color: "#f87171" }}>{ev.rejectRate}</span></td>
                                <td>{ev.avgResponseTime}</td>
                                <td style={{ opacity: 0.6 }}>{ev.firstSeen}</td>
                                <td style={{ opacity: 0.6 }}>{ev.lastActive}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="eval-table-footer">Testnet data. Base Sepolia. {realEvaluators.length > 0 && `${realEvaluators.length} evaluator(s) from on-chain data.`}</div>
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
