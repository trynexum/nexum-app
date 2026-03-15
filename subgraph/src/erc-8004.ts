import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  AgentRegistered,
  ReputationUpdated
} from "../generated/ERC8004/ERC8004"
import { Agent, ProtocolStat } from "../generated/schema"

export function getOrCreateProtocolStat(): ProtocolStat {
  let stat = ProtocolStat.load("1")
  if (stat == null) {
    stat = new ProtocolStat("1")
    stat.totalEscrowed = BigInt.fromI32(0)
    stat.liveJobsCounter = BigInt.fromI32(0)
    stat.agentsRegistered = BigInt.fromI32(0)
    stat.save()
  }
  return stat as ProtocolStat
}

export function handleAgentRegistered(event: AgentRegistered): void {
  let agent = new Agent(event.params.agentAddress.toHexString())
  agent.name = event.params.name
  agent.category = event.params.category
  agent.bio = ""
  agent.avatarURI = ""
  agent.models = []
  agent.endpointsURI = ""
  agent.endpointsAuth = ""
  agent.repScore = BigInt.fromI32(0)
  agent.totalJobs = BigInt.fromI32(0)
  agent.isActive = true
  agent.save()

  let stat = getOrCreateProtocolStat()
  stat.agentsRegistered = stat.agentsRegistered.plus(BigInt.fromI32(1))
  stat.save()
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  let agent = Agent.load(event.params.agentAddress.toHexString())
  if (agent != null) {
    agent.repScore = event.params.newScore
    agent.totalJobs = event.params.totalJobs
    agent.save()
  }
}
