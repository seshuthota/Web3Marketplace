pragma solidity ^0.5.0;

contract Marketplace {
    string public name;
    uint256 public productCount = 0;
    mapping(uint256 => Product) public products;

    struct Product {
        uint256 id;
        string name;
        uint256 price;
        address payable owner;
        bool purchased;
    }

    event ProductCreated(
        uint256 id,
        string name,
        uint256 price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased(
        uint256 id,
        string name,
        uint256 price,
        address payable owner,
        bool purchased
    );

    constructor() public {
        name = "Dragon Marketplace";
    }

    function createProduct(string memory _name, uint256 _price) public {
        //make sure parameters are correct
        //Require a valid name
        require(bytes(_name).length > 0);
        //Require a valid price
        require(_price > 0);
        //Increment product count
        productCount++;
        //create product
        products[productCount] = Product(
            productCount,
            _name,
            _price,
            msg.sender,
            false
        );
        //trigger an event
        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint256 _id) public payable {
        //Fetch the product
        Product memory _product = products[_id];
        //Fetch the owner
        address payable _seller = _product.owner;
        //Make sure product has valid id
        require(_id > 0 && _id <= productCount);
        //Require there is enough ether
        require(msg.value >= _product.price);
        //Requrie product has not been purchased already
        require(!_product.purchased);
        //Require that the buyer is not the seller
        require(_seller != msg.sender);
        //Transfer owership to buyer
        _product.owner = msg.sender;
        _product.purchased = true;
        products[_id] = _product;
        //Pay the seller by sending ether.
        address(_seller).transfer(msg.value);
        //Trigger an event
        emit ProductPurchased(_id, _product.name, msg.value, msg.sender, true);
    }
}
