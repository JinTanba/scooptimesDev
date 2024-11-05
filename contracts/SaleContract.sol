// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import "./PositionToken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { UD60x18, ud } from "@prb/math/src/UD60x18.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./NewsComment.sol";

contract EtherfunSale is ReentrancyGuard {

    // ボンディングカーブの数式だよ
    // in
    // tokens = (ln((totalRaised + ethAmount) / k + 1) - ln(totalRaised / k + 1)) / α
    // where:
    // - k: 初期価格係数
    // - α: 価格上昇の急峻さを決める係数
    // - totalRaised: 現在までの総調達額
    // - ethAmount: 投資するETHの量
    // out: 
    // eth = k * (exp(α * tokensSold) - exp(α * (tokensSold - tokenAmount)))
    // where:
    // - k: 初期価格係数
    // - α: 価格上昇の急峻さを決める係数
    // - tokensSold: 現在までの総販売トークン量
    // - tokenAmount: 売却するトークン量


    //using UD60x18 for uint256;
    string public name;
    string public symbol;
    address public positiveToken;
    address public negativeToken;
    //address public token;
    address public creator;
    address public factory;
    uint256 public totalTokens;
    uint256 public totalRaised;
    uint256 public maxContribution;
    uint8 public creatorshare;
    bool public launched;
    bool public status;
    uint256 public k; // Initial price factor
    uint256 public alpha; // Steepness factor for bonding curve
    uint256 public saleGoal; // Sale goal in ETH
    uint256 public tokensSold; // Track the number of tokens sold, initially 0
    mapping(address => uint256) public tokenBalances; // Track user token balances (not actual tokens)

    address[] public tokenHolders;
    mapping(address => bool) public isTokenHolder;

    address public wethAddress = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;
    uint256 public feePercent;
    address public feeWallet = 0xe97203B9AD2B6EfCDddDA642c798020c56eBFFC3;

    struct HistoricalData {
        uint256 timestamp;
        uint256 totalRaised;
    }
    
    HistoricalData[] public historicalData;

    event TokensPurchased(
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount,
        string message,
        uint256 timestamp
    );
    
    event TokensSold(
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 timestamp
    );

    event TokenLaunched(
        address indexed saleContract,
        address indexed negativeToken,
        address indexed positiveToken,
        uint256 perTokenAmont,
        uint256 timeStamp
    );

    event Comment(
        address indexed commenter,
        string comment,
        uint256 negative,
        uint256 positive,
        uint256 timestamp
    );

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        address _factory,
        uint256 _totalTokens,
        uint256 _k, // Initial price factor
        uint256 _alpha, // Steepness of bonding curve
        uint256 _saleGoal, // ETH goal for sale
        uint8 _creatorshare,
        uint256 _feePercent
    ) {
        name = _name;
        symbol = _symbol;
        creator = _creator;
        factory = _factory;
        totalTokens = _totalTokens;
        k = _k;
        alpha = _alpha;
        saleGoal = _saleGoal;
        creatorshare = _creatorshare;
        feePercent = _feePercent;

        tokensSold = 0; // Initialize tokensSold to 0
        //EtherfunToken newToken = new EtherfunToken(name, symbol, _totalTokens, address(this));
        //token = address(newToken);
    }

    function getEthIn(uint256 tokenAmount) public view returns (uint256) {
        UD60x18 soldTokensFixed = ud(tokensSold);
        UD60x18 tokenAmountFixed = ud(tokenAmount);
        UD60x18 kFixed = ud(k);
        UD60x18 alphaFixed = ud(alpha);

        // Calculate ethBefore = k * (exp(alpha * tokensSold) - 1)
        UD60x18 ethBefore = kFixed.mul(alphaFixed.mul(soldTokensFixed).exp()).sub(kFixed);

        // Calculate ethAfter = k * (exp(alpha * (tokensSold - tokenAmount)) - 1)
        UD60x18 ethAfter = kFixed.mul(alphaFixed.mul(soldTokensFixed.sub(tokenAmountFixed)).exp()).sub(kFixed);

        // Return the difference in Wei (ETH)
        return ethBefore.sub(ethAfter).unwrap();
    }

    // Function to calculate the number of tokens for a given ETH amount
    function getTokenIn(uint256 ethAmount) public view returns (uint256) {
        UD60x18 totalRaisedFixed = ud(totalRaised);
        UD60x18 ethAmountFixed = ud(ethAmount);
        UD60x18 kFixed = ud(k);
        UD60x18 alphaFixed = ud(alpha);

        // Calculate tokensBefore = ln((totalRaised / k) + 1) / alpha
        UD60x18 tokensBefore = totalRaisedFixed.div(kFixed).add(ud(1e18)).ln().div(alphaFixed);

        // Calculate tokensAfter = ln(((totalRaised + ethAmount) / k) + 1) / alpha
        UD60x18 tokensAfter = totalRaisedFixed.add(ethAmountFixed).div(kFixed).add(ud(1e18)).ln().div(alphaFixed);

        // Return the difference in tokens
        return tokensAfter.sub(tokensBefore).unwrap();
    }

    // Optimized buy function with direct fee distribution
    function buy(address user, uint256 minTokensOut, string memory message) external payable onlyFactory nonReentrant returns (uint256, uint256) {

        require(!launched, "Sale already launched");
        require(totalRaised + msg.value <= saleGoal + 0.1 ether, "Sale goal reached");
        require(msg.value > 0, "No ETH sent");
        require(!status, "bonded");

        // Calculate the fee and amount after fee deduction
        uint256 fee = (msg.value * feePercent) / 100;
        uint256 amountAfterFee = msg.value - fee;
        // Calculate tokens to buy with amountAfterFee
        uint256 tokensToBuy = getTokenIn(amountAfterFee);
        require(tokensToBuy >= minTokensOut, "Slippage too high, transaction reverted");
        tokensSold += tokensToBuy;
        totalRaised += amountAfterFee;

        tokenBalances[user] += tokensToBuy;

        if (!isTokenHolder[user]) {
            tokenHolders.push(user);
            isTokenHolder[user] = true;
        }

        payable(feeWallet).transfer(fee);

        if (totalRaised >= saleGoal) {
            status = true;
        }

        updateHistoricalData();

        emit TokensPurchased(
            user,
            amountAfterFee,
            tokensToBuy,
            message,
            block.timestamp
        );

        return (totalRaised, tokenBalances[user]);
    }

    // Optimized sell function with direct fee distribution
    function sell(address user, uint256 tokenAmount, uint256 minEthOut) external onlyFactory nonReentrant returns (uint256, uint256) {
        require(!launched, "Sale already launched");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokenBalances[user] >= tokenAmount, "Insufficient token balance");
        require(!status, "bonded");

        uint256 ethToReturn = getEthIn(tokenAmount);
        require(ethToReturn >= minEthOut, "Slippage too high, transaction reverted");
        require(ethToReturn <= address(this).balance, "Insufficient contract balance");

        // Calculate the fee and amount after fee deduction
        uint256 fee = (ethToReturn * feePercent) / 100;
        uint256 ethAfterFee = ethToReturn - fee;

        tokensSold -= tokenAmount;
        totalRaised -= ethToReturn;

        tokenBalances[user] -= tokenAmount;

        // Transfer ETH after fee to the user
        payable(user).transfer(ethAfterFee);

        payable(feeWallet).transfer(fee);
        // payable(0x4C5fbF8D815379379b3695ba77B5D3f898C1230b).transfer(fee / 2);
    
        updateHistoricalData();

        emit TokensSold(
            user,
            tokenAmount,
            ethAfterFee,
            block.timestamp
        );

        return (totalRaised, tokenBalances[user]);
    }

    function updateHistoricalData() internal {
        historicalData.push(HistoricalData({
            timestamp: block.timestamp,
            totalRaised: totalRaised
        }));
    }

    // Launch the sale, users can claim their tokens after launch
    function launchSale(
        address _launchContract,
        address firstBuyer,
        address saleInitiator
    ) external onlyFactory nonReentrant {
        require(!launched, "Sale already launched");
        require(totalRaised >= saleGoal, "Sale goal not reached");
        require(status, "not bonded");
        launched = true;
        // deploy token(totalTokens/2)
        ERC20 positiveTokenContract = new PositionToken(string.concat(name, "positive"), string.concat(symbol, "pos"), totalTokens/2);//PositionToken constructor should transfer all token to address(this);
        ERC20 negativeTokenContract = new PositionToken(string.concat(name, "negative"), string.concat(symbol, "neg"), totalTokens/2);//PositionToken constructor should transfer all token to address(this);
        positiveToken = address(positiveTokenContract);
        negativeToken = address(negativeTokenContract);

        uint256 tokenAmount = (totalTokens - tokensSold); // to dex(pos+neg)
        //tokensSold is remain in perContract
        uint256 launchEthAmount = (totalRaised * (100 - creatorshare)) / 100;// 0.96 * ethAmount, actual dex lp
        positiveTokenContract.approve(_launchContract, tokenAmount/2);
        negativeTokenContract.approve(_launchContract, tokenAmount/2);
        uint256 deadline = block.timestamp + 20 minutes;
        IUniswapV2Router01(_launchContract).addLiquidityETH{value: launchEthAmount/2}(positiveToken, tokenAmount/2, 0, launchEthAmount/2, address(this), deadline);
        IUniswapV2Router01(_launchContract).addLiquidityETH{value: launchEthAmount/2}(negativeToken, tokenAmount/2, 0, launchEthAmount/2, address(this), deadline);
        
        uint256 creatorShareAmount = address(this).balance;
        require(creatorShareAmount > 0, "No balance for creator share");

        payable(firstBuyer).transfer(creatorShareAmount/2);
        payable(saleInitiator).transfer(creatorShareAmount/2);
        emit TokenLaunched(address(this), positiveToken, negativeToken, tokenAmount/2, block.timestamp);

    }

    // Claim tokens after the sale is launched
    function claimTokens(address user) external onlyFactory nonReentrant {
        require(launched, "Sale not launched");
        uint256 tokenAmount = tokenBalances[user];
        ERC20(positiveToken).transfer(user, tokenAmount/2);
        ERC20(negativeToken).transfer(user, tokenAmount/2);
        tokenBalances[user] = 0;
    }

    function getAllTokenHolders() external view returns (address[] memory) {
        return tokenHolders;
    }

    function getAllHistoricalData() external view returns (HistoricalData[] memory) {
        return historicalData;
    }

    receive() external payable {}
}

