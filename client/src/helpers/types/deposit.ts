import { PaymentPlatformType } from '@helpers/types';


// struct Deposit {
//   address depositor;
//   uint256[5] packedVenmoId;
//   uint256 depositAmount;
//   uint256 remainingDeposits;          // Amount of remaining deposited liquidity
//   uint256 outstandingIntentAmount;    // Amount of outstanding intents (may include expired intents)
//   uint256 conversionRate;             // Conversion required by off-ramper between USDC/USD
//   bytes32[] intentHashes;             // Array of hashes of all open intents (may include some expired if not pruned)
// }
export interface Deposit {
  platformType: PaymentPlatformType;
  depositor: string;
  venmoId: string;
  offRamperName?: string;
  depositAmount: bigint;
  remainingDepositAmount: bigint;
  outstandingIntentAmount: bigint;
  conversionRate: bigint;
  intentHashes: string[];
}

// struct DepositWithAvailableLiquidity {
//    deposit: Deposit;
//    uint256: availableLiquidity;
//    bytes32: depositorIdHash;
//    uint256: depositId;
// }
export interface DepositWithAvailableLiquidity {
  depositId: bigint;
  deposit: Deposit;
  availableLiquidity: bigint;
  depositorIdHash: string;
} // DepositsProvider.getAccountDeposits, LiquidityProvider.getDepositFromIds

export interface StoredDeposit extends DepositWithAvailableLiquidity {
  depositId: bigint;
}

export interface IndicativeQuote {
  depositId?: bigint;
  usdAmountToSend?: string;
  error?: string;
  maxUSDCAmountAvailable?: string;
  conversionRate?: bigint;
}

// struct Intent {
//   address onramper;
//   uint256 deposit;
//   uint256 amount;
//   uint256 intentTimestamp;
//   address to;
// }
export interface Intent {
  onRamper: string;
  deposit: bigint;
  amount: bigint;
  timestamp: bigint;
  to: string;
}

export interface DepositIntent {
  onRamperVenmoHash: string;
  deposit: Deposit;
  intent: Intent;
  intentHash: string;
}

export interface OnRamperIntent {
  depositorVenmoId: string;
  intent: Intent;
}
