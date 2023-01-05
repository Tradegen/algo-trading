# Tradegen Algo Trading

## Purpose

Create a democratized algo trading system on the Celo blockchain.

## System Design

At a high level, the system consists of trading bots, a marketplace, a keeper network, and indicators/comparators. 

Each trading bot is an NFT that can be traded on the platform's marketplace or external marketplaces supporting the ERC1155 standard. Anyone can create a trading bot, however, only a small subset of trading bots are published on the platform (through manual approval from the Tradegen team due to scalability issues). Users can trade the NFTs regardless of whether the bot has been published, but only published bots will have a data feed. The owner of a trading bot NFT collects 'usage fees' whenever an external contract requests data from the trading bot's data feed.

Trading bots consist of several entry/exit rules, each with a comparator and two indicators. Each indicator/comparator is an NFT consisting of 'instances' (for example, the 'moving average' indicator could have 'BTC 50-period moving average on 1-minute timeframe' as an instance) that get updated regularly through the keeper network. If the entry/exit rules are met, the bot sends a simulated trade to its data feed, which tracks the bot's lifetime performance. Users who own an indicator/comparator NFT collect 'instance creation fees' whenever someone creates an instance of the indicator/comparator. Instance owners collect fees from developers who integrate instances in trading bots, and pay a keeper fee to a dedicated keeper for updating instances regularly. 

Each indicator acts as a 'derived price feed', taking the latest price data for a major crypto and applying some calculations to it to get a new price. For example, an indicator may track Ethereum's 50-day moving average. Developers could use the data from these indicators to create synthetic assets.

Each comparator takes the value of two indicator instances and applies a comparison function to them. For example, a trading strategy that involves buying BTC when it crosses above the 200-day moving average would use 'crosses above' as the comparator, 'latest price' as the first indicator instance, and '200-day moving average' as the second indicator instance.

A keeper network is used to check a trading bot's entry/exit rules at regular intervals (once per timeframe specified by the bot's developer), since the code cannot execute automatically. Each keeper consists of a smart contract and a script running on the cloud. The script runs continuously and calls the keeper contract once per minute to check if any trading bots need to be updated. If a bot needs to be updated, the contract will collect a keeper fee from the bot's owner then send a transaction to the trading bot contract to check the entry/exit rules against the latest price data. To run a trading bot, the owner needs to assign a keeper to the bot and deposit funds in an escrow contract to pay the keeper fee. Anyone can register as a keeper and run a script.

## Disclaimer

These smart contracts have not been audited yet.

This protocol is very expensive to operate on an EVM-compatible blockchain. Running a trading bot costs on average 1.5 million gas per call (once per timeframe specified by bot), which can quickly congest the network. This protocol is for demonstration purposes only, and will need to run on its own blockchain to be used in production.

## Documentation

To learn more about the Tradegen project, visit the docs at https://docs.tradegen.io.

This protocol is launched on the Celo blockchain. To learn more about Celo, visit their home page: https://celo.org/.

Source code for data feeds: https://github.com/Tradegen/data-feeds.

## License

MIT
