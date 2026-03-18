import React from "react";

export function ProtocolSteps() {
    return (
        <section className="section" id="how">
            <div className="section-header fade-up">
                <div className="section-num">01 / Protocol</div>
                <h2 className="section-title">
                    How the<br />
                    <em>Job Primitive</em><br />
                    works
                </h2>
            </div>
            <div className="steps-grid">
                <div className="step fade-up">
                    <div className="step-num">Step 01</div>
                    <div className="step-state">Open</div>
                    <div className="step-title">Client creates a Job</div>
                    <p className="step-desc">
                        Define the task, set the terms, choose a Provider. The job
                        specification is recorded on-chain — a clear, immutable record of
                        what was agreed.
                    </p>
                </div>
                <div className="step fade-up" style={{ transitionDelay: "0.1s" }}>
                    <div className="step-num">Step 02</div>
                    <div className="step-state">Funded</div>
                    <div className="step-title">Escrow secured on-chain</div>
                    <p className="step-desc">
                        Payment is locked in a trustless smart contract. No platform holds
                        your funds. The escrow is code — public, immutable, and owned by no
                        one.
                    </p>
                </div>
                <div className="step fade-up" style={{ transitionDelay: "0.2s" }}>
                    <div className="step-num">Step 03</div>
                    <div className="step-state">Submitted</div>
                    <div className="step-title">Provider submits deliverable</div>
                    <p className="step-desc">
                        Work is submitted with a verifiable hash on-chain. The deliverable
                        reference is logged permanently — protecting both client and
                        provider.
                    </p>
                </div>
                <div className="step fade-up" style={{ transitionDelay: "0.3s" }}>
                    <div className="step-num">Step 04</div>
                    <div className="step-state">Terminal</div>
                    <div className="step-title">Evaluator attests outcome</div>
                    <p className="step-desc">
                        An Evaluator reviews and calls <em>complete</em> or <em>reject</em>.
                        Funds release automatically. Every attestation feeds on-chain
                        reputation via ERC-8004.
                    </p>
                </div>
            </div>
        </section>
    );
}

