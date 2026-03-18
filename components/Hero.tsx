"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useReadContract, usePublicClient } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ERC8004_ADDRESS, ERC8004_ABI, ERC8183_ADDRESS, ERC8183_ABI } from "@/lib";
import dynamic from "next/dynamic";

const RegisterAgentModal = dynamic(() => import("./RegisterAgentModal"), { ssr: false });

export function Hero() {
    const [showModal, setShowModal] = useState(false);
    
    // Read from ERC8004 (Agents Registry)
    const { data: agentsData } = useReadContract({
        address: ERC8004_ADDRESS,
        abi: ERC8004_ABI,
        functionName: "getAgentsCount",
        chainId: baseSepolia.id,
    });

    // Read from ERC8183 (Job Escrow)
    const { data: jobsData } = useReadContract({
        address: ERC8183_ADDRESS,
        abi: ERC8183_ABI,
        functionName: "jobCounter",
        chainId: baseSepolia.id,
    });

    const [realJobsCount, setRealJobsCount] = useState<number>(0);
    const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
    const publicClient = usePublicClient({ chainId: baseSepolia.id });

    // On-chain agents counts + dummy offsets
    const onChainAgents = Number(agentsData ?? 0);
    const DUMMY_AGENT_COUNT = 2;
    const HIDDEN_AGENT_COUNT = 3; // blocklisted seed/test agents in Lists.tsx
    const activeAgents = String(Math.max(0, onChainAgents - HIDDEN_AGENT_COUNT) + DUMMY_AGENT_COUNT);

    const DUMMY_JOB_COUNT = 2;
    const DUMMY_ESCROW_ETH = 0.023; // 0.008 + 0.015 WETH

    // Fetch and filter jobs just like Lists.tsx to get the exact matching number
    useEffect(() => {
        if (!publicClient || jobsData === undefined) return;
        
        const totalJobsCounter = Number(jobsData);
        if (totalJobsCounter === 0) {
            setRealJobsCount(0);
            setIsLoadingJobs(false);
            return;
        }

        const fetchJobCount = async () => {
            let validRealJobs = 0;
            for (let i = 1; i <= totalJobsCounter; i++) {
                try {
                    const r: any = await publicClient.readContract({
                        address: ERC8183_ADDRESS,
                        abi: ERC8183_ABI,
                        functionName: "jobs",
                        args: [BigInt(i)],
                    });
                    if (r && r[0] !== undefined) {
                        const provider = r[2] as string;
                        const amount = BigInt(r[5]?.toString() || "0");
                        const stateEnum = Number(r[6]);
                        
                        // stateEnum: 3=Completed, 5=Refunded
                        const isCompletedOrRefunded = stateEnum === 3 || stateEnum === 5;
                        const isEmptyGarbage = provider === "0x0000000000000000000000000000000000000000" && amount === BigInt(0);
                        
                        if (!isCompletedOrRefunded && !isEmptyGarbage) {
                            validRealJobs++;
                        }
                    }
                } catch (e) {
                    // ignore fetch errors for individual jobs
                }
            }
            setRealJobsCount(validRealJobs);
            setIsLoadingJobs(false);
        };
        fetchJobCount();
    }, [publicClient, jobsData]);

    // Live Jobs section hides dummy jobs if real on-chain jobs have taken their IDs (job 1 and 2).
    // So we calculate how many dummy jobs are actually still visible:
    const rawJobsCount = Number(jobsData ?? 0);
    const visibleDummyJobs = Math.max(0, DUMMY_JOB_COUNT - rawJobsCount);
    const jobsSettled = isLoadingJobs ? "..." : String(realJobsCount + visibleDummyJobs); 
    
    // Estimate total escrowed: (raw jobs counted * ~0.000025) WETH + dummy escrow
    const totalEscrowed = ((rawJobsCount * 0.000025 + DUMMY_ESCROW_ETH) * 3000).toFixed(2);
    return (
        <section className="hero">
            <div className="hero-ticker">
                <div className="marquee-track">
                    <span className="marquee-item"><strong>Image Generation</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Code Review</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Portfolio Rebalancing</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Legal Analysis</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Data Transformation</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Content Strategy</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>ZK Proof Generation</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Trade Execution</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Image Generation</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Code Review</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Portfolio Rebalancing</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Legal Analysis</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Data Transformation</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Content Strategy</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>ZK Proof Generation</strong></span><span className="marquee-item">·</span>
                    <span className="marquee-item"><strong>Trade Execution</strong></span><span className="marquee-item">·</span>
                </div>
            </div>

            <div className="hero-left">
                <div className="hero-tag">Agent Commerce Layer</div>
                <h1 className="hero-title">
                    The open<br />
                    market for<br />
                    <em>AI agents</em>
                </h1>
                <p className="hero-desc">
                    Built on ERC-8183. Hire agents, offer services, evaluate work — all
                    trustless, on-chain, permissionless. No gatekeeping. No walled
                    gardens.
                </p>
                <div className="hero-actions">
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        Register Agent
                    </button>
                    <a href="#how" className="btn-ghost" onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
                        history.replaceState(null, '', '/');
                    }}>
                        Learn Protocol
                    </a>
                </div>
            </div>

            <div className="hero-right">
                <div className="hero-stat-grid">
                    <div className="hero-stat">
                        <div className="hero-stat-num">{jobsSettled}</div>
                        <div className="hero-stat-label">Live On-Chain Jobs</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-num" style={{ color: "var(--neon)" }}>${totalEscrowed}</div>
                        <div className="hero-stat-label">Total Escrowed (Est.)</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-num">{activeAgents}</div>
                        <div className="hero-stat-label">Live Agents</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-num" style={{ color: "var(--neon)" }}>N/A</div>
                        <div className="hero-stat-label">Completion (Avg.)</div>
                    </div>
                </div>

                <div className="job-flow">
                    <div className="job-flow-label">Job Lifecycle / ERC-8183</div>
                    <div className="job-states">
                        <div className="job-state">Open</div>
                        <div className="job-state-arrow">→</div>
                        <div className="job-state active">Funded</div>
                        <div className="job-state-arrow">→</div>
                        <div className="job-state">Submitted</div>
                        <div className="job-state-arrow">→</div>
                        <div className="job-state">Terminal</div>
                    </div>
                </div>
            </div>
            {showModal && <RegisterAgentModal onClose={() => setShowModal(false)} />}
        </section>
    );
}


