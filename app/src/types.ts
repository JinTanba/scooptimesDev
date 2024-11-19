// event SaleCreated(
//     address indexed saleContractAddress,
//     address indexed creator,
//     string name,
//     string symbol,
//     uint256 saleGoal,
//     string logoUrl,
//     string websiteUrl, 
//     string twitterUrl, 
//     string telegramUrl, 
//     string description
// );
export interface SaleCreatedEvent {
    saleContractAddress: string;
    creator: string;
    name: string;
    symbol: string;
    saleGoal: string;
    logoUrl: string;
    websiteUrl: string;
    twitterUrl: string;
    telegramUrl: string;
    description: string;
}

// struct Sale {
//     address creator;
//     string name;
//     string symbol;
//     uint256 totalRaised;
//     uint256 saleGoal;
//     bool launched;
//     uint256 creationNonce;
// }
export interface Sale {
    creator: string;
    name: string;
    symbol: string;
    totalRaised: string;
    saleGoal: string;
    launched: boolean;
    creationNonce: string;
}

// const _event = {
//     saleContractAddress,
//     creator,
//     name,
//     symbol,
//     saleGoal: saleGoal.toString(),
//     logoUrl,
//     websiteUrl,
//     twitterUrl,
//     telegramUrl,
//     description,
//     blockNumber: event.blockNumber,
//     transactionHash: event.transactionHash,
//     totalRaised: totalRaised.toString(),
//     launched: launched
// }
export interface News {
    saleContractAddress: string;
    creator: string;
    name: string;
    symbol: string;
    saleGoal: string;
    logoUrl: string;
    websiteUrl: string;
    twitterUrl: string;
    telegramUrl: string;
    description: string;
    blockNumber: string;
    transactionHash: string;
    totalRaised: string;
    launched: boolean;
    boon?: boolean;
}

// {
//     "id": "21109557-0",
//     "saleContractAddress": "0x1b8f6797F68a6d1525a7752D645E9ADdB5df8836",
//     "buyer": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
//     "totalRaised": "1.07996",
//     "tokenBalance": "164483220.094338284920083391",
//     "blockNumber": 21109557,
//     "transactionHash": "0x4da8945eb0ba4cf752040a90a408da43ef6bd87b72500a1321cb5c0d4af99b69",
//     "timestamp": "2024/11/3 14:58:55"
// }
export interface Purchase {
    id: string;
    saleContractAddress: string;
    buyer: string;
    totalRaised: string;
    tokenBalance: string;
    blockNumber: string;
    transactionHash: string;
    timestamp: string;
}


export interface Comment {
    id?: string;
    newsAddress: string;
    content: string;
    userAddress: string;
    parentId: string;
    likeCount: number;
}

export interface DisplayData {
    name: string
    symbol: string
    logoUrl: string
    websiteUrl: string
    twitterUrl: string
    telegramUrl: string
    description: string
    relatedLinks: string[]
    totalRaised: string
    saleGoal: string
    launched: boolean
}


