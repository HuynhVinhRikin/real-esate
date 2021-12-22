"use strict";

const utils         = require('../utils/utils');
const CONTACT_COLL      = require('../database/contact-coll');
const BaseModel     = require('./intalize/base_model');
const objectID      = require('mongoose').Types.ObjectId;
class Model extends BaseModel {

    constructor() {
        super(require('../database/contact-coll'))
    }

    insert({ companyType, name, phone, email, companyName }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let isExistSlug = await CONTACT_COLL.findOne({ companyType, name, companyName });
                if (isExistSlug) return resolve({ error: true, message: 'slug_existenced' });
                
                const infoTagInserted = await that.insertData({
                    companyType, name, phone, email, companyName
                })
                if (!infoTagInserted)
                    return resolve({ error: true,  message: "cannot_inserted" })
                
                return resolve({  error: false,  data: infoTagInserted });
            } catch (error) {
                return resolve({  error: true, message: error.message });
            }
        })
    }
    
    // updateStatusTag({ slug, status}) {
    //     return new Promise(async resolve => {
    //         try {
    //             const infoTagUpdated = await TAG_COLL.findOneAndUpdate({ slug: slug }, {
    //                 status: Number(status), modifyAt: Date.now()
    //             }, { new: true });
    //             if (!infoTagUpdated) return resolve({ error: true, message: 'cannot_update_tags' });
    //             return resolve({ error: false, message: 'update_status_tag_success'  });
    //         } catch (error) {
    //             return resolve({  error: true, message: error.message });
    //         }
    //     });
    // }

    // getInfoOverview({ conditionObj, conditionMatchKey }){
    //     return new Promise(async resolve => {
    //         try {
    //             let infoOverview = await TAG_COLL.aggregate([
    //                 conditionMatchKey.searchX,
    //                 {
    //                     $facet: {
    //                         taggingAmount: [
    //                             {
    //                                 $match: {
    //                                     ...conditionObj
    //                                 }
    //                             },
    //                             {
    //                                 $count: 'taggingAmount'
    //                             }
    //                         ],
    //                         newTaggingAmount: [
    //                             {
    //                                 $match: { 
    //                                     ...conditionObj,
    //                                     createAt: { 
    //                                         $gt: new Date(Date.now() - 24*60*60 *1000) 
    //                                     }
    //                                 }
    //                             },
    //                             {
    //                                 $count: 'newTaggingAmount'
    //                             }
    //                         ],
    //                         taggingAmountBlocked: [
    //                             {
    //                                 $match: {
    //                                     ...conditionObj,
    //                                     status: 0
    //                                 }
    //                             },
    //                             {
    //                                 $count: 'taggingAmountBlocked'
    //                             }
    //                         ],
    //                         taggingAmountActive: [
    //                             {
    //                                 $match: { 
    //                                     ...conditionObj,
    //                                     status: 1
    //                                 }
    //                             },
    //                             {
    //                                 $count: 'taggingAmountActive'
    //                             }
    //                         ]
    //                     }
    //                 }
    //             ])

    //             if(!infoOverview)
    //                 return resolve({ error: true, message: "cannot_get_list" });
    //             let { taggingAmount, newTaggingAmount, taggingAmountBlocked, taggingAmountActive } = infoOverview[0];
    //             return resolve({ error: false, data: {
    //                 taggingAmount       : taggingAmount        && taggingAmount.length        > 0 ? taggingAmount[0].taggingAmount : 0,
    //                 newTaggingAmount    : newTaggingAmount     && newTaggingAmount.length     > 0 ? newTaggingAmount[0].newTaggingAmount : 0,
    //                 taggingAmountBlocked: taggingAmountBlocked && taggingAmountBlocked.length > 0 ? taggingAmountBlocked[0].taggingAmountBlocked : 0,
    //                 taggingAmountActive : taggingAmountActive  && taggingAmountActive.length  > 0 ? taggingAmountActive[0].taggingAmountActive : 0,
    //             }})
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }
    
    // getListForAdmin({ pageCurrent, key, status, amountItemShow }){
    //     return new Promise(async resolve => {
    //         let conditionObj = {}, conditionMatchKey = {};
    //             let page            = Number(pageCurrent) || 1;
    //             let perPage         = Number(amountItemShow) || 25;
    //         if(key && key.length > 0){
    //             conditionMatchKey.searchX = {
    //                 $match: { 
    //                     $text: { $search: key }
    //                 },
    //             },
    //             conditionMatchKey.sortScore = {
    //                 $sort: { score: { $meta: "textScore" } } 
    //             }
    //         }else{
    //             conditionMatchKey.searchX = {
    //                 $match: {}
    //             }
    //             conditionMatchKey.sortScore = {
    //                 $sort: { createAt: -1 } 
    //             }
    //         }

    //         if(status == 1 || status == 0){
    //             conditionObj.status = Number(status);
    //         }
    //         let tagging = await TAG_COLL.aggregate([
    //             conditionMatchKey.searchX,
    //             {
    //                 $facet: {
    //                     _amount: [
    //                         { 
    //                             $match: conditionObj
    //                         },
    //                         {
    //                             $count: '_amount'
    //                         }
    //                     ],
    //                     _tagging: [
    //                         { $match: conditionObj },
    //                         conditionMatchKey.sortScore,
    //                         {
    //                             $skip: (perPage * page) - perPage
    //                         }, 
    //                         {    
    //                             $limit: perPage
    //                         },
    //                     ]
    //                 }
    //             }
    //         ])
    //         let { _amount, _tagging } = tagging[0];
    //         let amount       = _amount && _amount.length > 0 ? _amount[0]._amount : 0;
    //         let taggingTemp = _tagging && _tagging.length > 0 ? _tagging : [];
    //         if(!_tagging || Number.isNaN(Number(amount)))
    //             return resolve({ error: true, message: 'cannot_get_list' });
    //         return resolve({ error: false, data: {
    //             amount : amount,
    //             tagging: taggingTemp,
    //             current: page,
    //             perPage,
    //             pages  : Math.ceil(amount / perPage),
    //             // du lieu de tim kiem overview
    //             conditionObj,
    //             conditionMatchKey
    //         }})
            
    //     })
    // }

    getAll() {
        return new Promise(async resolve => {
            try {
                let listTags = await CONTACT_COLL.find({ });
                if (!listTags) return resolve({ error: true, message: 'cannot_get_list_tags' });
                return resolve({ error: false, data: listTags });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        });
    }

    // getAllTagsByStatus({ status }) {
    //     return new Promise(async resolve => {
    //         try {
    //             if (isNaN(status)) 
    //                 return resolve({ error: true, message: 'param_not_valid' });
    //             let listTags = await TAG_COLL.find({ status });

    //             if (!listTags) 
    //                 return resolve({ error: true, message: 'cannot_get_list' });

    //             return resolve({ error: false, data: listTags })

    //         } catch (error) {
    //             return resolve({
    //                 error: true,
    //                 message: error.message
    //             })
    //         }
    //     })
    // }

    // updateInfoTags({ slug, title, description }) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let infoAfterUpdated = await TAG_COLL.findOneAndUpdate({ slug }, {
    //                 title, description, modifyAt: Date.now()
    //             }, { new: true });
    //             if (!infoAfterUpdated) 
    //                 return resolve({ error: true, message: 'cannot_update_info_tag' });

    //             return resolve({ error: false, data: infoAfterUpdated })
    //         } catch (error) {
    //             return resolve({
    //                 error: true,
    //                 message: error.message
    //             })
    //         }

    //     })
    // }

    // updateImage({ tagID, imagePath }) {
    //     return new Promise(async (resolve) => {
    //        const infoAfterUpdated = await TAG_COLL.findByIdAndUpdate(tagID, {
    //            image: imagePath, modifyAt: Date.now()
    //        }, { new: true });
    //        if (!infoAfterUpdated) return resolve({ error: true, message: 'cannot_update_path_image' });

    //        return resolve({
    //            error: false,
    //            data: infoAfterUpdated
    //        });
    //     })  
    // }

    // getTagsbySlug({ slug }) {
    //     return new Promise(async resolve => {
    //         try {
    //             const infoTag = await TAG_COLL.findOne({ slug });
    //             if (!infoTag) return resolve({
    //                 error: true,
    //                 message: "title_tags_not_exist"
    //             });
    //             return resolve({
    //                 error: false,
    //                 data: infoTag
    //             })
    //         } catch (error) {
    //             return resolve({
    //                 error: true,
    //                 message: error.message
    //             })
    //         }
    //     });
    // }

    // getList() {
    //     return new Promise(async resolve => {
    //         try {
    //             let listTags = await TAG_COLL.find({});
    //             if (!listTags) return resolve({ error: true, message: 'cannot_get_list' });

    //             return resolve({ error: false, data: listTags });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }
    // updateListTagging({ arrTaggingID, status }) {
    //     return new Promise(async resolve => {
    //         try {
    //             let signalAfterUpdate = await TAG_COLL.updateMany({ 
    //                 _id: { $in: arrTaggingID.map( taggingID => objectID(taggingID)) }
    //             }, { 
    //                 status, 
    //                 modifyAt: Date.now() 
    //             }, { new: true });
    //             if(!signalAfterUpdate)
    //                 return resolve({ error: true, message: 'cannot_update' });
    //             return resolve({ error: false, message: 'update_success' })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }
}

exports.MODEL = new Model();