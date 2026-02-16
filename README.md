# Tether WDK x Fairblock SDK Demo

This simple demo showcases how the **Tether WDK** can be extended using the **Fairblock SDK** to enable **confidential transfers**.

## Prerequisites

- Node.js installed
- A wallet seed phrase with funds on the **Stable Testnet**

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your environment:
   Create a `.env` file in the root directory and add your seed phrase:
   ```bash
   SEED_PHRASE="your seed phrase here"
   ```

   > **Note:** You need a seed phrase for a wallet that has funds on the Stable Testnet. You can get testnet funds from the **Stable Testnet Faucet**.
   >
   > If you encounter any issues getting funds or running the demo, please contact us!

## Running the Demo

Run the application:

```bash
node app.js
```

This will execute the demo flow:
1. Initialize Tether WDK (Ethereum)
2. Enable Confidentiality (register with Fairblock)
3. Perform a Confidential Deposit
4. Execute a Confidential Transfer
5. Withdraw funds back to public balance

## Contact & Resources

For support or more information, reach out to us on Twitter:

- **Fairblock**: [@0xfairblock](https://twitter.com/0xfairblock)
- **Peyman**: [@Pememoni](https://twitter.com/Pememoni)

