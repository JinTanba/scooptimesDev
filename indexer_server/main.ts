const { createClient } = require('@supabase/supabase-js');
const { ethers } = require("ethers");
const factoryArtifact = require("./EtherFunFactory.json");
const saleArtifact = require("./EtherfunSale.json");
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const factoryAddress = process.env.FACTORY_ADDRESS;
const uniswapFactoryAddress = process.env.UNISWAP_FACTORY_ADDRESS;
if (!supabaseUrl || !supabaseServiceRoleKey || !factoryAddress) {
  throw new Error('Supabase URL or Service Role Key or Factory Address is not set');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);

interface SaleData {
    id: number;                    // int8
    created_at: string;           // timestamptz
    saleContractAddress: string;  // text
    creator: string;              // text
    name: string;                 // text
    symbol: string;               // text
    logoUrl: string;              // text
    websiteUrl: string;          // text
    twitterUrl: string;          // text
    telegramUrl: string;         // text
    description: string;         // text
    blockNumber?: string;         // text
    transactionHash?: string;     // text
    totalRaised?: string;         // text
    launched?: boolean;           // bool
    positiveToken?: string;       // text
    negativeToken?: string;       // text
    positivePairAddress: string;        // text
    negativePairAddress: string;        // text
}

// プロバイダーの接続確認
provider.on("block", (blockNumber: any) => {
    console.log("New block:", blockNumber);
});

console.log("Listening to events...", "[ SaleCreated, SaleLaunched, TokensBought, TokensSold, MetaUpdated]");

factory.on("SaleCreated", async (
    saleContractAddress: string,
    creator: string,
    name: string,
    symbol: string,
    saleGoal: any, 
    logoUrl: string,
    websiteUrl: string,
    twitterUrl: string,
    telegramUrl: string,
    description: string,
    relatedLinks: string[],
    event: any
) => {
    console.log("SaleCreated event detected", {
        saleContractAddress,
        creator,
        name,
        symbol,
        logoUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        description,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
    });

    const saleData: SaleData = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        saleContractAddress,
        creator,
        name,
        symbol,
        logoUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        description,
        blockNumber: event.blockNumber?.toString(),
        transactionHash: event.transactionHash,
        positivePairAddress: "",
        negativePairAddress: ""
    };

    const { error } = await supabase.from("saleData").insert(saleData);
    if (error) console.error("Error inserting SaleCreated data:", error);
    else console.log("SaleCreated event inserted into supabase");
});

factory.on("SaleLaunched", async (
    saleContractAddress: string,
    launcher: string,
    event: any
) => {
    console.log("SaleLaunched event detected:", { saleContractAddress, launcher });

    try {
        const saleContract = new ethers.Contract(saleContractAddress, saleArtifact.abi, provider);
        
        const { data: saleData, error: fetchError } = await supabase
            .from("saleData")
            .select("*")
            .eq("saleContractAddress", saleContractAddress)
            .single();
            
        if (fetchError) throw fetchError;


        const [totalRaised, launched, positiveToken, negativeToken] = await Promise.all([
            saleContract.totalRaised(),
            saleContract.launched(),
            saleContract.positiveToken(),
            saleContract.negativeToken(),
        ]);

        const [positivePairAddress, negativePairAddress] = await getLaunchedDetails(positiveToken, negativeToken);


        const { error: updateError } = await supabase
            .from("saleData")
            .update({
                ...saleData,
                launched,
                totalRaised: totalRaised.toString(),
                positiveToken,
                negativeToken,
                blockNumber: event.blockNumber?.toString(),
                transactionHash: event.transactionHash,
                positivePairAddress,
                negativePairAddress
            })
            .eq("saleContractAddress", saleContractAddress);

        if (updateError) throw updateError;
    } catch (error) {
        console.error("Error in SaleLaunched event:", error);
    }
});

