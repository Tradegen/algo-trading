/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */

 const { parseEther } = require("@ethersproject/units");
 const { newKit } = require("@celo/contractkit");
 
 const Keeper = require("./Keeper.json");
 const KeeperRegistry = require("./KeeperRegistry.json");
 
 exports.performUpkeep = async (event, context) => {
   const kit = newKit("https://alfajores-forno.celo-testnet.org");
   kit.connection.addAccount(process.env.PRIVATE_KEY);
 
   let keeperRegistry = new kit.web3.eth.Contract(
     KeeperRegistry,
     process.env.KEEPER_REGISTRY_ADDRESS
   );
 
   let keeper = new kit.web3.eth.Contract(
     Keeper,
     process.env.KEEPER_ADDRESS
   );
 
   let availableJobs = await keeperRegistry.methods.getAvailableJobs(process.env.KEEPER_ADDRESS).call();
 
   if (!availableJobs) {
     console.log("Available jobs is not defined.");
     return;
   }
 
   for (let i = 0; i < availableJobs.length; i++) {
     let canUpdate = await keeper.methods.checkUpkeep(availableJobs[i]).call();
 
     if (canUpdate) {
       try
       {
         console.log("Performing upkeep: " + availableJobs[i].toString());
 
         let txo = await keeper.methods.performUpkeep(availableJobs[i]);
         await kit.sendTransactionObject(txo, { from: process.env.DEDICATED_CALLER });
 
         console.log("Successfully performed upkeep: " + availableJobs[i].toString());
       }
       catch (err)
       {
         console.log("Cannot perform upkeep; " + availableJobs[i].toString(), err.message);
       }
     }
   }
 };
 