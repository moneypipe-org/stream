# Stream

> create a group that splits incoming money to members in realtime

Learn more: https://stream.moneypipe.xyz

![stream.png](stream.png)

---

# Contract

Stream is a [minimal proxy contract](https://eips.ethereum.org/EIPS/eip-1167), which makes deployments affordable ($40 ~ $90).

This repository is made up of 2 main files:

1. [Stream.sol](contracts/Stream.sol): The core "Stream" contract that handles realtime money split handling
2. [Factory.sol](contracts/Factory.sol): The factory that clones and deploys the core Stream contract

> There's an additional [Test.sol](contracts/Test.sol) but it's just for testing purpose and is not included in the deployment.
