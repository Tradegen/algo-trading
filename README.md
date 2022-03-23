# Tradegen Algo Trading

Smart contracts for on-chain algo trading. Trading bots consist of several entry/exit rules, each with a comparator and two indicators, which get checked whenever the price feed for the bot's subscribed asset (CELO, ETH, BTC, etc.) gets updated.

## Disclaimer

These smart contracts have not been audited or deployed yet. The logic for updating a bot's entry/exit rules are included here for reference. When the feature is ready to launch, these calculations will be made on a custom blockchain and the results will be sent to the BotPerformanceOracle (in synthetic-trading-bots repo) contract through a dedicated oracle.

## Docs

Docs are available at https://docs.tradegen.io

## License

MIT
