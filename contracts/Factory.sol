// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import "./SaleContract.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
library Storage {

    struct Sale {
        address creator;
        string name;
        string symbol;
        uint256 totalRaised;
        uint256 saleGoal;
        bool launched;
        uint256 creationNonce;
    }

    struct SaleMetadata {
        string logoUrl;
        string websiteUrl;
        string twitterUrl;
        string telegramUrl;
        string description;
        string[] relatedLinks;
    }

    struct Configuration {
        address owner;
        uint96 saleCounter;
        address launchContractAddress;
        uint8 creatorshare;
        uint8 feepercent;
        uint8 buyLpFee;
        uint8 sellLpFee;
        uint8 buyProtocolFee;
        uint8 sellProtocolFee;
        uint256 totalTokens;
        uint256 defaultSaleGoal;
        uint256 defaultK;
        uint256 defaultAlpha;
    }

    uint8 constant CONFIG_SLOT = 1;
    uint8 constant SALES_SLOT = 2;
    uint8 constant SALE_METADATA_SLOT = 3;
    uint8 constant USER_BOUGHT_TOKENS_SLOT = 4;
    uint8 constant USER_HAS_BOUGHT_TOKEN_SLOT = 5;
    uint8 constant CREATION_NONCE_SLOT = 6;
    uint8 constant FIRST_BUYER_SLOT = 7;
    uint8 constant CREATOR_TOKENS_SLOT = 8;
    uint8 constant HAS_CLAIMED_SLOT = 9;

    function config() internal pure returns(Configuration storage _s) {
        assembly {
            mstore(0, CONFIG_SLOT)
            _s.slot := keccak256(0,32)
        }
    }

    function sales(address saleContractAddress) internal pure returns(Sale storage _s) {
        assembly {
            mstore(0, SALES_SLOT)
            mstore(32, saleContractAddress)
            _s.slot := keccak256(0,64)
        }
    }

    function saleMetadata(address saleContractAddress) internal pure returns(SaleMetadata storage _s) {
        assembly {
            mstore(0, SALE_METADATA_SLOT)
            mstore(32, saleContractAddress)
            _s.slot := keccak256(0,64)
        }
    }

    function userBoughtTokens(address user) internal pure returns(address[] storage _s) {
        assembly {
            mstore(0, USER_BOUGHT_TOKENS_SLOT)
            mstore(32, user)
            _s.slot := keccak256(0,64)
        }
    }

    function userHasBoughtToken(address user) internal pure returns(mapping(address => bool) storage _s) {
        assembly {
            mstore(0, USER_HAS_BOUGHT_TOKEN_SLOT)
            mstore(32, user)
            _s.slot := keccak256(0,64)
        }
    }

    function creationNonce() internal pure returns(mapping(address => uint256) storage _s) {
        assembly {
            mstore(0, CREATION_NONCE_SLOT)
            _s.slot := keccak256(0,32)
        }
    }

    function firstBuyer() internal pure returns(mapping(address => address) storage _s) {
        assembly {
            mstore(0, FIRST_BUYER_SLOT)
            _s.slot := keccak256(0,32)
        }
    }

    function creatorTokens(address creator) internal pure returns(address[] storage _s) {
        assembly {
            mstore(0, CREATOR_TOKENS_SLOT)
            mstore(32, creator)
            _s.slot := keccak256(0,64)
        }
    }

    function hasClaimed(address saleContractAddress) internal pure returns(mapping(address => bool) storage _s) {
        assembly {
            mstore(0, HAS_CLAIMED_SLOT)
            mstore(32, saleContractAddress)
            _s.slot := keccak256(0,64)
        }
    }

}



interface ISaleContract {
    function buy(address user, uint256 minTokensOut, string memory message) external payable returns (uint256, uint256);
    function sell(address user, uint256 tokenAmount, uint256 minEthOut) external returns (uint256, uint256);
    function claimTokens(address user) external;
    function launchSale(
        address _launchContract,
        address firstBuyer,
        address saleInitiator
    ) external;
    function takeFee(address lockFactoryOwner) external;
    function token() external view returns (address);
}




