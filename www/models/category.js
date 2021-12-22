"use strict";

const utils             = require('../utils/utils');
const CATEGORY_COLL     = require('../database/category-coll');
const objectID          = require('mongoose').Types.ObjectId;
const BaseModel = require('./intalize/base_model');

class Model extends BaseModel {

    constructor() {
        super(require('../database/category-coll'))
    }

    insert({ title, description, parent }) {
        const that = this;
        console.log({ title, description, parent })
        return new Promise(async resolve => {
            try {
                const slug = utils.convertToSlug(title);
                let isExistSlug ;
                if(parent){
                    isExistSlug = await CATEGORY_COLL.findOne({
                        slug: slug, parent
                    });
                }else{
                    isExistSlug = await CATEGORY_COLL.findOne({
                        slug: slug
                    });
                }
               
                if (isExistSlug) 
                    return resolve({ error: true, message: 'category_exist' });
                parent ? parent = parent : parent = null;
                const infoCategory = await that.insertData({
                    title, slug, description, parent
                });
                return resolve({ error: false, data: infoCategory });
            } catch (error) {
                console.log({error})
                return resolve({ error: true, message: "cannot_insert_catagory" });
            }
        })
    }
    getInfoOverview({ conditionObj, conditionMatchKey }){
        return new Promise(async resolve => {
            try {
                let infoOverview = await CATEGORY_COLL.aggregate([
                    conditionMatchKey.searchX,
                    { 
                        $facet: {
                            categoryAmount: [
                                {
                                    $match: {
                                        ...conditionObj
                                    }
                                },
                                { $count: 'categoryAmount' }
                            ],
                            newCategoryAmount: [
                                { 
                                    $match: { 
                                        ...conditionObj,
                                        createAt: {
                                            $gt: new Date(Date.now() - 24*60*60 *1000)
                                        }
                                    }
                                }, 
                                { 
                                    $count: 'newCategoryAmount'
                                }
                            ],
                            categoryAmountBlocked: [
                                { 
                                    $match: { 
                                        ...conditionObj,
                                        status: 0
                                    }
                                }, 
                                { 
                                    $count: 'categoryAmountBlocked'
                                }
                            ],
                            categoryAmountActive: [
                                { 
                                    $match: { 
                                        ...conditionObj,
                                        status: 1
                                    }
                                }, 
                                { 
                                    $count: 'categoryAmountActive'
                                }
                            ]
                        }
                    }
                ])
                let { categoryAmount, newCategoryAmount, categoryAmountBlocked, categoryAmountActive } = infoOverview[0];
                if(!infoOverview[0])
                    return resolve({ error: true, message: 'cannot_get_info' });
                return resolve({ error: false, data: {
                    categoryAmount        : categoryAmount && categoryAmount.length > 0 ? categoryAmount[0].categoryAmount : 0,
                    newCategoryAmount     : newCategoryAmount && newCategoryAmount.length > 0 ? newCategoryAmount[0].newCategoryAmount : 0,
                    categoryAmountBlocked : categoryAmountBlocked && categoryAmountBlocked.length > 0 ? categoryAmountBlocked[0].categoryAmountBlocked : 0 ,
                    categoryAmountActive  : categoryAmountActive && categoryAmountActive.length > 0 ? categoryAmountActive[0].categoryAmountActive : 0
                }})
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }    
    getListForAdmin({ pageCurrent, key, status, amountItemShow}){
        return new Promise(async resolve => {
            let conditionObj = {}, conditionMatchKey = {};
                let page            = Number(pageCurrent) || 1;
                let perPage         = Number(amountItemShow) || 25;
            if(key && key.length > 0){
                conditionMatchKey.searchX = {
                    $match: { 
                        $text: { $search: key }
                    },
                },
                conditionMatchKey.sortScore = {
                    $sort: { score: { $meta: "textScore" } } 
                }
            }else{
                conditionMatchKey.searchX = {
                    $match: {}
                }
                conditionMatchKey.sortScore = {
                    $sort: { createAt: -1 } 
                }
            }

            if(status == 1 || status == 0){
                conditionObj.status = Number(status);
            }
            let categories = await CATEGORY_COLL.aggregate([
                conditionMatchKey.searchX,
                {
                    $facet: {
                        _amount: [
                            { 
                                $match: conditionObj
                            },
                            {
                                $count: '_amount'
                            }
                        ],
                        _categories: [
                            { $match: conditionObj },
                            conditionMatchKey.sortScore,
                            {
                                $skip: (perPage * page) - perPage
                            }, 
                            {    
                                $limit: perPage
                            }, 
                        ]
                    }
                }
            ])
            let { _amount, _categories } = categories[0];
            let amount       = _amount && _amount.length > 0 ? _amount[0]._amount : 0;
            let categoryTemp = _categories && _categories.length > 0 ? _categories : [];
            if(!_categories || Number.isNaN(Number(amount)))
                return resolve({ error: true, message: 'cannot_get_list' });
            return resolve({ error: false, data: {
                amount     : amount,
                categories : categoryTemp,
                current    : page,
                perPage,
                pages      : Math.ceil(amount / perPage),
                //du lieu tim kiem overview
                conditionObj,
                conditionMatchKey,
            }})
            
        })
    }
    getAllCategory() {
        return new Promise(async resolve => {
            try {
                const listCategories = await CATEGORY_COLL.find({});
                if (!listCategories) return resolve({ error: true, message: 'cannot_get_list' });
                return resolve({
                    error: false,
                    data: listCategories
                });
            } catch (error) {
                return reject({
                    error: true,
                    message: "get_all_category_failed"
                });
            }
        })
    }

    getAllCategoryByStatus({ status }) {
        return new Promise(async resolve => {
            try {
                if (isNaN(status)) 
                    return resolve({ error: true, message: 'param_not_valid' });
                const listCategories = await CATEGORY_COLL.find({
                    status: status
                })
                .populate('parent')
                .sort({ createAt: -1 });
                if (!listCategories) return resolve({ error: true, message: 'cannot_get_list' });
                return resolve({
                    error: false,
                    data: listCategories
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: "not_found_category"
                })
            }
        })
    }
  
    getAllCategoryExcept_id({ _id }){
        return new Promise(async resolve => {
            try {
                if(!objectID.isValid(_id))
                    return resolve({ error: true, message: 'params_not_ivalid' });
                const listCategories = await CATEGORY_COLL.find({
                    status: 1,
                    _id: { $ne : _id },
                })
                .populate('parent')
                .sort({ createAt: -1 });
                if (!listCategories) return resolve({ error: true, message: 'cannot_get_list' });
                return resolve({ error: false, data: listCategories });
            } catch (error) {
                return resolve({ error: true, message: "cannot_get_list" });
            }
        })
    }

    getCategoryBySlug({ categorySlug }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                
                let infoCategory = await CATEGORY_COLL.findOne({
                    slug: categorySlug
                })
                
                if (!infoCategory) return resolve({
                    error: true,
                    message: "slug_category_not_exist"
                });
                return resolve({
                    error: false,
                    data: infoCategory
                })
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.messages
                })
            }
        })
    }

    updateImage({ categoryID, imagePath }) {
        const that = this;
        return new Promise(async (resolve) => {
           const infoCagegoryUpdated = await that.updateById(categoryID, {
                image: imagePath, modifyAt: Date.now()
           }, { new: true });
           if (!infoCagegoryUpdated) return resolve({ error: true, message: 'cannot_update' });

           return resolve({
               error: false,
               message: 'update_success'
           });
        })  
    }

    //update info
    updateInfoCategory({ cateID, categorySlug, title, description, parent }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                const check_exist = await that.countDataWhere({
                    slug: categorySlug,
                });
                if (!check_exist) return resolve({
                    error: true,
                    message: "slug_category_not_exist_or_slug_new_exist"
                })
                const UPDATE_INFO = await CATEGORY_COLL.findOneAndUpdate({ _id : cateID, slug: categorySlug }, {
                    title, description, parent
                });
                if(!UPDATE_INFO){
                    return resolve({
                        error: true,
                        message: 'cant_update_this_category'
                    })
                }
                return resolve({
                    error: false,
                    message: "update_description_success"
                })
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    updateStatusCategory({ categorySlug, status }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                if (isNaN(status)) 
                    return resolve({ error: true, message: 'param_not_valid' });
                const infoCategoryUpdated = await CATEGORY_COLL.findOneAndUpdate({ slug: categorySlug }, {
                    status: Number(status), modifyAt: Date.now()
                }, { new: true });
                if (!infoCategoryUpdated) 
                    return resolve({ error: true, message: 'update_failed'});
                return resolve({ error: false, message: "update_success" });
            } catch (error) {
                return resolve({ error: true, message: "update_failed" });
            }
        })
    }
    getList() {
        return new Promise(async resolve => {
            try {
                let listCategories = await CATEGORY_COLL.find({});
                if (!listCategories) return resolve({ error: true, message: 'cannot_get_list' });

                return resolve({ error: false, data: listCategories });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateListCategory({ arrCategoryID, status }) {
        return new Promise(async resolve => {
            try {
                let signalAfterUpdate = await CATEGORY_COLL.updateMany({ 
                    _id: { $in: arrCategoryID.map( categoryID => objectID(categoryID)) }
                }, { 
                    status, 
                    modifyAt: Date.now() 
                }, { new: true });
                if(!signalAfterUpdate)
                    return resolve({ error: true, message: 'cannot_update' });
                return resolve({ error: false, message: 'update_success' })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model();