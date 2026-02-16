import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import { ConfidentialTransferClient } from "@fairblock/stabletrust";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();
const STABLETRUST_CONTRACT_ADDRESS =
  "0x29E4fd434758b1677c10854Fa81C2fc496D76E62";
const USDT0_CONTRACT_ADDRESS = "0x78Cf24370174180738C5B8E352B6D14c83a6c9A9";
const RPC_URL = "https://rpc.testnet.stable.xyz";
const EXPLORER_URL = "https://testnet.stablescan.xyz/tx/";
const CHAIN_ID = 2201;

// This function can be added to the Tether SDK to enable confidential transfers for users.
async function enableConfidentiality(wallet, client) {
  console.log(`Enabling confidentiality for ${wallet.address}...`);
  // This wraps the Fairblock SDK's ensureAccount to register the user's public key
  // on the stabletrust contract if they haven't already.
  return await client.ensureAccount(wallet);
}

async function main() {
  console.log("Starting Tether x Fairblock Confidential Demo...");
  try {
    const customSeedPhrase = process.env.SEED_PHRASE;

    console.log("\n--- Initialize Tether WDK (Ethereum) ---");

    const wdkWithWallets = new WDK(customSeedPhrase).registerWallet(
      "ethereum",
      WalletManagerEvm,
      {
        provider: "https://rpc.testnet.stable.xyz",
      },
    );
    console.log("✓ Wallet registered for Stable Testnet");

    console.log("\n--- Account Details ---");
    const sender = await wdkWithWallets.getAccount("ethereum", 0);
    const reciever = await wdkWithWallets.getAccount("ethereum", 1);

    const senderAddress = await sender.getAddress();
    const recieverAddress = await reciever.getAddress();

    // Using WDK to get public balances
    const senderBalance = await sender.getBalance();
    const recieverBalance = await reciever.getBalance();

    console.log(`Sender: ${senderAddress} | Balance: ${senderBalance} ETH`);
    console.log(
      `Receiver: ${recieverAddress} | Balance: ${recieverBalance} ETH`,
    );

    // --- FAIRBLOCK INTEGRATION START ---

    // 1. Initialize Fairblock Client
    console.log("\n--- Initializing Confidential Layer ---");
    const client = new ConfidentialTransferClient(
      RPC_URL,
      STABLETRUST_CONTRACT_ADDRESS,
      CHAIN_ID,
    );

    // Prepare Ethers wallets from WDK keys for SDK compatibility
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const senderW = new ethers.Wallet(
      Buffer.from(sender.keyPair.privateKey).toString("hex"),
      provider,
    );
    const recipientW = new ethers.Wallet(
      Buffer.from(reciever.keyPair.privateKey).toString("hex"),
      provider,
    );

    // 2. Enable Confidentiality
    // The user enables confidentiality on their account.
    // This is the "onboarding" step to the confidential world.
    const senderKeys = await enableConfidentiality(senderW, client);
    const recipientKeys = await enableConfidentiality(recipientW, client);
    console.log("✓ Confidential accounts enabled via Tether SDK integration");

    // 3. Confidential Flow
    // Once enabled, the user can perform confidential operations normally.

    // A. DEPOSIT
    console.log("\n--- 1. CONFIDENTIAL DEPOSIT ---");
    console.log("Depositing 1 tokens into confidential balance...");
    const depositAmount = ethers.parseUnits("1", 2);

    // Check pre-deposit balance
    let senderConfBalanceBeforeDeposit = await client.getConfidentialBalance(
      senderAddress,
      senderKeys.privateKey,
      USDT0_CONTRACT_ADDRESS,
    );
    let senderPublicBalanceBeforeDeposit = await client.getPublicBalance(
      senderAddress,
      USDT0_CONTRACT_ADDRESS,
    );
    console.log(
      `Pre-Deposit Confidential Balance(Sender): ${ethers.formatUnits(senderConfBalanceBeforeDeposit.amount, 2)}`,
    );
    console.log(
      `Pre-Deposit Public Balance(Sender): ${ethers.formatUnits(senderPublicBalanceBeforeDeposit, 6)}`,
    );

    const depRes = await client.confidentialDeposit(
      senderW,
      USDT0_CONTRACT_ADDRESS,
      depositAmount,
    );
    console.log(`Tx Hash: ${depRes.hash}`);
    console.log(`View Transaction: ${EXPLORER_URL}${depRes.hash}`);

    let senderConfBalanceAfterDeposit = await client.getConfidentialBalance(
      senderAddress,
      senderKeys.privateKey,
      USDT0_CONTRACT_ADDRESS,
    );
    let senderPublicBalanceAfterDeposit = await client.getPublicBalance(
      senderAddress,
      USDT0_CONTRACT_ADDRESS,
    );
    console.log(
      `Post-Deposit Confidential Balance(Sender): ${ethers.formatUnits(senderConfBalanceAfterDeposit.amount, 2)}`,
    );
    console.log(
      `Post-Deposit Public Balance(Sender): ${ethers.formatUnits(senderPublicBalanceAfterDeposit, 6)}`,
    );

    // B. TRANSFER
    console.log("\n--- 2. CONFIDENTIAL TRANSFER ---");
    console.log("Transferring 0.5 tokens confidentially to recipient...");
    const transferAmount = ethers.parseUnits("0.5", 2);

    const txRes = await client.confidentialTransfer(
      senderW,
      recieverAddress,
      USDT0_CONTRACT_ADDRESS,
      transferAmount,
    );
    console.log(
      "Status:Confidential Transfer is completed. Transfer amount is hidden on-chain.",
    );
    console.log(`Tx Hash: ${txRes.hash}`);
    console.log(`View Transaction: ${EXPLORER_URL}${txRes.hash}`);

    let senderConfBalanceAfterTransfer = await client.getConfidentialBalance(
      senderAddress,
      senderKeys.privateKey,
      USDT0_CONTRACT_ADDRESS,
    );
    console.log(
      `Post-Transfer Confidential Balance(Sender): ${ethers.formatUnits(senderConfBalanceAfterTransfer.amount, 2)}`,
    );

    // C. WITHDRAW
    console.log("\n--- 3. WITHDRAW ---");
    console.log("Withdrawing 0.5 tokens to public balance...");
    const withdrawAmount = ethers.parseUnits("0.5", 2);

    // Checking RECIPIENT balance before withdraw, as recipient is withdrawing
    let recipientPublicBalanceBeforeWithdraw = await client.getPublicBalance(
      recieverAddress,
      USDT0_CONTRACT_ADDRESS,
    );
    console.log(
      `Pre-Withdraw Public Balance(Recipient): ${ethers.formatUnits(recipientPublicBalanceBeforeWithdraw, 6)}`,
    );

    const withdrawRes = await client.withdraw(
      recipientW,
      USDT0_CONTRACT_ADDRESS,
      withdrawAmount,
    );

    console.log(`Tx Hash: ${withdrawRes.hash}`);
    console.log(`View Transaction: ${EXPLORER_URL}${withdrawRes.hash}`);

    let recipientPublicBalanceAfterWithdraw = await client.getPublicBalance(
      recieverAddress,
      USDT0_CONTRACT_ADDRESS,
    );
    console.log(
      `Post-Withdraw Public Balance(Recipient): ${ethers.formatUnits(recipientPublicBalanceAfterWithdraw, 6)}`,
    );

    console.log("\n=== Demo Complete ===");
  } catch (err) {
    console.error("Error starting App:", err.message);
    console.error("Full error:", err);
  }
}

main();
