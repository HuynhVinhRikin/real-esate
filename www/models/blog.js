"use strict";

const ObjectID          = require('mongoose').Types.ObjectId;
const BLOG_COLL         = require('../database/blog-coll');
const TAGS_COLL         = require('../database/tags-coll');
const Category          = require('../models/category');
const CATEGORY_COLL     = require('../database/category-coll');
const BaseModel         = require('./intalize/base_model');
const utils             = require('../utils/utils');
const OBJECT_ID         = require('mongoose').Types.ObjectId;
const moment            = require('moment');
const { categorys_blog_HOME_PAGE, categorys_for_query_BLOG_INDEX } = require('../config/cf_constants');
class Model extends BaseModel {

    constructor() {
        super(require('../database/blog-coll'))
    }

    insert({ title, content, description, tagsID, categoryID, status, isFeature, author, 
        yoastTitle, yoastDescription, yoastFocus, image, authorOrigin, lang }) {
        const that = this;
        return new Promise(async resolve => {

            try {
                if (!ObjectID.isValid(categoryID) || !Array.isArray(tagsID))
                    return resolve({ error: true, message: 'param_not_valid' });
                let CONVERT_SLUG = utils.convertToSlug(title);
                let isExistSlug  = await BLOG_COLL.findOne({ slug: CONVERT_SLUG });
                if (isExistSlug)
                    CONVERT_SLUG += "-" + Math.floor(Math.random()*(999-100+1)+100);
                
                let infoBlogAfterInserted = await that.insertData({
                    slug: CONVERT_SLUG, title, content, description, category: categoryID, author, authorOrigin,
                    yoastTitle, yoastDescription, yoastFocus, status, isFeature, tags: tagsID, image, lang
                });
                if (!infoBlogAfterInserted) return resolve({
                    error: true,
                    message: 'cannot_insert_data'
                });
                return resolve({ error: false,  data: infoBlogAfterInserted })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    updateInfoBlog({ blogSlug, title, content, description, status, isFeature, tagsID, categoryID,
        yoastTitle, yoastDescription, yoastFocus, image, slug, author, authorOrigin, lang
     }) {
        return new Promise(async resolve => {
           try {
               if (!ObjectID.isValid(categoryID) || !Array.isArray(tagsID))  
                    return resolve({ error: true, message: 'param_not_valid' });
               let infoAfterUpdated = await BLOG_COLL.findOneAndUpdate({ slug: blogSlug }, {
                    title, content, description, status, isFeature, tags: tagsID, category: categoryID, modifyAt: Date.now(),
                    yoastTitle, yoastDescription, yoastFocus, image, slug, author, authorOrigin, lang
               }, { new: true });
               if (!infoAfterUpdated) return resolve({ error: true, message: 'cannot_update_info_blog' });
               return resolve({ error: false, data: infoAfterUpdated })
           } catch (error) {
               return resolve({ error: true, message: error.message });
           }
        })
    }

    updateViewBlog({ blogSlug }) {
        return new Promise(async resolve => {
            try {
                let infoAfterUpdated = await BLOG_COLL.findOneAndUpdate({ slug: blogSlug }, {
                    $inc: {
                        amountView: 1
                    }, modifyAt: Date.now()
                }, { new: true });
                if (!infoAfterUpdated) return resolve({ error: true, message: 'cannot_update_view' });

                return resolve({ error: false, data: infoAfterUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateStatusBlog({ blogSlug, status }) {
        return new Promise(async resolve => {
            try {
                let infoAfterUpdated = await BLOG_COLL.findOneAndUpdate({ slug: blogSlug }, {
                    status
                }, { new: true });
                if (!infoAfterUpdated) 
                    return resolve({ error: true, message: 'cannot_update_status' });
                return resolve({ error: false, data: infoAfterUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfoOverview({ conditionObj, conditionMatchKey }){
        return new Promise(async resolve => {
            try {
                let infoOverview = await BLOG_COLL.aggregate([
                    conditionMatchKey.searchX,
                    { 
                        $facet: {
                            _allBlogAmount:[
                                {
                                    $match: {
                                        ...conditionObj
                                    }
                                },
                                { $count: "_allBlogAmount" },
                            ],
                            _allBlogAmountLastest24hPosted: [
                                { 
                                    $match: {
                                        ...conditionObj,
                                        createAt: {
                                            $gt: new Date(Date.now() - 24*60*60 *1000)
                                        }
                                    }                               
                                },
                                {
                                    $count: "_allBlogAmountLastest24hPosted"
                                }
                            ], 
                            _allBlogAmountBlocked: [
                                { 
                                    $match: {
                                        ...conditionObj,
                                        status: 0
                                    }
                                },
                                {
                                    $count: "_allBlogAmountBlocked" 
                                }
                            ],
                            _allBlogAmountActive: [
                                { 
                                    $match: {
                                        ...conditionObj,
                                        status: 1
                                    }
                                },
                                {
                                    $count: "_allBlogAmountActive" 
                                },
                            ], 
                        } 
                    },
                ])

                if (!infoOverview)
                    return resolve({ error: true, message: 'cannot_get_info' });
                const { _allBlogAmount, _allBlogAmountLastest24hPosted, 
                    _allBlogAmountBlocked, _allBlogAmountActive } = infoOverview[0];
                return resolve({ error: false , data: {
                    _allBlogAmount: _allBlogAmount[0],
                    _allBlogAmountLastest24hPosted: _allBlogAmountLastest24hPosted[0], 
                    _allBlogAmountBlocked: _allBlogAmountBlocked[0], 
                    _allBlogAmountActive: _allBlogAmountActive[0]
                }});
                
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getAllPost() {
        return new Promise(async resolve => {
            try {
                let listBlogs = await BLOG_COLL.find({})
                    .populate('tags')
                    .populate('category')
                    .populate('author');
                if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list' });
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
            }
        })
    }
    
    getListForAdmin({ pageCurrent, key, starttime, endtime, category, tag, author, sortView, status, amountItemShow } ){
        return new Promise(async resolve => {
            try {
                let sort = {}, // Khởi tạo object Sort nếu cần sort
                conditionObj = {},  // khởi tạo obj điều kiện
                conditionMatchKey = {}; // khởi tạo obj cho KEY (từ khoá TEXT_SEARCH)
                let page    = Number(pageCurrent) || 1; // trang hiện tại
                let perPage = Number(amountItemShow) || 25; // số item hiển thị trên trang
                /**
                 * SORT: phần client gửi có 2 trường hợp, trường createAt có thể thay thế bằng amountView (sortView=-amountView)
                 * sortView=-createAt (1*)
                 * sortView=createAt  (2*)
                 * sẽ chuyển thành
                 * (1*) sortView:-1
                 * (2*) sortView: 1
                 */
                if (sortView) {
                    let obj;
                    if (sortView.includes('-')) {
                        obj = sortView.substring(1, sortView.length);
                        sort[obj] = -1;
                    } else {
                        obj = sortView
                        sort[obj] = 1;
                    }
                } else {
                    // nếu client ko có sort => mặt định là createAt: -1
                    sort = { createAt: -1 };
                }
                /**
                 * SEARCH WITH KEY
                 * phần fulltextSearch, và có textScore để sắp xếp điểm fullTextSearch giảm dần (đúng nhất nằm trên)
                 */
                if (key && key.length > 0) 
                {
                    conditionMatchKey.searchX = {
                        $match: { 
                            $text: { $search: key }
                        },
                    };
                    conditionMatchKey.sortScore = {
                        $sort: { score: { $meta: "textScore" } } 
                    };
                } else {
                    conditionMatchKey.searchX = {
                        $match: {}
                    };
                    conditionMatchKey.sortScore = { 
                        $sort: sort 
                    };
                };
                /**
                 * conditionObj
                 * Obj chứa tập hợp các điều kiện
                 */
                // Lấy record trong khoảng thời gian từ starttime -> endtime 
                if (starttime && endtime) {
                    conditionObj.createAt = { 
                        $gte: new Date(starttime), 
                        $lte: moment(endtime, 'MM-DD-YYYY').endOf('day')._d
                    };
                }
                // Tìm kiếm theo categoryID của blog
                if(OBJECT_ID.isValid(category)){
                    conditionObj.category = ObjectID(category);
                }

                if(OBJECT_ID.isValid(tag)){
                    conditionObj.tags = { $in: [ObjectID(tag)]}
                }
                // tìm kiếm theo tác giả
                if(OBJECT_ID.isValid(author)){
                    conditionObj.author = ObjectID(author);
                }

                if(status == 1 || status == 0){
                    conditionObj.status = Number(status);
                }
                //get list blog theo dieu kien
                
                let listBlogs = await BLOG_COLL.aggregate([
                    conditionMatchKey.searchX,
                    {
                        $facet: {
                            _blogAmount: [
                                {
                                    $match: conditionObj
                                },
                                {
                                    $count: '_blogAmount'
                                }
                            ],
                            _blogs: [
                                {
                                    $match: conditionObj
                                },
                                {
                                    $lookup: {
                                        from: 'categories',
                                        localField: 'category',
                                        foreignField: '_id',
                                        as: 'category'
                                    }  
                                },
                                {
                                    $unwind: {
                                        path: '$category',
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $lookup: {
                                        from: 'admins',
                                        localField: 'author',
                                        foreignField: '_id',
                                        as: 'author'
                                    } 
                                },
                                {
                                    $unwind: {
                                        path: '$author',
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                // sortScore phải đặt trước skip và limit
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
                ]);

                if (!listBlogs) 
                    return resolve({ error: true, message: 'cannot_get_list_blog' });
                let infoListBLogs =  listBlogs[0];
                const { _blogAmount, _blogs } = infoListBLogs;
                let amount = _blogAmount.length > 0 && _blogAmount[0]._blogAmount;

                if (!_blogs || Number.isNaN(Number(amount))) return resolve({ error: true, message: 'cannot_get_info' });

                return resolve({ error: false, data: {
                    blogs  : _blogs,
                    current: page,
                    pages  : Math.ceil(amount / perPage),
                    amount,
                    perPage,
                    //du lieu de tim kiem overview
                    conditionObj,
                    conditionMatchKey
                }});
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    getAllPostWithStatus({ status }) {
        return new Promise(async resolve => {
            try {
                if (Number.isNaN(Number(status)))
                    return resolve({ error: true, message: 'param_not_valid' });
                let listBlogs = await BLOG_COLL.find({ status })
                    .populate('tags')
                    .populate('category')
                    .populate('author');
                if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list' });
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getAllPostWithTag({ pageCurrent, tagSlug, item }) {
        return new Promise(async resolve => {
            try {
                let page    = Number(pageCurrent) || 1; // trang hiện tại
                let perPage = Number(item) || 10 ; // số item hiển thị trên trang
                let isExistTag = await TAGS_COLL.findOne({ slug: tagSlug });
                if (!isExistTag) return resolve({ error: true, message: 'tag_not_exist' });
                let listBlogs = await BLOG_COLL.find({
                    tags: {
                        $in: [ObjectID(isExistTag._id)]
                    }, status: 1
                }).populate('tags')
                .populate('category')
                .populate('author')
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .sort({ amountView: -1 });

                if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list_post' });
                let amount  = await BLOG_COLL.count({
                    tags: {
                        $in: [ObjectID(isExistTag._id)]
                    }, status: 1
                 })

                return resolve({ error: false, data: { 
                    listBlogs, infoTag: isExistTag,
                    current: page,
                    pages  : Math.ceil(amount / perPage),
                } });
            } catch (error) { 
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getAllPostWithCategory({ categorySlug, lang }) {
        return new Promise(async resolve => {
            try {
                let isExistCategory = await CATEGORY_COLL.findOne({ slug: categorySlug });
                if (!isExistCategory)return resolve({ error: true, message: 'category_not_exist' });
                let listBlogs;
                if(!lang){
                    listBlogs = await BLOG_COLL.find({
                        category: isExistCategory._id, status: 1
                    }).populate('author')
                    .populate('tags')
                    .populate('category')
                    .sort({ createAt: -1 });
                    // .sort({ amountView: -1 });
                }else{
                    listBlogs = await BLOG_COLL.find({
                        category: isExistCategory._id, status: 1, lang
                    }).populate('author')
                    .populate('tags')
                    .populate('category')
                    .sort({ createAt: -1 });
                    // .sort({ amountView: -1 });
                }
                if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list_blog' });
                if(listBlogs.length == 0){
                    listBlogs = [];
                    let idCate = isExistCategory._id;
                    let listCateChil  = await CATEGORY_COLL.find({parent : idCate}).select("_id");
                    for(const i  of listCateChil){
                      let  _listBlogs = await BLOG_COLL.find({
                            category: i._id, status: 1, lang
                        }).populate('author')
                        .populate('tags')
                        .populate('category')
                        .sort({ createAt: -1 });
                        // .sort({ amountView: -1 });

                        if(_listBlogs){
                            listBlogs.push(_listBlogs);
                        }
                    }
                 
                }
                return resolve({ error: false, data: { listBlogs, infoCategory: isExistCategory } });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    getAllPostWithCategoryID({ categoryID, lang, page }) {
        return new Promise(async resolve => {
            try {
                let perPage = 1;
                page = Number(page)
                if(!page){
                    page = 1;
                }
                let isExistCategory = await CATEGORY_COLL.findOne({ _id: categoryID });
                if (!isExistCategory)return resolve({ error: true, message: 'category_not_exist' });
                let listBlogs;
                if(!lang){
                    listBlogs = await BLOG_COLL.find({
                        category: isExistCategory._id, status: 1
                    }).populate('author')
                    .populate('tags')
                    .populate('category').sort({ amountView: -1 }).skip((page * perPage) - perPage)
                    .limit(perPage);
                }else{
                    listBlogs = await BLOG_COLL.find({
                        category: isExistCategory._id, status: 1, lang
                    }).populate('author')
                    .populate('tags')
                    .populate('category').sort({ amountView: -1 }).skip((page * perPage) - perPage)
                    .limit(perPage);
                }

                if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list_blog' });
                if(listBlogs.length == 0){
                    listBlogs = [];
                    let idCate = isExistCategory._id;
                    let listCateChil  = await CATEGORY_COLL.find({parent : idCate}).select("_id");
                    for(const i  of listCateChil){
                      let  _listBlogs = await BLOG_COLL.find({
                            category: i, status: 1, lang
                        }).populate('author')
                        .populate('tags')
                        .populate('category').sort({ amountView: -1 }).skip((page * perPage) - perPage)
                        .limit(perPage);

                        if(_listBlogs){
                            listBlogs = listBlogs.concat(_listBlogs);
                        }
                    }
                }
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }
    getAllPostWithCategoryAndParentID({ categorySlug, parent, lang }) {
        return new Promise(async resolve => {
            try {
                let isExistCategory = await CATEGORY_COLL.findOne({ slug: categorySlug, parent });
                if (!isExistCategory)return resolve({ error: true, message: 'category_not_exist' });
                let listBlogs;
                if(lang){
                    listBlogs = await BLOG_COLL.find({
                        category: isExistCategory._id, status: 1, lang
                    }).populate('author')
                    .populate('tags')
                    .populate('category').sort({ amountView: -1 });
                }else{
                    listBlogs = await BLOG_COLL.find({
                        category: isExistCategory._id, status: 1
                    }).populate('author')
                    .populate('tags')
                    .populate('category').sort({ amountView: -1 });
                }
                if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list_blog' });

                return resolve({ error: false, data: { listBlogs, infoCategory: isExistCategory } });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }
    /**
     * NOT CHECK => NOT CONVERT
     */
    // GET POST OF HOMEPAGE WITH PAGING
    getPostWithPagingHomePage(pageCurrent) {
        const that = this;
        const perPage = 4;
        return new Promise(async (resolve, reject) => {
            try {
               const listProduct = await BLOG_COLL.find({
                   status: 1
               }).populate('category')
               .skip((perPage*pageCurrent)-perPage)
               .limit(perPage)
               .sort({amountView: -1}).exec();

               const countProduct = await that.countDataWhere({ status: 1 });

               if (!listProduct || !countProduct) return resolve({
                   error: true,
                   message: 'cannot_get_list_post_with_paging'
               });
               return resolve({
                    error: false,
                    data: {
                        listProduct: listProduct,
                        pageCurrent: pageCurrent,
                    }
               })

            } catch (error) {
                return reject({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    getPostWithPagingCategory(pageCurrent, categoryID, lang) {
        const that = this;
        const perPage = 4;
        return new Promise(async (resolve, reject) => {
            try {
                let objectS = {
                    status: 1,
                    category: categoryID,
                }
                if(lang){
                    objectS.lang =  lang;
                }
               const listProduct = await BLOG_COLL.find(objectS).populate('category')
               .populate({ path : 'author',  select : '_id name fullname image'})
               .skip((perPage*pageCurrent)-perPage)
               .limit(perPage)
               .sort({amountView: -1}).exec();
               const countProduct = await that.countDataWhere({ status: 1 });

               if (!listProduct || !countProduct) return resolve({
                   error: true,
                   message: 'cannot_get_list_post_with_paging'
               });
               return resolve({
                    error: false,
                    data: {
                        listProduct: listProduct,
                        pageCurrent: pageCurrent,
                    }
               })

            } catch (error) {
                return reject({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    // GET POST OF TAGS WITH PAGING
    getPostWithPagingTags(pageCurrent, tagID) {
        const that = this;
        const perPage = 4;
        return new Promise(async (resolve, reject) => {
            try {
               const listProduct = await BLOG_COLL.find({
                   status: 1,
                   tags: {
                       $in: tagID
                   }
               }).populate('category').populate('author')
               .skip((perPage*pageCurrent)-perPage)
               .limit(perPage)
               .sort({amountView: -1}).exec();
               const countProduct = await that.countDataWhere({ status: 1 });

               if (!listProduct || !countProduct) return resolve({
                   error: true,
                   message: 'cannot_get_list_post_with_paging'
               });
               return resolve({
                    error: false,
                    data: {
                        listProduct: listProduct,
                        pageCurrent: pageCurrent,
                    }
               })

            } catch (error) {
                return reject({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    getAllPostWithAuthor(author) {
        const that = this;
        return new Promise(async (resolve, reject) => {
            try {
                const GET_DATA = await that.getDataWhere({
                    author: author,
                    status: 1
                }, that.FIND_MANY());
                return resolve({
                    error: false,
                    data: GET_DATA
                })
            } catch (error) {
                return reject({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    getListPost() {
        const that = this;
        return new Promise(async resolve => {
            try {
                const list = await BLOG_COLL.find({
                    status: 1
                })
                    .populate('author')
                    .populate('tags')
                    .populate('category');
                if(!list) return resolve({
                    error: true,
                    message: 'cannot_get_list'
                });
                return resolve({
                    error: false,
                    data: list
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        });
    }

    getInfoPost(slug) {
        return new Promise(async resolve => {
            try {
               
                const infoPost = await BLOG_COLL.findOne({
                    slug,
                })
                    .populate('category')
                    .populate('author')
					.populate('tags');
                if (!infoPost) return resolve({
                    error: true,
                    message: 'cannot_get_info_post'
                });

                let statusActive = 1;
                const infoPostCheckStatus = await BLOG_COLL.findOne({ slug, status: statusActive });

                if (!infoPostCheckStatus)
                    return resolve({ error: false, message: 'blog_inactive' });

                // UPDATE AMOUNT_VIEW
                let infoPostAfterUpdate = await BLOG_COLL.findByIdAndUpdate(infoPost._id, {
                    $inc: { amountView: 1 }
                }, { new: true });
                return resolve({
                    error: false,
                    data: infoPost,
                    tags: infoPost.tags
                });

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }
    getInfoPostWithParent({slug, parent, lang}) {
        return new Promise(async resolve => {
            try {
                let optionS = {
                    slug, parent
                }
                if(lang){
                    optionS.lang =  lang;
                }
                const infoPost = await BLOG_COLL.findOne(optionS)
                    .populate('category')
                    .populate({ path : 'author',  select : '_id fullname image'})
                    .populate({ path : 'authorOrigin',  select : '_id fullname image'})
					.populate('tags');
                if (!infoPost) return resolve({
                    error: true,
                    message: 'cannot_get_info_post'
                });

                let statusActive = 1;
                const infoPostCheckStatus = await BLOG_COLL.findOne({ slug, status: statusActive });

                if (!infoPostCheckStatus)
                    return resolve({ error: false, message: 'blog_inactive' });

                // UPDATE AMOUNT_VIEW
                let infoPostAfterUpdate = await BLOG_COLL.findByIdAndUpdate(infoPost._id, {
                    $inc: { amountView: 1 }
                }, { new: true });
                return resolve({
                    error: false,
                    data: infoPost,
                    tags: infoPost.tags
                });

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    getInfoPostForAdmin(slug) {
        return new Promise(async resolve => {
            try {
               
                const infoPost = await BLOG_COLL.findOne({
                    slug,
                })
                    .populate('category')
                    .populate('author')
                    .populate('tags');
                if (!infoPost) return resolve({
                    error: true,
                    message: 'cannot_get_info_post'
                });
                return resolve({
                    error: false,
                    data: infoPost,
                    tags: infoPost.tags
                });
                
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                })
            }
        })
    }

    getListPostViewDesc(item) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let listPost = await BLOG_COLL.find({ 
                    status: 1
                }).populate('tags')
                .populate('category')
                .populate('author')
                .sort({ amountView: -1 })
                .limit(item)
                .exec();
                if (!listPost) return resolve({
                    error: true,
                    message: 'cannot_get_list_post'
                });
                return resolve({
                    error: false,
                    data: listPost
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    getListPostLatestCreateDesc(item) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let listPost = await BLOG_COLL.find({ 
                    status: 1
                }).populate('tags')
                .populate('category')
                .populate('author')
                .sort({ createAt: -1 })
                .limit(item)
                .exec();
                if (!listPost) return resolve({
                    error: true,
                    message: 'cannot_get_list_post'
                });
                return resolve({
                    error: false,
                    data: listPost
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    getListPostLatestCreateDescWithCategory({ item, categoryID, pageCurrent }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let page            = Number(pageCurrent) || 1; // trang hiện tại
                let perPage         = Number(item) || 10 ; // số item hiển thị trên trang
                if(!ObjectID.isValid(categoryID))
                    return resolve({ error: true, message:"id_not_is_vaild"});

                let listPost = await BLOG_COLL.find({
                    status: 1,
                    category: categoryID
                }).populate('tags')
                .populate('category')
                .populate('author')
                .sort({ createAt: -1 })
                .skip( (page * perPage) - perPage )
                .limit(perPage)
                .exec();

                if (!listPost) return resolve({
                    error: true,
                    message: 'cannot_get_list_post'
                });

                let amount = await BLOG_COLL.count({ status: 1, category: categoryID });

                return resolve({
                    error: false,
                    data: {
                        listPost,
                        current: page,
                        pages  : Math.ceil(amount / perPage),
                    }
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    getListPostWithCategoryParent({ categoryID }){
        return new Promise(async resolve => {
            try {
                let statusActive = 1;
                let arrChildCategory =  await CATEGORY_COLL.find({ parent: categoryID });
                if (arrChildCategory.length == 0) {
                    return resolve({ error: true, message: 'not_found_child' });
                } else {
                    let resultObject = {};
                    arrChildCategory.forEach(categoryID => {
                        resultObject[categoryID._id] = [
                            {
                                $match: {
                                    category: categoryID._id,
                                    status: statusActive
                                }
                            },
                            {
                                $lookup: {
                                    from: 'categories',
                                    localField: 'category',
                                    foreignField: '_id',
                                    as: 'category'
                                }
                            },
                            {
                                $limit: 9
                            }
                        ]
                    })

                    let listPost = await BLOG_COLL.aggregate([
                        {
                            $facet: resultObject
                        }
                    ])
                    return resolve({ error: false, data: {
                        listPost,
                        arrChildCategory
                    } })
                    
                }

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        }
    )}

    getMostViewItem() {
        return new Promise(async resolve => {
            try {
                let statusActive = 1;

                let listBlogs = await BLOG_COLL.aggregate([
                    { $match: { status: statusActive }},
                    {    
                        $limit: 4
                    }, 
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'category',
                            foreignField: '_id',
                            as: 'category'
                        }
                    }, 
                    {
                        $unwind:  {
                            path: '$category',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'admins',
                            localField: 'author',
                            foreignField: '_id',
                            as: 'author'
                        }  
                    },
                    {
                        $unwind: 
                        {
                            path: '$author',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $sort: {
                            amountView: -1
                        }
                    }
                ]);
                
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }


    getListPostRelativeByCategory(slug_post, item) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let infoPost = await BLOG_COLL.findOne({
                    slug: slug_post,
                    status:1
                })
                if(!infoPost) return resolve({
                    error: true,
                    message: 'slug_category_not_exist'
                })
                let listPost = await BLOG_COLL.find({ 
                    category: infoPost.category,
                    status: 1,

                }).populate('tags')
                .populate('category')
                .populate('author')
                .sort({ createAt: -1 })
                .limit(item)
                .exec();
                if (!listPost) return resolve({
                    error: true,
                    message: 'cannot_get_list_post'
                });
                return resolve({
                    error: false,
                    data: listPost
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }


    getDataRandomNextPreviousPost(item) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let listPost = await BLOG_COLL.aggregate(
                    { $sample: { size: item } }
                 )
                 if (!listPost) return resolve({
                    error: true,
                    message: 'cannot_get_list_post'
                });
                return resolve({
                    error: false,
                    data: listPost
                });
            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    getListBlogWith2Category() {
        return new Promise(async resolve => {
            try {
                // let get2ItemCategory = await CATEGORY_COLL.aggregate(
                //     [
                //         { $sample: { size: 2 } }
                //     ]
                // );
                // if (get2ItemCategory.length <= 1)
                //     return resolve({ error: true, message: 'cannot_get_category' });
                let category1ID = categorys_blog_HOME_PAGE[0].category;
                let category2ID = categorys_blog_HOME_PAGE[1].category;

                let infoCategory1 = await CATEGORY_COLL.findById(category1ID);
                let infoCategory2 = await CATEGORY_COLL.findById(category2ID);
                
                let listBlogs = await BLOG_COLL.aggregate([
                    {
                        $facet: {
                            // TOP 1 CATEGORY
                            _listBlogCategory1: [
                                {
                                    $match: {
                                        category: ObjectID(category1ID)
                                    }
                                },
                                {
                                    $limit: 4
                                },
                                {
                                    $sort: {
                                        createAt: -1
                                    }
                                }
                            ],
                            // TOP 2 CATEGORY
                            _listBlogCategory2: [
                                {
                                    $match: {
                                        category: ObjectID(category2ID)
                                    }
                                },
                                {
                                    $limit: 4
                                },
                                {
                                    $sort: {
                                        createAt: -1
                                    }
                                }
                            ]
                        }
                    }
                ]);
                if (!listBlogs[0]._listBlogCategory1 || !listBlogs[0]._listBlogCategory2)
                    return resolve({ error: true, message: 'cannot_get_list_post' });

                return resolve({ error: false, data: {
                    listBlogs1: listBlogs[0]._listBlogCategory1,
                    listBlogs2: listBlogs[0]._listBlogCategory2,
                    category1: infoCategory1,
                    category2: infoCategory2
                } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        }); 
    }

    getListBlog({ sortBlog, pageCurrent, category, tags, key }) {
        return new Promise(async resolve => {
            try {
                let sort = {}, conditionObj = {}, conditionMatchKey = {};
                let page            = pageCurrent || 1;
                let perPage         = 8;

                if (sortBlog && sortBlog.length > 0) {
                    if (sortBlog.includes('-')) {
                        let obj = sortBlog.substring(1, sortBlog.length)
                        sort = { [obj]: -1 };
                    } else {
                        let obj = sortBlog
                        sort = { [obj]: 1 };
                    }
                }

                if (key && key.length > 0) 
                {
                    conditionMatchKey.searchX = {
                        $match: { 
                            $text: { $search: key }
                        }
                    }
                    conditionMatchKey.sortScore = { $sort: { ...sort, score: { $meta: "textScore" } } };
                } else {
                    sort = { createAt: -1 };
                    conditionMatchKey.searchX = {
                        $match: { }
                    }
                    conditionMatchKey.sortScore = { $sort: { ...sort } };
                }

                if (category) 
                    conditionObj.category = ObjectID(category);

                // tags: abc1231,asd123,aszz121
                if (tags) 
                {
                    let arrayTags = tags.split(','); 
                    let newArrObj = arrayTags.map(tag => ObjectID(tag));
                    conditionObj['tags'] = {
                        $in: newArrObj
                    }
                }

                let listBlogs = await BLOG_COLL.aggregate([
                            conditionMatchKey.searchX,
                            conditionMatchKey.sortScore,
                            {
                                $facet: {
                                    amountBlog: [
                                        {
                                            $match: conditionObj
                                        }, {
                                            $count: 'amount'
                                        }
                                    ],
                                    listBlogWithSearch: [
                                        {
                                            $match: conditionObj
                                        },
                                        {
                                            $lookup: {
                                                from: 'categories',
                                                localField: 'category',
                                                foreignField: '_id',
                                                as: 'category'
                                            }
                                        }, 
                                        {
                                            $unwind:  {
                                                path: '$category',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'admins',
                                                localField: 'author',
                                                foreignField: '_id',
                                                as: 'author'
                                            }
                                        }, 
                                        {
                                            $unwind:  {
                                                path: '$author',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $skip: (perPage * page) - perPage
                                        }, {    
                                            $limit: perPage
                                        }, 
                                        // {
                                        //     $sort: sort
                                        // }
                                    ]
                                }
                            },
                    ]);
                let amountBlog = listBlogs[0].amountBlog[0] ? listBlogs[0].amountBlog[0].amount : 0;
                return resolve({ error: false, data: {
                    blogs: listBlogs[0].listBlogWithSearch,
                    current: page,
                    pages: Math.ceil(amountBlog / perPage)
                }});
                
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    getListBlogWithKeySearchV2({  pageCurrent, key, lang }) {
        return new Promise(async resolve => {
            try {
                let page            = pageCurrent || 1;
                let perPage         = 30;
                let conditionObj = { lang, status : 1 };
                if(key && key.length > 0){
                    let keyword = key.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj = {
                        $or: [
                            { title :  new RegExp(keyword, 'i') },
                            { description:  new RegExp(keyword, 'i') },
                        ]
                    }
                }
                let lisBlog = await BLOG_COLL.find(
                    conditionObj
                )
                .populate({
                path : 'author',
                select: '_id fullname image'
                })
                // .skip((page * perPage) - perPage)
                // .limit(perPage)
                .sort({ createAt: -1 });

                let  allPage = 0;
                let CLisBlog = await BLOG_COLL.count(
                    conditionObj
                );
                allPage= CLisBlog/perPage || 0;

            return resolve({ error: false, data: lisBlog, allPage })
            }catch (error) {
                console.log({error})
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListBlogWithKeySearch({  pageCurrent, key }) {
        return new Promise(async resolve => {
            try {
                console.log({ pageCurrent, key })
                let sort = {}, conditionObj = {}, conditionMatchKey = {};
                let page            = pageCurrent || 1;
                let perPage         = 8;

                conditionObj.status = 1;
                if (key && key.length > 0) 
                {
                    conditionMatchKey.searchX = {
                        $match: { 
                            $text: { $search: key }
                        }
                    }
                    conditionMatchKey.sortScore = { $sort: { score: { $meta: "textScore" } } };
                } else {
                    conditionMatchKey.searchX = {
                        $match: { }
                    }
                    conditionMatchKey.sortScore = { $sort: sort };
                }

                let listBlogs = await BLOG_COLL.aggregate([
                            conditionMatchKey.searchX,
                            conditionMatchKey.sortScore,
                            {
                                $facet: {
                                    amountBlog: [
                                        {
                                            $match: conditionObj
                                        }, {
                                            $count: 'amount'
                                        }
                                    ],
                                    listBlogWithSearch: [
                                        {
                                            $match: conditionObj
                                        },
                                        {
                                            $lookup: {
                                                from: 'categories',
                                                localField: 'category',
                                                foreignField: '_id',
                                                as: 'category'
                                            }
                                        }, 
                                        {
                                            $unwind:  {
                                                path: '$category',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'admins',
                                                localField: 'author',
                                                foreignField: '_id',
                                                as: 'author'
                                            }
                                        }, 
                                        {
                                            $unwind:  {
                                                path: '$author',
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },
                                        {
                                            $skip: (perPage * page) - perPage
                                        }, {    
                                            $limit: perPage
                                        }
                                    ]
                                }
                            },
                    ]);
                let amountBlog = listBlogs[0].amountBlog[0] ? listBlogs[0].amountBlog[0].amount : 0;
                return resolve({ error: false, data: {
                    blogs: listBlogs[0].listBlogWithSearch,
                    current: page,
                    pages: Math.ceil(amountBlog / perPage)
                }});
            } catch (error) {
                console.log({error})
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListBlogRefSameCategoryRandom({ category }) {
        return new Promise(async resolve => {
            try {
                let amountRandom = 4;
                let listBlogs = await BLOG_COLL.aggregate([
                    {
                        $match: {
                            category: ObjectID(category)
                        }
                    },
                    { $sample: { size: amountRandom } }
                ]);
                
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListBlogRefSameCategoryRandom2({ category , amountRandom }) {
        return new Promise(async resolve => {
            try {
                let statusActive = 1;
                let listBlogs = await BLOG_COLL.aggregate([
                    {
                        $match: {
                            category: ObjectID(category),
                            status: statusActive
                        }
                    },
                    { $sample: { size: amountRandom } },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'category',
                            foreignField: '_id',
                            as: 'category'
                        }
                    }, 
                    {
                        $unwind:  {
                            path: '$category',
                            preserveNullAndEmptyArrays: true
                        }
                    }, 
                ]);
                
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListBlogRefSameCategoryRandomWithoutInfo({ amountRandom }) {
        return new Promise(async resolve => {
            try {
                let statusActive = 1;
                let listBlogs = await BLOG_COLL.aggregate([
                    { $match: { status: statusActive } },
                    { $sample: { size: amountRandom } },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'category',
                            foreignField: '_id',
                            as: 'category'
                        }
                    }, 
                    {
                        $unwind:  {
                            path: '$category',
                            preserveNullAndEmptyArrays: true
                        }
                    }, 
                ]);
                
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * 
     * @param {*} tags => [Object] 
     */
    getListBlogRefSameTagsRandom({ tags, blogID }) {
        return new Promise(async resolve => {
            try {
                let listObjID = tags.map(item => ObjectID(item._id));
                let amountRandom = 8;
                let statusActive = 1;
                let listBlogs = await BLOG_COLL.aggregate([
                    {
                        $match: {
                            tags:{
                                $in: [listObjID[0]]
                            },
                            status: statusActive,
                            _id: {
                                $ne: blogID
                            }
                        }
                    },
                    { $sample: { size: amountRandom } }
                ]);
                return resolve({ error: false, data: listBlogs });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    removeListBlogs({ arrBlogsID }) {
        return new Promise(async resolve => {
            try {
                let signalAfterRemove = await BLOG_COLL.remove({
                    _id: {
                        $in: arrBlogsID.map(blogID => ObjectID(blogID))
                    }
                });
                return resolve({ error: false, message: 'remove_success' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateListBlogs({ arrBlogsID, status }) {
        return new Promise(async resolve => {
            try {
                let signalAfterUpdate = await BLOG_COLL.updateMany({
                    _id: {
                        $in: arrBlogsID.map(blogID => ObjectID(blogID))
                    }
                }, {
                    status, modifyAt: Date.now()
                });
                return resolve({ error: false, message: 'update_success' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateIndexSeoBlogs({ blogID, index }) {
        return new Promise(async resolve => {
            try {
                let signalAfterUpdate = await BLOG_COLL.updateOne({
                    _id: ObjectID(blogID)
                }, {
                    seo: Number(index), modifyAt: Date.now()
                });
                return resolve({ error: false, message: 'update_success', data: signalAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getOverviewBlogIndex(){
        return new Promise(async resolve => {
            try {
                let statusActive = 1;
                let category1 = categorys_for_query_BLOG_INDEX[0].category;
                let category2 = categorys_for_query_BLOG_INDEX[1].category;
                let category3 = categorys_for_query_BLOG_INDEX[2].category;
                let category4 = categorys_for_query_BLOG_INDEX[3].category;

                /**
                 * GET LIST CATEGORY CHILD -> $IN
                 */
                let listBlogCategory1Prepare = CATEGORY_COLL.find({ parent: category1 }, { _id: 1 });
                let listBlogCategory2Prepare = CATEGORY_COLL.find({ parent: category2 }, { _id: 1 });
                let listBlogCategory3Prepare = CATEGORY_COLL.find({ parent: category3 }, { _id: 1 });
                let listBlogCategory4Prepare = CATEGORY_COLL.find({ parent: category4 }, { _id: 1 });

                let [ categoriesID1, categoriesID2, categoriesID3, categoriesID4 ] = await Promise.all([listBlogCategory1Prepare, listBlogCategory2Prepare, listBlogCategory3Prepare, listBlogCategory4Prepare]);

                categoriesID1 = [...categoriesID1.map(item => OBJECT_ID(item._id)), ObjectID(category1)];
                categoriesID2 = [...categoriesID2.map(item => OBJECT_ID(item._id)), ObjectID(category2)];
                categoriesID3 = [...categoriesID3.map(item => OBJECT_ID(item._id)), ObjectID(category3)];
                categoriesID4 = [...categoriesID4.map(item => OBJECT_ID(item._id)), ObjectID(category4)];

                // console.log({ categoriesID1, categoriesID2, categoriesID3, categoriesID4 });

                let listBlogs = await BLOG_COLL.aggregate([
                        {
                            $facet: {
                                listBlogCategory1: [
                                    {
                                        $match: {
                                            category: {
                                                $in: categoriesID1
                                            },
                                            status: statusActive
                                        }
                                    },
                                    {    
                                        $limit: 6
                                    },
                                    {
                                        $lookup: {
                                            from: 'categories',
                                            localField: 'category',
                                            foreignField: '_id',
                                            as: 'category'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$category',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }, 
                                    {
                                        $lookup: {
                                            from: 'admins',
                                            localField: 'author',
                                            foreignField: '_id',
                                            as: 'author'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$author',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $sort: {
                                            amountView: -1
                                        }
                                    }
                                ],
                                listBlogCategory2: [
                                    {
                                        $match: {
                                            category: {
                                                $in: categoriesID2
                                            },
                                        }
                                    },
                                    {    
                                        $limit: 4
                                    },
                                    {
                                        $lookup: {
                                            from: 'categories',
                                            localField: 'category',
                                            foreignField: '_id',
                                            as: 'category'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$category',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },  
                                    {
                                        $lookup: {
                                            from: 'admins',
                                            localField: 'author',
                                            foreignField: '_id',
                                            as: 'author'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$author',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $sort: {
                                            amountView: -1
                                        }
                                    }
                                ],
                                listBlogCategory3: [
                                    {
                                        $match: {
                                            category: {
                                                $in: categoriesID3
                                            },
                                        }
                                    },
                                    {    
                                        $limit: 4
                                    }, 
                                    {
                                        $lookup: {
                                            from: 'categories',
                                            localField: 'category',
                                            foreignField: '_id',
                                            as: 'category'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$category',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'admins',
                                            localField: 'author',
                                            foreignField: '_id',
                                            as: 'author'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$author',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $sort: {
                                            amountView: -1
                                        }
                                    }
                                ],
                                listBlogCategory4: [
                                    {
                                        $match: {
                                            category: {
                                                $in: categoriesID4
                                            },
                                        }
                                    },
                                    {    
                                        $limit: 4
                                    }, 
                                    {
                                        $lookup: {
                                            from: 'categories',
                                            localField: 'category',
                                            foreignField: '_id',
                                            as: 'category'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$category',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }, 
                                    {
                                        $lookup: {
                                            from: 'admins',
                                            localField: 'author',
                                            foreignField: '_id',
                                            as: 'author'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$author',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $sort: {
                                            amountView: -1
                                        }
                                    }
                                ],
                                listBlogMostViews: [
                                    {    
                                        $limit: 4
                                    }, 
                                    {
                                        $lookup: {
                                            from: 'categories',
                                            localField: 'category',
                                            foreignField: '_id',
                                            as: 'category'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$category',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }, 
                                    {
                                        $lookup: {
                                            from: 'admins',
                                            localField: 'author',
                                            foreignField: '_id',
                                            as: 'author'
                                        }
                                    }, 
                                    {
                                        $unwind:  {
                                            path: '$author',
                                            preserveNullAndEmptyArrays: true
                                        }
                                    },
                                    {
                                        $sort: {
                                            amountView: -1
                                        }
                                    }
                                ],
                            }
                        },
                ]);

            if (!listBlogs) return resolve({ error: true, message: 'cannot_get_list' })
            return resolve({ 
                error: false, data: {
                listBlogCategory1: listBlogs[0].listBlogCategory1,
                listBlogCategory2: listBlogs[0].listBlogCategory2,
                listBlogCategory3: listBlogs[0].listBlogCategory3,
                listBlogCategory4: listBlogs[0].listBlogCategory4,
                listBlogMostViews: listBlogs[0].listBlogMostViews,
            }});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model();