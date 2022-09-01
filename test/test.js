const { expect } = require("chai");
const { network, ethers } = require("hardhat");
var signers, addresses, deployer, alice, bob, carol, broken, factory, stream;
const fs = require('fs');
const path = require('path');
const globalLogs = async (factoryAddress) => {
  let ABI = require(path.resolve(__dirname, "../abi/contracts/Factory.sol/Factory.json"))
  let interface = new ethers.utils.Interface(ABI)
  let events = await ethers.provider.getLogs({
    fromBlock: 0,
    toBlock: 'latest',
    address: factoryAddress,
  }).then((events) => {
    return events.map((e) => {
      return interface.parseLog(e).args
    })
  })
  return events;
}
const deploy = async () => {
  const [deployer] = await ethers.getSigners();
  let Factory = await ethers.getContractFactory('Factory');
  let factory = await Factory.deploy();
  await factory.deployed();
  await fs.promises.mkdir(path.resolve(__dirname, "../deployments"), { recursive: true }).catch((e) => { })
  await fs.promises.writeFile(path.resolve(__dirname, "../deployments/test.json"), JSON.stringify({ address: factory.address }))
  return factory;
}
const deployTest = async () => {
  const [deployer] = await ethers.getSigners();
  let Test = await ethers.getContractFactory('Test');
  let test = await Test.deploy();
  await test.deployed();
  return test;
}
const deployBroken = async () => {
  const [deployer] = await ethers.getSigners();
  let Broken = await ethers.getContractFactory('Broken');
  let broken = await Broken.deploy();
  await broken.deployed();
  return broken;
}
const clone = async (desc, members) => {
  let tx = await factory.genesis(desc, deployer.address, members)
  await tx.wait()

  let events = await globalLogs(factory.address)
  let address = events[0].group

  let ABI = require(path.resolve(__dirname, "../abi/contracts/SafeStream.sol/SafeStream.json"))
  stream = new ethers.Contract(address, ABI, ethers.provider.getSigner())

}
const getBalance = async () => {
  const aliceB = await ethers.provider.getBalance(alice.address)
  const bobB = await ethers.provider.getBalance(bob.address)
  const carolB = await ethers.provider.getBalance(carol.address)
  const brokenB = await ethers.provider.getBalance(broken.address)
  const deployerB = await ethers.provider.getBalance(deployer.address)
  const contractB = await ethers.provider.getBalance(stream.address)
  return {
    alice: ethers.utils.formatEther(aliceB),
    bob: ethers.utils.formatEther(bobB),
    carol: ethers.utils.formatEther(carolB),
    broken: ethers.utils.formatEther(brokenB),
    deployer: ethers.utils.formatEther(deployerB),
    contract: ethers.utils.formatEther(contractB)
  }
}
var factory
describe("stream", function () {
  beforeEach(async () => {

    // reset blockchain every time
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });

    signers = await ethers.getSigners();
    addresses = signers.map((s) => {
      return s.address
    })
    deployer = signers[0]
    alice = signers[1]
    bob = signers[2]
    carol = signers[3]

    broken = await deployBroken()

    factory = await deploy()

  })
  it('fetch members', async () => {
    await clone("alice, bob, carol", [{
      account: alice.address,
      value: "" + 1,
      total: 10
    }, {
      account: bob.address,
      value: "" + 2,
      total: 10
    }, {
      account: carol.address,
      value: "" + 7,
      total: 10
    }])
    let members = await stream.members()
    expect(members[0].account).to.equal(alice.address)
    expect(members[1].account).to.equal(bob.address)
    expect(members[2].account).to.equal(carol.address)
    expect(members[0].value).to.equal(1)
    expect(members[1].value).to.equal(2)
    expect(members[2].value).to.equal(7)

    expect(members[0].total).to.equal(10)
    expect(members[1].total).to.equal(10)
    expect(members[2].total).to.equal(10)
  })
  it('2 way equal split', async () => {

    await clone("alice and bob", [{
      account: alice.address,
      value: 1,
      total: 2,
    }, {
      account: bob.address,
      value: 1,
      total: 2,
    }])

    let beforeBalance = await getBalance()
    expect(beforeBalance.alice).to.equal('10000.0')
    expect(beforeBalance.bob).to.equal('10000.0')
    expect(beforeBalance.contract).to.equal('0.0')

    let tx = await deployer.sendTransaction({
      to: stream.address,
      value: ethers.utils.parseEther("3")
    });

    let afterBalance = await getBalance()
    expect(afterBalance.alice).to.equal('10001.5')
    expect(afterBalance.bob).to.equal('10001.5')
    expect(afterBalance.contract).to.equal('0.0')
  });
  it('3 way skewed split', async () => {

    await clone("alice, bob, carol", [{
      account: alice.address,
      value: "" + 1,
      total: 10
    }, {
      account: bob.address,
      value: "" + 2,
      total: 10
    }, {
      account: carol.address,
      value: "" + 7,
      total: 10
    }])

    let beforeBalance = await getBalance()
    expect(beforeBalance.alice).to.equal('10000.0')
    expect(beforeBalance.bob).to.equal('10000.0')
    expect(beforeBalance.carol).to.equal('10000.0')
    expect(beforeBalance.contract).to.equal('0.0')

    await deployer.sendTransaction({
      to: stream.address,
      value: ethers.utils.parseEther("1000")
    });

    let afterBalance = await getBalance()
    expect(afterBalance.alice).to.equal('10100.0')
    expect(afterBalance.bob).to.equal('10200.0')
    expect(afterBalance.carol).to.equal('10700.0')
    expect(afterBalance.contract).to.equal('0.0')
  });
  it('should fail if sent with send/transfer', async () => {
    let test = await deployTest()
    let tx = await deployer.sendTransaction({
      to: test.address,
      value: ethers.utils.parseEther("10")
    });
    await clone("alice, bob, carol", [{
      account: alice.address,
      value: "" + 1 * 100,
      total: 1000
    }, {
      account: bob.address,
      value: "" + 2 * 100,
      total: 1000
    }, {
      account: carol.address,
      value: "" + 7 * 100,
      total: 1000
    }])

    tx = test.withdrawFail1(stream.address)
    await expect(tx).to.be.revertedWith("ran out of gas");

    tx = test.withdrawFail2(stream.address)
    await expect(tx).to.be.revertedWith("Transaction reverted: contract call run out of gas and made the transaction revert")

    tx = test.withdrawSuccess(stream.address)
    await expect(tx).not.to.be.reverted
  })

  it("should not fail if one of receivers is broken smartcontract", async () => {
    let test = await deployTest()
    let beforeBalance = await getBalance()

    let tx = await deployer.sendTransaction({
      to: test.address,
      value: ethers.utils.parseEther("1000")
    });

    await clone("alice, bob, broken", [{
      account: alice.address,
      value: "" + 1 * 100,
      total: 1000
    }, {
      account: bob.address,
      value: "" + 2 * 100,
      total: 1000
    }, {
      account: broken.address,
      value: "" + 7 * 100,
      total: 1000
    }])

    tx = test.withdrawSuccess(stream.address)
    await expect(tx).not.to.be.reverted

    // check that the broken contract is not used
    let afterBalance = await getBalance()
    expect(afterBalance.alice).to.equal('10100.0')
    expect(afterBalance.bob).to.equal('10200.0')
    expect(afterBalance.broken).to.equal('0.0')

    // check that contract doesn't keep money in the contract
    expect(afterBalance.contract).to.equal('0.0')

    // check deployerAddress has receiver extra money
    expect(
      (afterBalance.deployer - beforeBalance.deployer).toFixed(1)
    ).to.equal(
      (700 - 1000).toFixed(1)
    )

  })
});
