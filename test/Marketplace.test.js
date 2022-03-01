const { assert } = require("chai");

require('chai')
    .use(require('chai-as-promised'))
    .should()

const Marketplace = artifacts.require("Marketplace");

contract('Marketplace', ([deployer, seller, buyer]) => {
    let marketplace

    before(async () => {
        marketplace = await Marketplace.deployed();
    })

    describe('deployment', async () => {
        it('deploys suuccessfully', async () => {
            const address = await marketplace.address;
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })
        it('has a name', async () => {
            const name = await marketplace.name();
            assert.equal(name, 'Dragon Marketplace')
        })
    })

    describe('products', async () => {
        let result, productCount

        before(async () => {
            result = await marketplace.createProduct('iPhone X', web3.utils.toWei('1', 'ether'), { from: seller });
            productCount = await marketplace.productCount();

        })
        it('creates product', async () => {
            //SUCCESS
            assert.equal(productCount, 1)
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'iPhone X', 'name is correct')
            assert.equal(event.price, web3.utils.toWei('1', 'ether'), 'price is correct')
            assert.equal(event.owner, seller, 'owner is correct')
            assert.equal(event.purchased, false, 'purchased is correct')

            //FAILURE : Product must have a name
            await await marketplace.createProduct('', web3.utils.toWei('1', 'ether'), { from: seller }).should.be.rejected;
            //FAILURE : Product must have a price
            await await marketplace.createProduct('iPhone X', 0, { from: seller }).should.be.rejected;
        })

        it('lists products', async () => {
            const product = await marketplace.products(productCount);
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(product.name, 'iPhone X', 'name is correct')
            assert.equal(product.price, web3.utils.toWei('1', 'ether'), 'price is correct')
            assert.equal(product.owner, seller, 'owner is correct')
            assert.equal(product.purchased, false, 'purchased is correct')
        })

        it('sells products', async () => {
            //Track seller balance before purchase
            let oldSellerBalance
            var BN = web3.utils.BN;

            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = new BN(oldSellerBalance);

            //SUCCESS : Buyer makes purchase
            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'ether') });

            //Check logs
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'iPhone X', 'name is correct')
            assert.equal(event.price, web3.utils.toWei('1', 'ether'), 'price is correct')
            assert.equal(event.owner, buyer, 'owner is correct')
            assert.equal(event.purchased, true, 'purchased is correct')

            //Check if seller received the funds
            let newSellerbalance
            newSellerbalance = await web3.eth.getBalance(seller);
            newSellerbalance = new BN(newSellerbalance);

            let price;
            price = await web3.utils.toWei('1', 'ether');
            price = new BN(price);

            const expectedBalance = oldSellerBalance.add(price);
            assert.equal(newSellerbalance.toString(), expectedBalance.toString(), "Seller received funds ")


            //FAILURE : Tries to buy product that does not exist, i.e., product must have valid id
            await await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;
            //FAILURE : Tries to buy product without enough money
            await await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'ether') }).should.be.rejected;
            //FAILURE : Tries to buy product which was already purchased
            await await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;
            //FAILURE : Seller tried to buy his own product which should not be allowed
            await await marketplace.purchaseProduct(productCount, { from: seller, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;
            //FAILURE : Buyer tried to buy product again which should not be allowed
            await await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'ether') }).should.be.rejected;
        })
    })


})