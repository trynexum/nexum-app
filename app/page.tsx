import { Hero } from "@/components/Hero";
import { ProtocolSteps, Roles } from "@/components/Informational";
import { AgentsList, LiveJobs, Evaluators, CTA } from "@/components/Lists";

export default function Home() {
  return (
    <main>
      <Hero />
      <ProtocolSteps />
      <Roles />
      <AgentsList />
      <LiveJobs />
      <Evaluators />
      <CTA />
    </main>
  );
}
