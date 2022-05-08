# Tradegen Algo Trading

This repo consists of smart contracts for algo trading, a keeper network, and indicators/comparators. 

Each trading bot is an NFT, which can be traded on the platform's marketplace or external marketplaces supporting the ERC1155 standard. The owner of a trading bot NFT collects 'usage fees' whenever a contract requests data from the trading bot's data feed. Anyone can create a trading bot, however, only a small subset of trading bots are published on the platform (through manual approval from the Tradegen team, due to scalability issues). Users can trade the NFTs regardless of whether the bot has been published, but only published bots will have a data feed.

Trading bots consist of several entry/exit rules, each with a comparator and two indicators. Each indicator/comparator is an NFT consisting of 'instances' (for example, the 'moving average' indicator could have 'BTC 50-period moving average on 1-minute timeframe' as an instance) that get updated regularly through our keeper network. Users who own an indicator/comparator NFT collect 'instance creation fees' whenever someone creates an instance of the indicator/comparator. Instance owners collect fees from developers who integrate instances in trading bots, and pay a keeper fee to a dedicated keeper for updating instances regularly. 

Each indicator acts as a 'derived price feed', taking the latest price data for a major crypto and applying some calculations to it to get a new price. For example, an indicator may track Ethereum's 50-day moving average. Developers could use the data from these indicators to create synthetic assets.

## Disclaimer

These smart contracts have not been audited or deployed yet.

## Docs

Docs are available at https://docs.tradegen.io

## License

MIT
