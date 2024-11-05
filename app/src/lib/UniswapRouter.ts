import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';

// UniswapV2 Router ABI (必要な関数のみ)
const ROUTER_ABI = [
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
];

// ERC20 ABI (承認に必要な関数のみ)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];
const routerAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const wethAddress = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
interface SwapConfig {
  provider: ethers.providers.Provider;
  signer: ethers.Signer;
}

export class UniswapV2Service {
  private router: ethers.Contract;
  private wethAddress: string;
  private signer: ethers.Signer;

  constructor(config: SwapConfig) {
    this.router = new ethers.Contract(routerAddress, ROUTER_ABI, config.signer);
    this.wethAddress = wethAddress;
    this.signer = config.signer;
  }

  /**
   * ERC20トークンをETHに交換
   */
  async swapTokensForETH(
    tokenAddress: string,
    amountIn: BigNumber,
    slippageTolerance: number // 例: 0.5 = 0.5%
  ): Promise<{output: BigNumber, txHash: string}> {
    // トークンコントラクトのインスタンス化
    console.log("!!!!!22!  swapTokensForETH", tokenAddress, amountIn)
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const signerAddress = await this.signer.getAddress();

    // Routerのアドレスへの承認を確認・実行
    const allowance = await tokenContract.allowance(signerAddress, this.router.address);
    if (allowance.lt(amountIn)) {
      const approveTx = await tokenContract.approve(this.router.address, amountIn);
      await approveTx.wait();
    }
    let expectedOutput;
    try {
      [, expectedOutput] = await this.router.getAmountsOut(amountIn, [
        tokenAddress,
        this.wethAddress,
      ]);
    } catch (error) {
      console.error('Error calculating expected output:', error);
    }


    // スワップを実行
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分
    const tx = await this.router.swapExactTokensForETH(
      amountIn,
      expectedOutput||0,
      [tokenAddress, this.wethAddress],
      signerAddress,
      deadline
    );

    const receipt = await tx.wait();
    return { output: expectedOutput, txHash: receipt.transactionHash };
  }

  /**
   * ETHをERC20トークンに交換
   */
  async swapETHForTokens(
    tokenAddress: string,
    amountInEth: BigNumber,
    slippageTolerance: number
  ): Promise<{ output: BigNumber, txHash: string }> {
    const signerAddress = await this.signer.getAddress();

    // 予想される出力量を取得
    let minOutput;
    let expectedOutput;
    try {
      [, expectedOutput] = await this.router.getAmountsOut(amountInEth, [
        this.wethAddress,
        tokenAddress,
      ]);
      minOutput = expectedOutput.mul(1000 - Math.floor(slippageTolerance * 10))
      .div(1000);
    } catch (error) {
      console.error('Error calculating expected output:', error);
    }

    console.log(minOutput)

    // スワップを実行
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分
    console.log("wethAddress", this.wethAddress)
    console.log("tokenAddress", tokenAddress)
    const tx = await this.router.swapExactETHForTokens(
      minOutput || 0,
      [this.wethAddress, tokenAddress],
      signerAddress,
      deadline,
      { value: amountInEth }
    );

    const receipt = await tx.wait();
    return { output: expectedOutput || 0, txHash: receipt.transactionHash };
  }

  /**
   * 交換レートの取得（両方向）
   */
  async getExchangeRate(
    tokenAddress: string,
    amount: BigNumber,
    isExactInput: boolean,
    ethToToken: boolean
  ): Promise<BigNumber> {
    const path = ethToToken
      ? [this.wethAddress, tokenAddress]
      : [tokenAddress, this.wethAddress];

    try {
      if (isExactInput) {
        // 入力量から出力量を計算
        const [, outputAmount] = await this.router.getAmountsOut(amount, path);
        return outputAmount;
      } else {
        // 出力量から入力量を計算
        const [inputAmount] = await this.router.getAmountsIn(amount, path);
        return inputAmount;
      }
    } catch (error) {
      console.error('Error calculating exchange rate:', error);
      throw error;
    }
  }
}