contract EtherFunFactory is ReentrancyGuard {
    event SaleCreated(
        address indexed saleContractAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 saleGoal,
        string logoUrl,
        string websiteUrl, 
        string twitterUrl, 
        string telegramUrl, 
        string description,
        string[] relatedLinks
    );

    event SaleLaunched(address indexed saleContractAddress, address indexed launcher);
    event Claimed(address indexed saleContractAddress, address indexed claimant);
    event MetaUpdated(address indexed saleContractAddress, string logoUrl, string websiteUrl, string twitterUrl, string telegramUrl, string description);
    event TokensBought(address indexed saleContractAddress, address indexed buyer, uint256 totalRaised, uint256 tokenBalance);
    event TokensSold(address indexed saleContractAddress, address indexed seller, uint256 totalRaised, uint256 tokenBalance);

    modifier onlyOwner() {
        require(msg.sender == Storage.config().owner, "Not the owner");
        _;
    }

    modifier onlySaleCreator(address saleContractAddress) {
        require(msg.sender == Storage.sales(saleContractAddress).creator, "Not creator");
        _;
    }

    constructor() {
        Storage.Configuration storage config = Storage.config();
        config.owner = msg.sender;
        config.launchContractAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        config.creatorshare = 4;
        config.feepercent = 2;
        config.buyLpFee = 5;
        config.sellLpFee = 5;
        config.buyProtocolFee = 5;
        config.sellProtocolFee = 5;
        config.totalTokens = 1000000000 * 1e18;
        config.defaultSaleGoal = 1.5 ether;
        config.defaultK = 222 * 1e15;
        config.defaultAlpha = 2878 * 1e6;
    }

    function createSale(
        string memory name, 
        string memory symbol,
        string memory logoUrl,
        string memory websiteUrl,
        string memory twitterUrl,
        string memory telegramUrl,
        string memory description,
        string[] memory relatedLinks,
        string memory message
    ) external payable nonReentrant {
        
        Storage.creationNonce()[msg.sender]++;
        uint256 currentNonce = Storage.creationNonce()[msg.sender];
        address saleContractAddress = predictTokenAddress(msg.sender, name, symbol, currentNonce);

        Storage.Sale storage sale = Storage.sales(saleContractAddress);
        sale.creator = msg.sender;
        sale.name = name;
        sale.symbol = symbol;
        sale.totalRaised = 0;
        sale.saleGoal = Storage.config().defaultSaleGoal;
        sale.launched = false;
        sale.creationNonce = currentNonce;

        Storage.SaleMetadata storage metadata = Storage.saleMetadata(saleContractAddress);
        metadata.logoUrl = logoUrl;
        metadata.websiteUrl = websiteUrl;
        metadata.twitterUrl = twitterUrl;
        metadata.telegramUrl = telegramUrl;
        metadata.description = description;
        metadata.relatedLinks = relatedLinks;
        Storage.creatorTokens(msg.sender).push(saleContractAddress);
        Storage.config().saleCounter++;

        emit SaleCreated(
            saleContractAddress,
            msg.sender,
            name,
            symbol,
            Storage.config().defaultSaleGoal,
            logoUrl, 
            websiteUrl, 
            twitterUrl, 
            telegramUrl, 
            description,
            relatedLinks
        );

        if (msg.value > 0) {
            require(msg.value < 0.2 ether, "Too many tokens bought");

            saleContractAddress = deploySaleContract(sale);
            require(saleContractAddress != address(0), "Sale contract not deployed");
            Storage.firstBuyer()[saleContractAddress] = msg.sender;

            uint256 minTokensOut = 0;
            (uint256 totalRaised, uint256 tokenBalance) = ISaleContract(saleContractAddress).buy{value: msg.value}(msg.sender, minTokensOut, message);
            sale.totalRaised = totalRaised;

            Storage.userBoughtTokens(msg.sender).push(saleContractAddress);
            Storage.userHasBoughtToken(msg.sender)[saleContractAddress] = true;
        
            emit TokensBought(saleContractAddress, msg.sender, totalRaised, tokenBalance);
        }
    }

    function deploySaleContract(Storage.Sale storage sale) internal returns (address saleContractAddress) {
        bytes32 salt = keccak256(abi.encodePacked(sale.creator, sale.creationNonce)); 
        Storage.Configuration storage config = Storage.config();
        bytes memory bytecode = abi.encodePacked(
            type(EtherfunSale).creationCode,
            abi.encode(
                sale.name,
                sale.symbol,
                sale.creator,
                address(this),
                config.totalTokens,
                config.defaultK,
                config.defaultAlpha,
                config.defaultSaleGoal,
                config.creatorshare,
                config.feepercent
            )
        );

        assembly {
            saleContractAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
            if iszero(extcodesize(saleContractAddress)) { revert(0, 0) }
        }

    }

    function buyToken(address saleContractAddress, uint256 minTokensOut, string memory message) external payable nonReentrant {
        console.log("-------- buyToken --------");
        console.log("eth sent", msg.value);
        Storage.Configuration storage config = Storage.config();
        Storage.Sale storage sale = Storage.sales(saleContractAddress);

        if (Storage.firstBuyer()[saleContractAddress] == address(0)) {
            saleContractAddress = deploySaleContract(sale);
            Storage.firstBuyer()[saleContractAddress] = msg.sender;
        }

        (uint256 totalRaised, uint256 tokenBalance) = ISaleContract(saleContractAddress).buy{value: msg.value}(msg.sender, minTokensOut, message);
        sale.totalRaised = totalRaised;


        if (!Storage.userHasBoughtToken(msg.sender)[saleContractAddress]) {
            Storage.userBoughtTokens(msg.sender).push(saleContractAddress);
            Storage.userHasBoughtToken(msg.sender)[saleContractAddress] = true;
        }

        if (totalRaised >= sale.saleGoal) {
            console.log("saleGoal reached at factory");
            sale.launched = true;
            emit SaleLaunched(saleContractAddress, msg.sender);
            ISaleContract(saleContractAddress).launchSale(
                config.launchContractAddress,
                Storage.firstBuyer()[saleContractAddress],
                msg.sender
            );
        }

        emit TokensBought(saleContractAddress, msg.sender, totalRaised, tokenBalance);
    }

    function sellToken(address saleContractAddress, uint256 tokenAmount, uint256 minEthOut) external nonReentrant {
        Storage.Sale storage sale = Storage.sales(saleContractAddress);
        require(!sale.launched, "Sale already launched");

        (uint256 totalRaised, uint256 tokenBalance) = ISaleContract(saleContractAddress).sell(msg.sender, tokenAmount, minEthOut);
        sale.totalRaised = totalRaised;

        emit TokensSold(saleContractAddress, msg.sender, totalRaised, tokenBalance);
    }

    function claim(address saleContractAddress) external nonReentrant {
        Storage.Sale storage sale = Storage.sales(saleContractAddress);
        require(sale.launched, "Sale not launched");
        require(!Storage.hasClaimed(saleContractAddress)[msg.sender], "Already claimed");

        Storage.hasClaimed(saleContractAddress)[msg.sender] = true;
        emit Claimed(saleContractAddress, msg.sender);
        ISaleContract(saleContractAddress).claimTokens(msg.sender);
    }

    function setSaleMetadata(
        address saleContractAddress,
        string memory logoUrl,
        string memory websiteUrl,
        string memory twitterUrl,
        string memory telegramUrl,
        string memory description
    ) external onlySaleCreator(saleContractAddress) {
        Storage.SaleMetadata storage metadata = Storage.saleMetadata(saleContractAddress);

        metadata.logoUrl = logoUrl;
        metadata.websiteUrl = websiteUrl;
        metadata.twitterUrl = twitterUrl;
        metadata.telegramUrl = telegramUrl;
        metadata.description = description;

        emit MetaUpdated(saleContractAddress, logoUrl, websiteUrl, twitterUrl, telegramUrl, description);
    }

    function getUserBoughtTokens(address user) external pure returns (address[] memory) {
        return Storage.userBoughtTokens(user);
    }

    function getSaleMetadata(address saleContractAddress) external pure returns (Storage.SaleMetadata memory) {
        return Storage.saleMetadata(saleContractAddress);
    }

    function getCurrentNonce(address user) public view returns (uint256) {
        return Storage.creationNonce()[user];
    }

    function getCreatorTokens(address creator) external pure returns (address[] memory) {
        return Storage.creatorTokens(creator);
    }

    function predictTokenAddress(
        address creator,
        string memory name,
        string memory symbol,
        uint256 nonce
    ) public view returns (address) {
        Storage.Configuration storage config = Storage.config();
        bytes32 salt = keccak256(abi.encodePacked(creator, nonce));
        bytes32 initCodeHash = keccak256(abi.encodePacked(
            type(EtherfunSale).creationCode,
            abi.encode(
                name,
                symbol,
                creator,
                address(this),
                config.totalTokens,
                config.defaultK,
                config.defaultAlpha,
                config.defaultSaleGoal,
                config.creatorshare,
                config.feepercent
            )
        ));

        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            initCodeHash
        )))));
    }

    function updateParameters(
        uint256 _defaultSaleGoal,
        uint256 _defaultK,
        uint256 _defaultAlpha,
        address _launchContractAddress,
        uint8 _buyLpFee,
        uint8 _sellLpFee,
        uint8 _buyProtocolFee,
        uint8 _sellProtocolFee
    ) external onlyOwner {
        require(_defaultSaleGoal > 0, "Invalid sale goal");
        require(_defaultK > 0, "Invalid K value");
        require(_defaultAlpha > 0, "Invalid alpha value");
        require(_launchContractAddress != address(0), "Invalid launch contract");
        
        Storage.Configuration storage config = Storage.config();
        config.defaultSaleGoal = _defaultSaleGoal;
        config.defaultK = _defaultK;
        config.defaultAlpha = _defaultAlpha;
        config.launchContractAddress = _launchContractAddress;
        config.buyLpFee = _buyLpFee;
        config.sellLpFee = _sellLpFee;
        config.buyProtocolFee = _buyProtocolFee;
        config.sellProtocolFee = _sellProtocolFee;
    }



}