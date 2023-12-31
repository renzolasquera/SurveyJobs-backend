const { request, response } = require('express');

const { Survey } = require('../models/surveyModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');

const search = async ( req = request, res=response) => {
    const term = req.params.term;
    const collection = req.params.collection
    const regex = new RegExp(term,'i');

    const { since = 0, limit = 0 } = req.query;

    let config;
    let results = [];
    let total = 0;

    switch (collection) {
        case 'surveys':
            const { public, SearchByCategory } = req.query;
            config = {
                $or: [{title: regex}, {category: regex}],
                $and: [{status: true}]
            }
            if (public) {
                config.$and.push({public: true});
            }
            if (SearchByCategory) {
                config.$or.shift();
            }
            results = await Survey.find(config).skip(since).limit(limit).select('-answers -questions').populate('owner','username');
            total = await Survey.countDocuments(config);
            break;
        case 'categories':
            config = {
                $or: [{category: regex}],
                $and: [{status: true}]
            }
            results = await Category.find(config);
            total = await Category.countDocuments(config);
            break;
        case 'users':
            config = {
                $or: [{username: regex}, {email: regex}],
                $and: [{status: true}]
            }
            results = await User.find(config).skip(since).limit(limit);
            total = await User.countDocuments(config);
            break;
        default:
            return res.status(400).json({
                "msg":"Colección no disponible"
            })
            break;
    }

    res.json({
        "collection-requested": collection,
        results,
        total
    })
}

module.exports = {
    search
}