factory.on("TokensBought", async (
  saleContractAddress: string,
  buyer: string,
  totalRaised: any,
  tokenBalance: any,
  event: any
) => {
  console.log("TokensBought event detected:", {
      saleContractAddress,
      buyer,
      totalRaised: totalRaised.toString(),
      tokenBalance: tokenBalance.toString()
  });

  try {
      // まず既存のデータを確認
      const { data: existingData } = await supabase
          .from("saleData")
          .select("*")
          .eq("saleContractAddress", saleContractAddress)
          .single();

      if (!existingData) {
          // データが存在しない場合、コントラクトから必要な情報を取得
          const saleContract = new ethers.Contract(saleContractAddress, saleArtifact.abi, provider);
          
          try {
              // 必要な情報を並行して取得
              const [
                  name,
                  symbol,
                  creator,
                  launched,
                  positiveToken,
                  negativeToken,
                  metadata
              ] = await Promise.all([
                  saleContract.name(),
                  saleContract.symbol(),
                  saleContract.creator(),
                  saleContract.launched(),
                  saleContract.positiveToken(),
                  saleContract.negativeToken(),
                  factory.getSaleMetadata(saleContractAddress)
              ]);

              // 新しいデータを作成
              const newSaleData = {
                  saleContractAddress,
                  creator,
                  name,
                  symbol,
                  logoUrl: metadata.logoUrl || "",
                  websiteUrl: metadata.websiteUrl || "",
                  twitterUrl: metadata.twitterUrl || "",
                  telegramUrl: metadata.telegramUrl || "",
                  description: metadata.description || "",
                  blockNumber: event.blockNumber?.toString(),
                  transactionHash: event.transactionHash,
                  totalRaised: totalRaised.toString(),
                  launched,
                  positiveToken,
                  negativeToken
              };

              // データを挿入
              const { error: insertError } = await supabase
                  .from("saleData")
                  .insert(newSaleData);

              if (insertError) throw insertError;
              console.log(`Created new sale data for ${saleContractAddress}`);

          } catch (error) {
              console.error("Error fetching contract data:", error);
              throw error;
          }
      } else {
          // 既存のデータを更新
          const { error: updateError } = await supabase
              .from("saleData")
              .update({
                  totalRaised: totalRaised.toString(),
              })
              .eq("saleContractAddress", saleContractAddress);

          if (updateError) throw updateError;
          console.log(`Updated sale data for ${saleContractAddress}`);
      }
  } catch (error) {
      console.error("Error processing TokensBought event:", error);
  }
});

factory.on("TokensSold", async (
    saleContractAddress: string,
    seller: string,
    totalRaised: any,
    tokenBalance: any,
    event: any
) => {
    console.log("TokensSold event detected:", {
        saleContractAddress,
        seller,
        totalRaised: totalRaised.toString(),
        tokenBalance: tokenBalance.toString()
    });

    try {
        const { error } = await supabase
            .from("saleData")
            .update({
                totalRaised: totalRaised.toString(),
                blockNumber: event.blockNumber?.toString(),
                transactionHash: event.transactionHash
            })
            .eq("saleContractAddress", saleContractAddress);

        if (error) throw error;
    } catch (error) {
        console.error("Error in TokensSold event:", error);
    }
});

factory.on("MetaUpdated", async (
    saleContractAddress: string,
    logoUrl: string,
    websiteUrl: string,
    twitterUrl: string,
    telegramUrl: string,
    description: string,
    event: any
) => {
    console.log("MetaUpdated event detected:", {
        saleContractAddress,
        logoUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        description
    });

    try {
        const { error } = await supabase
            .from("saleData")
            .update({
                logoUrl,
                websiteUrl,
                twitterUrl,
                telegramUrl,
                description,
                blockNumber: event.blockNumber?.toString(),
                transactionHash: event.transactionHash
            })
            .eq("saleContractAddress", saleContractAddress);

        if (error) throw error;
    } catch (error) {
        console.error("Error in MetaUpdated event:", error);
    }
});

// エラーハンドリング
provider.on("error", (error: any) => {
    console.error("Provider error:", error);
    // 必要に応じて再接続ロジックを実装
});

process.on("unhandledRejection", (error: any) => {
    console.error("Unhandled promise rejection:", error);
});


