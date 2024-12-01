import { create } from 'zustand';
import { ethers } from 'ethers';
import { News } from '@/types';
import saleArtifact from '../EtherfunSale.json';
import { createClient } from 'graphql-ws';
import { calcMarketcap } from './UniswapRouter';

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/96089/skininthegame2/version/latest";
const WS_SUBGRAPH_URL = SUBGRAPH_URL.replace('https', 'wss');
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");

const wsClient = createClient({
  url: WS_SUBGRAPH_URL,
});

// GraphQL subscription for TokensBought events
const TOKENS_BOUGHT_SUBSCRIPTION = `
  subscription OnTokensBought {
    tokensBoughts(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
      id
      saleContractAddress
      buyer
      totalRaised
      tokenBalance
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;
// GraphQL subscription for SaleLaunched events
const SALE_LAUNCHED_SUBSCRIPTION = `
  subscription OnSaleLaunched {
    saleLauncheds(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
      id
      saleContractAddress
      launcher
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

async function fetchSaleEvents() {
  const query = `
    query GetSaleEvents($blockNumber: BigInt!) {
      saleCreateds(
        where: { blockNumber_gte: $blockNumber }
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        saleContractAddress
        creator
        name
        symbol
        saleGoal
        logoUrl
        websiteUrl
        twitterUrl
        telegramUrl
        description
        relatedLinks
        blockNumber
        transactionHash
      }
    }
  `;

  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        blockNumber: "7018959"
      }
    }),
  });

  const { data } = await response.json();
  return data.saleCreateds;
}

type NewsState = {
  news: News[];
  addNews: (news: News) => void;
  updateNews: (saleAddress: string, totalRaised: string) => void;
  launchNews: (saleAddress: string) => void;
  initializeEventListeners: (factoryAddress: string) => void;
  subscribeToEvents: () => void;
  unsubscribeFromEvents: () => void;
}

export const useNewsStore = create<NewsState>((set) => {
  let tokensBoughtUnsubscribe: (() => void) | null = null;
  let saleLaunchedUnsubscribe: (() => void) | null = null;

  return {
    news: [],
    addNews: (news: News) => set((state) => ({ 
      news: [news, ...state.news] 
    })),
    updateNews: (saleAddress: string, totalRaised: string) => set((state) => ({
      news: state.news.map(n => 
        n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase()
          ? { ...n, totalRaised }
          : n
      )
    })),
    launchNews: (saleAddress: string) => set((state) => ({
      news: state.news.map(n =>
        n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase()
          ? { ...n, launched: true }
          : n
      )
    })),
    initializeEventListeners: async (factoryAddress: string) => {
      try {
        console.log('Fetching initial data...');
        const events = await fetchSaleEvents();
        
        if (!events) {
          console.log('No events found');
          return;
        }

        console.log(events)

        console.log('Processing events...');
        const processedData = await Promise.all(
          events.map(async (event) => {
            const saleContractAddress = event.saleContractAddress;
            const saleContract = new ethers.Contract(
              saleContractAddress, 
              saleArtifact.abi, 
              provider
            );
            
            let totalRaised = 0;
            let launched = false;
            let positiveToken = "";
            let negativeToken = "";
            
            try {
              [totalRaised, launched, positiveToken, negativeToken] = await Promise.all([
                saleContract.totalRaised(),
                saleContract.launched(),
                saleContract.positiveToken(),
                saleContract.negativeToken(),
              ]);
            } catch (error) {
              console.error('Error fetching sale data:', error);
            }

            let positiveMarketcap = 0;
            let negativeMarketcap = 0;
            if (launched) {
              try {
                [positiveMarketcap, negativeMarketcap] = await Promise.all([
                  calcMarketcap(positiveToken, provider),
                  calcMarketcap(negativeToken, provider)
                ]);
              } catch (error) {
                console.error('Error calculating marketcap:', error);
              }
            }

            return {
              ...event,
              saleGoal: event.saleGoal.toString(),
              totalRaised: totalRaised.toString(),
              launched,
              positiveMarketcap,
              negativeMarketcap
            };
          })
        );

        console.log('Setting processed data:', processedData);
        set({ news: processedData.reverse() });

      } catch (error) {
        console.error('Error in initializeEventListeners:', error);
      }
    }
  };
});