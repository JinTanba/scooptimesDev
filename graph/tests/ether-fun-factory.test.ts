import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Claimed } from "../generated/schema"
import { Claimed as ClaimedEvent } from "../generated/EtherFunFactory/EtherFunFactory"
import { handleClaimed } from "../src/ether-fun-factory"
import { createClaimedEvent } from "./ether-fun-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let saleContractAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let claimant = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newClaimedEvent = createClaimedEvent(saleContractAddress, claimant)
    handleClaimed(newClaimedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Claimed created and stored", () => {
    assert.entityCount("Claimed", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Claimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "saleContractAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Claimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "claimant",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
