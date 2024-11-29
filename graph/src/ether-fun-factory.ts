import {
  Claimed as ClaimedEvent,
  MetaUpdated as MetaUpdatedEvent,
  SaleCreated as SaleCreatedEvent,
  SaleLaunched as SaleLaunchedEvent,
  TokensBought as TokensBoughtEvent,
  TokensSold as TokensSoldEvent
} from "../generated/EtherFunFactory/EtherFunFactory"
import {
  Claimed,
  MetaUpdated,
  SaleCreated,
  SaleLaunched,
  TokensBought,
  TokensSold
} from "../generated/schema"

export function handleClaimed(event: ClaimedEvent): void {
  let entity = new Claimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saleContractAddress = event.params.saleContractAddress
  entity.claimant = event.params.claimant

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMetaUpdated(event: MetaUpdatedEvent): void {
  let entity = new MetaUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saleContractAddress = event.params.saleContractAddress
  entity.logoUrl = event.params.logoUrl
  entity.websiteUrl = event.params.websiteUrl
  entity.twitterUrl = event.params.twitterUrl
  entity.telegramUrl = event.params.telegramUrl
  entity.description = event.params.description

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSaleCreated(event: SaleCreatedEvent): void {
  let entity = new SaleCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saleContractAddress = event.params.saleContractAddress
  entity.creator = event.params.creator
  entity.name = event.params.name
  entity.symbol = event.params.symbol
  entity.saleGoal = event.params.saleGoal
  entity.logoUrl = event.params.logoUrl
  entity.websiteUrl = event.params.websiteUrl
  entity.twitterUrl = event.params.twitterUrl
  entity.telegramUrl = event.params.telegramUrl
  entity.description = event.params.description
  entity.relatedLinks = event.params.relatedLinks

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSaleLaunched(event: SaleLaunchedEvent): void {
  let entity = new SaleLaunched(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saleContractAddress = event.params.saleContractAddress
  entity.launcher = event.params.launcher

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokensBought(event: TokensBoughtEvent): void {
  let entity = new TokensBought(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saleContractAddress = event.params.saleContractAddress
  entity.buyer = event.params.buyer
  entity.totalRaised = event.params.totalRaised
  entity.tokenBalance = event.params.tokenBalance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokensSold(event: TokensSoldEvent): void {
  let entity = new TokensSold(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saleContractAddress = event.params.saleContractAddress
  entity.seller = event.params.seller
  entity.totalRaised = event.params.totalRaised
  entity.tokenBalance = event.params.tokenBalance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