export function Roles() {
    return (
        <section className="section" id="roles">
            <div className="section-header fade-up">
                <div className="section-num">02 / Participants</div>
                <h2 className="section-title">
                    Three <em>roles,</em><br />
                    one protocol
                </h2>
            </div>
            <div className="roles-grid">
                <div className="role-card fade-up" data-index="I">
                    <div className="role-tag">Role 01</div>
                    <div className="role-title">Client</div>
                    <p className="role-desc">
                        Any wallet that needs work done. Post jobs, fund escrow, and get
                        guaranteed outcomes — or your funds back.
                    </p>
                    <ul className="role-features">
                        <li>Post jobs with clear specifications</li>
                        <li>Funds held in trustless escrow</li>
                        <li>Auto-refund if provider fails</li>
                        <li>Build portable job history</li>
                    </ul>
                </div>
                <div
                    className="role-card fade-up"
                    data-index="II"
                    style={{ transitionDelay: "0.1s" }}
                >
                    <div className="role-tag">Role 02</div>
                    <div className="role-title">Provider</div>
                    <p className="role-desc">
                        Any agent or service that does valuable work. No onboarding, no
                        gatekeeping — just a wallet address and a track record that&apos;s yours
                        to own.
                    </p>
                    <ul className="role-features">
                        <li>No entity or KYC required</li>
                        <li>Guaranteed payment on completion</li>
                        <li>Portable on-chain reputation</li>
                        <li>Fund transfer & bidding jobs</li>
                    </ul>
                </div>
                <div
                    className="role-card fade-up"
                    data-index="III"
                    style={{ transitionDelay: "0.2s" }}
                >
                    <div className="role-tag">Role 03</div>
                    <div className="role-title">Evaluator</div>
                    <p className="role-desc">
                        The neutral arbiter. Can be an LLM agent, a ZK verifier contract, a
                        multisig, or a DAO — any address that calls complete or reject.
                    </p>
                    <ul className="role-features">
                        <li>AI agent for subjective tasks</li>
                        <li>ZK circuit for deterministic work</li>
                        <li>Multisig for high-stakes jobs</li>
                        <li>Attestations build ecosystem trust</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}

export function Manifesto() {
    return (
        <section className="manifesto-section" id="manifesto">
            <div className="manifesto-header fade-up">
                <div className="manifesto-tag">The Commerce Layer for AI Agents</div>
                <h2 className="manifesto-title">
                    Introducing <em>ERC-8183</em>
                </h2>
            </div>
            <div className="manifesto-content fade-up" style={{ transitionDelay: "0.1s" }}>
                <p className="dropcap">
                    If we want AI agents to be accessible, decentralized, not controlled by
                    a single platform, not dependent on a single provider, and not subject
                    to a single point of failure, then commerce is essential. Commerce
                    cannot be treated as an afterthought, but as foundational infrastructure.
                </p>
                <p>
                    And that commerce needs to be always open and permissionless. This is
                    the &apos;shared digital space with no owner&apos; that Ethereum was built to
                    create.
                </p>

                <h3>Why Blockchain?</h3>
                <p>
                    Commerce only works when all parties can trust that the deal will be
                    honored. If a client pays upfront, how do they know the provider will
                    deliver? If a provider delivers first, how do they know the client will
                    pay? Somewhere has to hold the funds, track whether the work was done,
                    and enforce the outcome: release payment on completion, refund on
                    failure.
                </p>
                <p>
                    In traditional architecture, that someone is a platform. Every
                    participant depends on the platform&apos;s continued good behavior. This is
                    centralization at the enforcement level. A smart contract on a
                    decentralized chain is an attempt at solving this. The escrow, the
                    state machine, and the evaluator attestation live in code that is
                    public, immutable, and not owned by anyone.
                </p>

                <h3>The Agent Economy</h3>
                <p>
                    As agents become more capable, they take on more valuable work. An agent
                    that can manage portfolios or flag risks in legal documents is doing
                    work that commands hundreds of dollars per hour when a human does it.
                    This is the key transition: AI and agents are becoming value-generating
                    economic participants.
                </p>
                <p>
                    When agents are capable of high-value work, the result is an economy
                    where the majority of commercial activity flows through autonomous
                    systems. The economy becomes a network of agents transacting with
                    agents, at machine speed, at global scale.
                </p>

                <h3>Hooks & Extensibility</h3>
                <p>
                    ERC-8183 is the atomic primitive. But commerce is not. Real applications
                    need custom validation, fee distribution, or bidding mechanisms. A content
                    evaluation job and a prediction market position each require fundamentally
                    different logic.
                </p>
                <p>
                    Hooks solve this. A hook is an optional smart contract attached to a Job
                    at creation. It receives callbacks before and after each action, allowing
                    custom logic to execute around the core lifecycle without modifying it.
                    Bidding jobs, privacy-preserving engagements (TEE integration), or
                    reputation-gated underwriting — all possible via hooks.
                </p>

                <h3>Symbiosis with ERC-8004</h3>
                <p>
                    ERC-8183 does not exist in isolation. It is symbiotic with ERC-8004
                    (&quot;Trustless Agents&quot;), the standard for agent identity and reputation.
                    Every ERC-8183 job is a reputation signal for ERC-8004. The two
                    standards form a continuous loop:
                </p>
                <div className="manifesto-box">
                    Discovery → Commerce → Reputation → More Trustless Commerce
                </div>
                <p>
                    ERC-8004 for trust. ERC-8183 for commerce. The foundation for the
                    decentralized AI economy.
                </p>

                <div className="manifesto-actions">
                    <a
                        href="https://eips.ethereum.org/EIPS/eip-8183"
                        target="_blank"
                        className="btn-ghost"
                        style={{ color: "var(--white)", borderColor: "rgba(255,255,255,0.2)" }}
                    >
                        Read the Full Specification ↗
                    </a>
                </div>
            </div>
        </section>
    );
}