async function syncHistoricalSales() {
  console.log("🎉👍Starting historical sales sync...");
  try {
      // 過去のSaleCreatedイベントを取得
      const filter = factory.filters.SaleCreated();
      const events = await factory.queryFilter(filter, 7018959, 'latest');
      console.log(`Found ${events.length} historical sales`);

      for (const event of events) {
          const saleContractAddress = event.args!.saleContractAddress;
          
          console.log(`Processing sale ${saleContractAddress}...`);

          try {
              // 既存のデータを確認
              const { data: existingData } = await supabase
                  .from("saleData")
                  .select("*")
                  .eq("saleContractAddress", saleContractAddress)
                  .single();

              // コントラクトインスタンスを作成
              const saleContract = new ethers.Contract(saleContractAddress, saleArtifact.abi, provider);

              // 必要なデータを取得
              const [
                  totalRaised,
                  launched,
                  positiveToken,
                  negativeToken
              ] = await Promise.all([
                  saleContract.totalRaised(),
                  saleContract.launched(),
                  saleContract.positiveToken(),
                  saleContract.negativeToken()
              ]);

              // Factoryからメタデータを取得
              const metadata = await factory.getSaleMetadata(saleContractAddress);


              const saleData = {
                  saleContractAddress: saleContractAddress,
                  creator: event.args!.creator,
                  name: event.args!.name,
                  symbol: event.args!.symbol,
                  logoUrl: metadata.logoUrl,
                  websiteUrl: metadata.websiteUrl,
                  twitterUrl: metadata.twitterUrl,
                  telegramUrl: metadata.telegramUrl,
                  description: metadata.description,
                  blockNumber: event.blockNumber.toString(),
                  transactionHash: event.transactionHash,
                  totalRaised: totalRaised.toString(),
                  launched: launched,
                  positiveToken: positiveToken,
                  negativeToken: negativeToken
              } as SaleData;

              if (launched) {
                const [positivePairAddress, negativePairAddress] = await getLaunchedDetails(positiveToken, negativeToken);
                console.log("pairAddress", positivePairAddress, negativePairAddress);
                saleData.positivePairAddress = positivePairAddress || "";
                saleData.negativePairAddress = negativePairAddress || "";
              }

              if (existingData) {
                  // 既存のデータを更新
                  const { error: updateError } = await supabase
                      .from("saleData")
                      .update(saleData)
                      .eq("saleContractAddress", saleContractAddress);

                  if (updateError) {
                      console.error(`Error updating sale ${saleContractAddress}:`, updateError);
                      continue;
                  }
                  console.log(`Successfully updated sale ${saleContractAddress}`);
              } else {
                  // 新規データを挿入
                  const { error: insertError } = await supabase
                      .from("saleData")
                      .insert(saleData);

                  if (insertError) {
                      console.error(`Error inserting sale ${saleContractAddress}:`, insertError);
                      continue;
                  }
                  console.log(`Successfully inserted sale ${saleContractAddress}`);
              }

          } catch (error) {
              console.error(`Error processing sale ${saleContractAddress}:`, error);
              continue;
          }
      }

      console.log("Historical sales sync completed");
  } catch (error) {
      console.error("Error in syncHistoricalSales:", error);
      throw error;
  }
}


async function getLaunchedDetails(positiveToken: string, negativeToken: string) {
    const wethAddress = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
    const FACTORY_ABI = ['function getPair(address tokenA, address tokenB) external view returns (address pair)'];
    const factory = new ethers.Contract(uniswapFactoryAddress, FACTORY_ABI, provider);
    const [positivePairAddress, negativePairAddress] = await Promise.all([
      factory.getPair(positiveToken, wethAddress),
      factory.getPair(negativeToken, wethAddress)
    ]);
    return [positivePairAddress, negativePairAddress];
  }



// メインの初期化関数を修正
async function initialize() {
  try {
      // 過去のデータを同期
      await syncHistoricalSales();

      // イベントリスナーを開始
      console.log("Starting event listeners...");

      console.log("Initialization completed");
  } catch (error) {
      console.error("Initialization failed:", error);
      throw error;
  }
}

