import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Claimed,
  MetaUpdated,
  SaleCreated,
  SaleLaunched,
  TokensBought,
  TokensSold
} from "../generated/EtherFunFactory/EtherFunFactory"

export function createClaimedEvent(
  saleContractAddress: Address,
  claimant: Address
): Claimed {
  let claimedEvent = changetype<Claimed>(newMockEvent())

  claimedEvent.parameters = new Array()

  claimedEvent.parameters.push(
    new ethereum.EventParam(
      "saleContractAddress",
      ethereum.Value.fromAddress(saleContractAddress)
    )
  )
  claimedEvent.parameters.push(
    new ethereum.EventParam("claimant", ethereum.Value.fromAddress(claimant))
  )

  return claimedEvent
}

export function createMetaUpdatedEvent(
  saleContractAddress: Address,
  logoUrl: string,
  websiteUrl: string,
  twitterUrl: string,
  telegramUrl: string,
  description: string
): MetaUpdated {
  let metaUpdatedEvent = changetype<MetaUpdated>(newMockEvent())

  metaUpdatedEvent.parameters = new Array()

  metaUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "saleContractAddress",
      ethereum.Value.fromAddress(saleContractAddress)
    )
  )
  metaUpdatedEvent.parameters.push(
    new ethereum.EventParam("logoUrl", ethereum.Value.fromString(logoUrl))
  )
  metaUpdatedEvent.parameters.push(
    new ethereum.EventParam("websiteUrl", ethereum.Value.fromString(websiteUrl))
  )
  metaUpdatedEvent.parameters.push(
    new ethereum.EventParam("twitterUrl", ethereum.Value.fromString(twitterUrl))
  )
  metaUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "telegramUrl",
      ethereum.Value.fromString(telegramUrl)
    )
  )
  metaUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )

  return metaUpdatedEvent
}

export function createSaleCreatedEvent(
  saleContractAddress: Address,
  creator: Address,
  name: string,
  symbol: string,
  saleGoal: BigInt,
  logoUrl: string,
  websiteUrl: string,
  twitterUrl: string,
  telegramUrl: string,
  description: string,
  relatedLinks: Array<string>
): SaleCreated {
  let saleCreatedEvent = changetype<SaleCreated>(newMockEvent())

  saleCreatedEvent.parameters = new Array()

  saleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "saleContractAddress",
      ethereum.Value.fromAddress(saleContractAddress)
    )
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol))
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "saleGoal",
      ethereum.Value.fromUnsignedBigInt(saleGoal)
    )
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam("logoUrl", ethereum.Value.fromString(logoUrl))
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam("websiteUrl", ethereum.Value.fromString(websiteUrl))
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam("twitterUrl", ethereum.Value.fromString(twitterUrl))
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "telegramUrl",
      ethereum.Value.fromString(telegramUrl)
    )
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )
  saleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "relatedLinks",
      ethereum.Value.fromStringArray(relatedLinks)
    )
  )

  return saleCreatedEvent
}

export function createSaleLaunchedEvent(
  saleContractAddress: Address,
  launcher: Address
): SaleLaunched {
  let saleLaunchedEvent = changetype<SaleLaunched>(newMockEvent())

  saleLaunchedEvent.parameters = new Array()

  saleLaunchedEvent.parameters.push(
    new ethereum.EventParam(
      "saleContractAddress",
      ethereum.Value.fromAddress(saleContractAddress)
    )
  )
  saleLaunchedEvent.parameters.push(
    new ethereum.EventParam("launcher", ethereum.Value.fromAddress(launcher))
  )

  return saleLaunchedEvent
}

export function createTokensBoughtEvent(
  saleContractAddress: Address,
  buyer: Address,
  totalRaised: BigInt,
  tokenBalance: BigInt
): TokensBought {
  let tokensBoughtEvent = changetype<TokensBought>(newMockEvent())

  tokensBoughtEvent.parameters = new Array()

  tokensBoughtEvent.parameters.push(
    new ethereum.EventParam(
      "saleContractAddress",
      ethereum.Value.fromAddress(saleContractAddress)
    )
  )
  tokensBoughtEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  tokensBoughtEvent.parameters.push(
    new ethereum.EventParam(
      "totalRaised",
      ethereum.Value.fromUnsignedBigInt(totalRaised)
    )
  )
  tokensBoughtEvent.parameters.push(
    new ethereum.EventParam(
      "tokenBalance",
      ethereum.Value.fromUnsignedBigInt(tokenBalance)
    )
  )

  return tokensBoughtEvent
}

export function createTokensSoldEvent(
  saleContractAddress: Address,
  seller: Address,
  totalRaised: BigInt,
  tokenBalance: BigInt
): TokensSold {
  let tokensSoldEvent = changetype<TokensSold>(newMockEvent())

  tokensSoldEvent.parameters = new Array()

  tokensSoldEvent.parameters.push(
    new ethereum.EventParam(
      "saleContractAddress",
      ethereum.Value.fromAddress(saleContractAddress)
    )
  )
  tokensSoldEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  tokensSoldEvent.parameters.push(
    new ethereum.EventParam(
      "totalRaised",
      ethereum.Value.fromUnsignedBigInt(totalRaised)
    )
  )
  tokensSoldEvent.parameters.push(
    new ethereum.EventParam(
      "tokenBalance",
      ethereum.Value.fromUnsignedBigInt(tokenBalance)
    )
  )

  return tokensSoldEvent
}
