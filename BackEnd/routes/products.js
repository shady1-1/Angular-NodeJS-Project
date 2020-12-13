const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');
const helper = require('../config/helpers');

/* GET ALL PRODUCTS */
router.get('/', function (req, res) {       // Sending Page Query Parameter is mandatory http://localhost:3636/api/products?page=1
    let page = (req.query.page !== undefined && req.query.page !== 0) ? req.query.page : 1;
    const limit = (req.query.limit !== undefined && req.query.limit !== 0) ? req.query.limit : 10;   // set limit of items per page
    let startValue;
    let endValue;
    if (page > 0) {
        startValue = (page * limit) - limit;     // 0, 10, 20, 30
        endValue = page * limit;                  // 10, 20, 30, 40
    } else {
        startValue = 0;
        endValue = 10;
    }
    database.table('products as p')
        .join([
            {
                table: "categories as c",
                on: `c.id = p.cat_id`
            }
        ])
        .withFields(['c.title as category',
            'p.title as name',
            'p.price',
            'p.quantity',
            'p.description',
            'p.image',
            'p.id'
        ])
        .slice(startValue, endValue)
        .sort({id: .1})
        .getAll()
        .then(prods => {
            if (prods.length > 0) {
                res.status(200).json({
                    count: prods.length,
                    products: prods
                });
            } else {
                res.json({message: "No products found"});
            }
        })
        .catch(err => console.log(err));
});




/* GET ONE PRODUCT*/
router.get('/:prodId', (req, res) => {
    let productId = req.params.prodId;
    database.table('products as p')
        .join([
            {
                table: "categories as c",
                on: `c.id = p.cat_id`
            }
        ])
        .withFields(['c.title as category',
            'p.title as name',
            'p.price',
            'p.quantity',
            'p.description',
            'p.image',
            'p.id',
            'p.images'
        ])
        .filter({'p.id': productId})
        .get()
        .then(prod => {
            console.log(prod);
            if (prod) {
                res.status(200).json(prod);
            } else {
                res.json({message: `No product found with id ${productId}`});
            }
        }).catch(err => res.json(err));
});



//delete product
router.delete("/delete/:prodId", (req, res) => {
    let prodId = req.params.prodId;

    if (!isNaN(prodId)) {
        database
            .table("products")
            .filter({ id: prodId })
            .remove()
            .then(successNum => {
                if (successNum == 1) {
                    res.status(200).json({
                        message: `Record deleted with product id ${prodId}`,
                        status: 'success'
                    });
                } else {
                    res.status(500).json({status: 'failure', message: 'Cannot delete the product'});
                }
            })
            .catch((err) => res.status(500).json(err));
    } else {
        res
            .status(500)
            .json({ message: "ID is not a valid number", status: "failure" });
    }
});




/* GET ALL PRODUCTS FROM ONE CATEGORY */
router.get('/category/:catName', (req, res) => { // Sending Page Query Parameter is mandatory http://localhost:3636/api/products/category/categoryName?page=1
    let page = (req.query.page !== undefined && req.query.page !== 0) ? req.query.page : 1;   // check if page query param is defined or not
    const limit = (req.query.limit !== undefined && req.query.limit !== 0) ? req.query.limit : 10;   // set limit of items per page
    let startValue;
    let endValue;
    if (page > 0) {
        startValue = (page * limit) - limit;      // 0, 10, 20, 30
        endValue = page * limit;                  // 10, 20, 30, 40
    } else {
        startValue = 0;
        endValue = 10;
    }



    //createProduct






    // Get category title value from param
    const cat_title = req.params.catName;

    database.table('products as p')
        .join([
            {
                table: "categories as c",
                on: `c.id = p.cat_id WHERE c.title LIKE '%${cat_title}%'`
            }
        ])
        .withFields(['c.title as category',
            'p.title as name',
            'p.price',
            'p.quantity',
            'p.description',
            'p.image',
            'p.id'
        ])
        .slice(startValue, endValue)
        .sort({id: 1})
        .getAll()
        .then(prods => {
            if (prods.length > 0) {
                res.status(200).json({
                    count: prods.length,
                    products: prods
                });
            } else {
                res.json({message: `No products found matching the category ${cat_title}`});
            }
        }).catch(err => res.json(err));

});


router.post('/create', [
], async (req, res) => {

        let title = req.body.title;
        let image = req.body.image;
        let description = req.body.description;
        let price = req.body.price;
        let quantity = req.body.quantity;
        let short_desc = req.body.short_desc;
        let cat_id = req.body.cat_id;
        console.log(req.body);
        helper.database.table('products').insert({
            title: title,
            image: image,
            description: description,
            price: price,
            quantity: quantity,
            short_desc: short_desc,
            cat_id: cat_id,

        }).then((payload)=>{
            res.json({operation:'success'});
        }).catch(err => res.status(433).json({error: err}));
});


/* UPDATE USER DATA */
router.patch('/update/ProductId', async (req, res) => {
    let prodId = req.params.prodId;     // Get the User ID from the parameter

    // Search User in Database if any
    let product = await database.table('Product').filter({id: prodId}).get();
    if (product) {

        let title = req.body.title;
        let image = req.body.image;
        let description = req.body.description;
        let price = req.body.price;
        let quantity = req.body.quantity;
        let short_desc = req.body.short_desc;
        let cat_id = req.body.cat_id;
        // Replace the user's information with the form data ( keep the data as is if no info is modified )
        database.table('users').filter({id: prodId}).update({
            title: title !== undefined ? title : product.title,
            image: image !== undefined ? image : product.image,
            description: description !== undefined ? description : product.description,
            price: price !== undefined ? price : product.price,
            quantity: quantity !== undefined ? quantity : product.quantity,
            short_desc: short_desc !== undefined ? short_desc : product.short_desc,
            cat_id: cat_id !== undefined ? cat_id : product.cat_id,
        }).then(result => res.json('Product updated successfully')).catch(err => res.json(err));
    }
});

module.exports = router;
