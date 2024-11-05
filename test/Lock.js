const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EtherFunFactory", function () {
  async function deployFactoryFixture() {
    // コントラクトデプロイ用のアカウント取得
    const [owner, creator, buyer1, buyer2] = await ethers.getSigners();

    // ファクトリーコントラクトのデプロイ
    const Factory = await ethers.getContractFactory("EtherFunFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment()
    // PEPE2049セールの作成用パラメータ
    const saleParams = {
      name: "PEPE2049",
      symbol: "P2049",
      logoUrl: "https://pepe2049.eth/logo.svg",
      websiteUrl: "https://pepe2049.eth",
      twitterUrl: "https://twitter.com/PEPE2049",
      telegramUrl: "https://t.me/PEPE2049community",
      description: "PEPE2049 Test Token"
    };

    const tx = await factory.connect(creator).createSale(
      saleParams.name,
      saleParams.symbol,
      saleParams.logoUrl,
      saleParams.websiteUrl,
      saleParams.twitterUrl,
      saleParams.telegramUrl,
      saleParams.description,
      { value: initialBuyAmount }
    )

    await tx.wait();
    

    const creatorTokens = await factory.getCreatorTokens(creator.address)[0];
    console.log('IN ficsture', creatorTokens)
    return { factory, owner, creator, buyer1, buyer2, saleParams , creatorTokens};
  }


  describe("Sale Creation", function () {

    it("Should track creator's tokens correctly", async function () {
      const { factory, creator, saleParams } = await loadFixture(deployFactoryFixture);
      
      await factory.connect(creator).createSale(
        saleParams.name,
        saleParams.symbol,
        saleParams.logoUrl,
        saleParams.websiteUrl,
        saleParams.twitterUrl,
        saleParams.telegramUrl,
        saleParams.description,
        { value: ethers.parseEther("0.1") }
      );

      const creatorTokens = await factory.getCreatorTokens(creator.address);
      console.log('getCreatorTokens||||', creatorTokens)
      expect(creatorTokens.length).to.equal(1);
    });
  });

  describe("Token Purchase", function () {
    it("Should allow users to buy tokens", async function () {
      console.log("===========================")
      const { factory, creator, buyer1, saleParams, creatorTokens } = await loadFixture(deployFactoryFixture);
      console.log('creatorTokens', creatorTokens)
      // トークン購入
      const purchaseAmount = ethers.parseEther("0.2");
      await expect(factory.connect(buyer1).buyToken(
        creatorTokens,
        0,
        { value: purchaseAmount }
      )).to.emit(factory, "TokensBought");
    });

    it("Should track buyer's tokens correctly", async function () {
      const { factory, creator, buyer1, saleParams } = await loadFixture(deployFactoryFixture);
      
      // セール作成
      const createTx = await factory.connect(creator).createSale(
        saleParams.name,
        saleParams.symbol,
        saleParams.logoUrl,
        saleParams.websiteUrl,
        saleParams.twitterUrl,
        saleParams.telegramUrl,
        saleParams.description,
        { value: ethers.parseEther("0.1") }
      );
      
      const receipt = await createTx.wait();
      const saleCreatedEvent = receipt.events.find(e => e.event === "SaleCreated");
      const saleAddress = saleCreatedEvent.args.saleContractAddress;

      // 購入実行
      await factory.connect(buyer1).buyToken(
        saleAddress,
        0,
        { value: ethers.parseEther("0.2") }
      );

      const buyerTokens = await factory.getUserBoughtTokens(buyer1.address);
      expect(buyerTokens.length).to.equal(1);
      expect(buyerTokens[0]).to.equal(saleAddress);
    });
  });

  describe("Sale Launch", function () {
    it("Should launch sale when goal is reached", async function () {
      const { factory, creator, buyer1, saleParams } = await loadFixture(deployFactoryFixture);
      
      // セール作成
      const createTx = await factory.connect(creator).createSale(
        saleParams.name,
        saleParams.symbol,
        saleParams.logoUrl,
        saleParams.websiteUrl,
        saleParams.twitterUrl,
        saleParams.telegramUrl,
        saleParams.description,
        { value: ethers.parseEther("0.1") }
      );
      
      const receipt = await createTx.wait();
      const saleCreatedEvent = receipt.events.find(e => e.event === "SaleCreated");
      const saleAddress = saleCreatedEvent.args.saleContractAddress;

      // セールゴールまで購入
      await factory.connect(buyer1).buyToken(
        saleAddress,
        0,
        { value: ethers.parseEther("1.5") }
      );

      const sale = await ethers.getContractAt("EtherfunSale", saleAddress);
      expect(await sale.launched()).to.be.true;
    });

    it("Should allow token claim after launch", async function () {
      const { factory, creator, buyer1, saleParams } = await loadFixture(deployFactoryFixture);
      
      // セール作成と購入の処理
      const createTx = await factory.connect(creator).createSale(
        saleParams.name,
        saleParams.symbol,
        saleParams.logoUrl,
        saleParams.websiteUrl,
        saleParams.twitterUrl,
        saleParams.telegramUrl,
        saleParams.description,
        { value: ethers.parseEther("0.1") }
      );
      
      const receipt = await createTx.wait();
      const saleAddress = receipt.events.find(e => e.event === "SaleCreated").args.saleContractAddress;

      // セールゴールまで購入
      await factory.connect(buyer1).buyToken(
        saleAddress,
        0,
        { value: ethers.parseEther("1.5") }
      );

      // クレーム実行
      await expect(factory.connect(buyer1).claim(saleAddress))
        .to.not.be.reverted;
    });
  });

  describe("Parameter Updates", function () {
    it("Should allow owner to update parameters", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);
      
      const newSaleGoal = ethers.parseEther("2.0");
      const newK = ethers.parseEther("0.222");
      const newAlpha = 2878000000;

      await expect(factory.connect(owner).updateParameters(
        newSaleGoal,
        newK,
        newAlpha,
        ethers.constants.AddressZero,
        5,
        5,
        5,
        5
      )).to.not.be.reverted;
    });

    it("Should prevent non-owners from updating parameters", async function () {
      const { factory, buyer1 } = await loadFixture(deployFactoryFixture);
      
      await expect(factory.connect(buyer1).updateParameters(
        ethers.parseEther("2.0"),
        ethers.parseEther("0.222"),
        2878000000,
        ethers.constants.AddressZero,
        5,
        5,
        5,
        5
      )).to.be.revertedWith("Not the owner");
    });
  });
});