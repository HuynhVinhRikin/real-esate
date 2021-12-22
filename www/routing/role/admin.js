"use strict";

const promise = require('bluebird');
const roles = require('../../config/cf_role');
const ChildRouter = require('../child_routing');
const APP = require('../../../app');
const stringUtils = require('../../utils/string_utils');
const ADMIN_SESSION = require('../../session/admin-session');
const OBJECT_ID = require('mongoose').Types.ObjectId;
/**
 * INTERNAL
 */
const CATEGORY_MODEL    = require('../../models/category').MODEL;
const TAGGING_MODEL     = require('../../models/tags').MODEL;
const ADMIN_MODEL       = require('../../models/admin').MODEL;
const BLOG_MODEL        = require('../../models/blog').MODEL;
const GROUP_ADMIN_MODEL = require('../../models/group-admin').MODEL;
const CONTACT_MODEL = require('../../models/contact').MODEL;

const CATEGORY_COLL    = require('../../database/category-coll');


const { keys }      = require('../../config/cf_constants');
const fs            = require('fs');
const path          = require('path');
const moment = require('moment');
const languageSettingSys          = require('../../language/language').langlistSys;


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/admin');
    }

    registerRouting(io) {
        return {
            '/': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/index',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [function (req, res) {
                        // return ChildRouter.renderToView(req, res);
                        return ChildRouter.redirect(res, '/admin/list-blog');
                    }]
                },
            },
            /**
            |--------------------------------------------------
            |                       BLOG
            |--------------------------------------------------
            */

            '/add-real-estate': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/real-estate/add-real-estate',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [function (req, res) {
                        return ChildRouter.renderToView(req, res);
                    }]
                },
            },
            '/list-deposit': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/real-estate/list-deposit',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [function (req, res) {
                        return ChildRouter.renderToView(req, res);
                    }]
                },
            },

            '/add-blog': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/add-blog.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let categories = await CATEGORY_MODEL.getAllCategoryByStatus({ status: 1 });
                        let tags = await TAGGING_MODEL.getAllTagsByStatus({ status: 1 });
                        let blog = null;
                        let listAdmins = await ADMIN_MODEL.getList();

                        return ChildRouter.renderToView(req, res, {
                            categories: categories.data,
                            tags: tags.data,
                            blog,
                            languageSettingSys,
                            listAdmins: listAdmins.data
                        });
                    }],

                    post: [async (req, res) => {
                        let data = JSON.parse(req.body.data);
                        let { _id: author } = req.user;
                        let { title, description, content, category, tag, status, isFeature, yoastTitle, yoastDescription, yoastFocus, slug, authorOrigin, lang } = data;
                        let objData = {
                            title, content, description, tagsID: tag, categoryID: category, status, isFeature, author, authorOrigin,
                            yoastTitle, yoastDescription, yoastFocus, slug, lang
                        };
                        if (req.files) {
                            const uploadPathOutput = path.resolve(__dirname, '../../../files/blog/');
                            const updatePathInput = path.resolve(__dirname, '../../../files/temp/blog/');

                            let file = req.files.image;
                            const filePath = file.name.split('.');
                            const newFileName = `${stringUtils.md5((new Date()).getTime() + '_' + stringUtils.md5(file.name) + '_' + stringUtils.randomString())}.${filePath[filePath.length - 1]}`;

                            await file.mv(`${uploadPathOutput}/${newFileName}`, function (err) {
                                if (err){
                                    return res.json({
                                        error: true,
                                        message: 'cannot_update_image'
                                    })
                                }
                            });
                            // await COMPRESS_IMAGE(`${updatePathInput}/${newFileName}`, uploadPathOutput);

                            objData.image = `/files/blog/${newFileName}`
                        } else {
                            objData.image = "/template/images/icon-union.png";
                        }
                        let infoBlog = await BLOG_MODEL.insert(objData);
                        return res.json(infoBlog);
                    }]
                },
            },
            '/details-blog': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    get: [async function (req, res) {
                        let { blogID } = req.query;
                        let resultSearch = await BLOG_MODEL.getDataById(blogID)
                        return res.json(resultSearch)
                    }]
                },
            },

            '/update-blog/:blogSlug': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/add-blog.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let { blogSlug } = req.params;
                        let categories = await CATEGORY_MODEL.getAllCategoryByStatus({ status: 1 });
                        let tags = await TAGGING_MODEL.getAllTagsByStatus({ status: 1 });
                        let blog = await BLOG_MODEL.getInfoPostForAdmin(blogSlug);
                        let listAdmins = await ADMIN_MODEL.getList();
                        return ChildRouter.renderToView(req, res, {
                            categories: categories.data,
                            tags: tags.data,
                            blog: blog.data,
                            listAdmins: listAdmins.data
                        });
                    }],

                    post: [async (req, res) => {
                        let { blogSlug } = req.params;
                        let { _id: author } = req.user;
                        let data = JSON.parse(req.body.data);
                        let { lang, title, description, content, category, tag, status, isFeature, yoastTitle, yoastDescription, yoastFocus, slug, authorOrigin } = data;
                        let objData = {
                            blogSlug, title, content, description, tagsID: tag, categoryID: category, status, isFeature,
                            yoastTitle, yoastDescription, yoastFocus, slug, author, authorOrigin, lang
                        };

                        if (req.files) {
                            const uploadPathOutput = path.resolve(__dirname, '../../../files/blog/');
                            const updatePathInput = path.resolve(__dirname, '../../../files/temp/blog/');

                            let file = req.files.image;
                            const filePath = file.name.split('.');
                            const newFileName = `${stringUtils.md5((new Date()).getTime() + '_' + stringUtils.md5(file.name) + '_' + stringUtils.randomString())}.${filePath[filePath.length - 1]}`;

                            file.mv(`${uploadPathOutput}/${newFileName}`, function (err) {
                                if (err) return res.json({
                                    error: true,
                                    message: 'cannot_update_image'
                                })
                            });

                            // await COMPRESS_IMAGE(`${updatePathInput}/${newFileName}`, uploadPathOutput);

                            objData.image = `/files/blog/${newFileName}`
                        } else {
                            let infoBlog = await BLOG_MODEL.getInfoPostForAdmin(blogSlug);
                            objData.image = infoBlog.data.image;
                        }
                        let infoBlogAfterUpdate = await BLOG_MODEL.updateInfoBlog(objData);
                        res.json(infoBlogAfterUpdate);
                    }]
                },
            },

            '/update-status-blog/:blogSlug': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { blogSlug } = req.params;
                        let { status } = req.body;
                        let infoBlogAfterUpdate = await BLOG_MODEL.updateStatusBlog({ blogSlug, status });
                        res.json(infoBlogAfterUpdate);
                    }]
                },
            },

            '/list-blog': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/list-blog.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        const { page, key, starttime, endtime, category, tag, author, sortView, status, amountItemShow } = req.query;
                        let pageCurrent = null;
                        if (!Number.isNaN(Number(page))) {
                            pageCurrent = page
                        } else {
                            pageCurrent = 1;
                        }
                        let startTimeTemp = null;
                        let endTimeTemp = null;
                        if (starttime && endtime) {
                            let startTimeArr = starttime.split(/\//);
                            startTimeTemp = [startTimeArr[1], startTimeArr[0], startTimeArr[2]].join('/');

                            let endTimeArr = endtime.split(/\//);
                            endTimeTemp = [endTimeArr[1], endTimeArr[0], endTimeArr[2]].join('/');
                        }

                        let blogsResp = await BLOG_MODEL.getListForAdmin({ pageCurrent, key, starttime: startTimeTemp, endtime: endTimeTemp, category, tag, author, sortView, status, amountItemShow });
                        const { blogs, current, pages, amount, perPage, conditionObj, conditionMatchKey } = blogsResp.data;
                        // tim kiem tong quan
                        let infoOverview = await BLOG_MODEL.getInfoOverview({ conditionObj, conditionMatchKey });
                        let categories = await CATEGORY_MODEL.getAllCategoryByStatus({ status: 1 });
                        let tags = await TAGGING_MODEL.getAllTagsByStatus({ status: 1 });
                        /**
                         * BUILD URI RENDER CLIENT
                         */
                        let uri = `/admin/list-blog?status=${status || 1}`;
                        if (key) uri += `&key=${key}`;

                        if (starttime && endtime) uri += `&starttime=${starttime}&endtime=${endtime}`
                        if (category && category != -1) uri += `&category=${category}`;
                        if (tag && tag != -1) uri += `&tag=${tag}`;
                        if (author && author != -1) uri += `&author=${author}`;
                        if (sortView && sortView != -1) uri += `&sortView=${sortView}`;
                        /**
                         * END BUILD RENDER CLIENT
                         */
                        return ChildRouter.renderToView(req, res, {
                            //HELPER_PAGING
                            linkpage: uri,
                            blogs: blogs,
                            current: current,
                            pages: pages,
                            amountResult: amount,
                            //END_HELPER_PAGING
                            infoOverview: infoOverview.data,
                            categories: categories.data,
                            tags: tags.data,
                            perPage,
                            search: {
                                key, starttime, endtime, category, author, sortView, status, tag
                            }
                        });
                    }]
                },
            },

            '/remove-list-blog': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { arrBlogsID } = req.body;
                        /**
                         * arrBlogsID : [213123,134234,3243241]
                         */
                        let signalAfterRemoveList = await BLOG_MODEL.removeListBlogs({ arrBlogsID })
                        res.json(signalAfterRemoveList);
                    }]
                },
            },

            '/update-status-list-blog': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { arrBlogsID, status } = req.body;
                        /**
                         * arrBlogsID : [213123,134234,3243241]  
                         */
                        let signalAfterUpdateList = await BLOG_MODEL.updateListBlogs({ arrBlogsID, status })
                        res.json(signalAfterUpdateList);
                    }]
                },
            },

            '/update-index-blog/:blogID': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { index } = req.body;
                        let { blogID } = req.params;

                        let signalAfterUpdateList = await BLOG_MODEL.updateIndexSeoBlogs({ blogID, index })
                        res.json(signalAfterUpdateList);
                    }]
                },
            },

            '/add-category': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/add-category.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let category = null;
                        let categories = await CATEGORY_MODEL.getAllCategoryByStatus({ status: 1 });
                        return ChildRouter.renderToView(req, res, {
                            category,
                            categories: categories.data
                        });
                    }],

                    post: [async (req, res) => {
                        const { title, description, parent } = req.body;
                        let infoCategory = await CATEGORY_MODEL.insert({ title, description, parent });
                        res.json(infoCategory);
                    }]
                },
            },

            '/update-category/:categorySlug/:cateID': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/add-category.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let { categorySlug, cateID } = req.params;
                        console.log({cateID, categorySlug})
                        let category = await CATEGORY_COLL.findOne({ _id : cateID, slug: categorySlug });
                        
                        let categories = await CATEGORY_MODEL.getAllCategoryExcept_id({ _id: category._id, parent: category.parent });
                        return ChildRouter.renderToView(req, res, {
                            category: category,
                            categories: categories.data
                        });
                    }],

                    post: [async (req, res) => {
                        let { categorySlug } = req.params;
                        const { title, description, parent, cateID } = req.body;
                        let infoCategory = await CATEGORY_MODEL.updateInfoCategory({ cateID, categorySlug, title, description, parent });
                        res.json(infoCategory);
                    }]
                },
            },

            '/update-status-category/:categorySlug': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { categorySlug } = req.params;
                        let { status } = req.body;
                        let infoCategoryAfterUpdate = await CATEGORY_MODEL.updateStatusCategory({ categorySlug, status });
                        res.json(infoCategoryAfterUpdate);
                    }]
                },
            },

            '/list-category': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/list-category.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let { page, key, status, amountItemShow } = req.query;
                        let pageCurrent = null;
                        if (!Number.isNaN(Number(page))) {
                            pageCurrent = page
                        } else {
                            pageCurrent = 1;
                        }
                        let categories = await CATEGORY_MODEL.getListForAdmin({ pageCurrent, key, status, amountItemShow });
                        let { categories: categoryTemp, amount, current, pages, perPage, conditionObj, conditionMatchKey } = categories.data;

                        let infoOverview = await CATEGORY_MODEL.getInfoOverview({ conditionObj, conditionMatchKey });
                        /**
                        * BUILD URI RENDER CLIENT
                        */
                        let uri = `/admin/list-category?`;
                        if (key) uri += `&key=${key}`;
                        if (status == 0 || status == 1) uri += `&status=${status}`;
                        /**
                         * END BUILD RENDER CLIENT
                         */
                        return ChildRouter.renderToView(req, res, {
                            // 3 thuoo tinh bat buoc cua paggign
                            linkpage: uri,
                            current: current,
                            pages: pages,
                            // 3 thuoo tinh bat buoc cua paggign
                            perPage,
                            categories: categoryTemp,
                            amount: amount,
                            infoOverview: infoOverview.data,
                            search: { page, key, status }
                        });
                    }],
                },
            },

            '/update-status-list-category': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { arrCategoryID, status } = req.body;
                        /**
                         * arrCategoryID : [213123,134234,3243241]  
                         */
                        let signalAfterUpdateList = await CATEGORY_MODEL.updateListCategory({ arrCategoryID, status })
                        res.json(signalAfterUpdateList);
                    }]
                },
            },

            '/add-tagging': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/add-tagging.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [function (req, res) {
                        let tag = null;
                        return ChildRouter.renderToView(req, res, {
                            tag
                        });
                    }],

                    post: [async (req, res) => {
                        const { title, description } = req.body;
                        let infoTagging = await TAGGING_MODEL.insert({ title, description });
                        res.json(infoTagging);
                    }]
                },
            },

            '/update-tagging/:slug': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/add-tagging.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let { slug } = req.params;
                        let tag = await TAGGING_MODEL.getTagsbySlug({ slug });
                        return ChildRouter.renderToView(req, res, {
                            tag: tag.data
                        });
                    }],

                    post: [async (req, res) => {
                        let { slug } = req.params;
                        const { title, description } = req.body;
                        let infoCategory = await TAGGING_MODEL.updateInfoTags({ slug, title, description });
                        res.json(infoCategory);
                    }]
                },
            },

            '/update-status-tagging/:slug': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        let { slug } = req.params;
                        let { status } = req.body;
                        let infoTagging = await TAGGING_MODEL.updateStatusTag({ slug, status });
                        res.json(infoTagging);
                    }]
                },
            },

            '/list-tagging': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/list-tagging.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let { page, key, status, amountItemShow } = req.query;
                        let pageCurrent = null;
                        if (!Number.isNaN(Number(page))) {
                            pageCurrent = page
                        } else {
                            pageCurrent = 1;
                        }
                        let tags = await TAGGING_MODEL.getListForAdmin({ pageCurrent, key, status, amountItemShow });
                        let { tagging, amount, current, pages, perPage, conditionObj, conditionMatchKey } = tags.data;
                        let infoOverview = await TAGGING_MODEL.getInfoOverview({ conditionObj, conditionMatchKey });

                        let uri = `/admin/list-tagging?`;
                        if (key) uri += `&key=${key}`;
                        if (status == 0 || status == 1) uri += `&status=${status}`;

                        return ChildRouter.renderToView(req, res, {
                            // 3 thuoo tinh bat buoc cua paggign
                            linkpage: uri,
                            current: current,
                            pages: pages,
                            // 3 thuoo tinh bat buoc cua paggign
                            perPage,
                            tags: tagging,
                            amount: amount,
                            infoOverview: infoOverview.data,
                            search: { page, key, status }
                        });
                    }],
                },
            },
             /**
            |--------------------------------------------------
            |                      CONTACT
            |--------------------------------------------------
            */
           '/list-contact': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/list-contact.ejs',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        // let { page, key, status, amountItemShow } = req.query;
                        // let pageCurrent = null;
                        // if (!Number.isNaN(Number(page))) {
                        //     pageCurrent = page
                        // } else {
                        //     pageCurrent = 1;
                        // }
                        // let categories = await CATEGORY_MODEL.getListForAdmin({ pageCurrent, key, status, amountItemShow });
                        // let { categories: categoryTemp, amount, current, pages, perPage, conditionObj, conditionMatchKey } = categories.data;

                        // let infoOverview = await CATEGORY_MODEL.getInfoOverview({ conditionObj, conditionMatchKey });
                        // /**
                        // * BUILD URI RENDER CLIENT
                        // */
                        // let uri = `/admin/list-category?`;
                        // if (key) uri += `&key=${key}`;
                        // if (status == 0 || status == 1) uri += `&status=${status}`;
                        /**
                         * END BUILD RENDER CLIENT
                         */
                        let listContact = await CONTACT_MODEL.getAll();
                        return ChildRouter.renderToView(req, res, {
                            listContact : listContact.data,
                            // 3 thuoo tinh bat buoc cua paggign
                            // linkpage: uri,
                            // current: current,
                            pages: 1,
                            // // 3 thuoo tinh bat buoc cua paggign
                            perPage : 1,
                            // categories: categoryTemp,
                            // amount: amount,
                            // infoOverview: infoOverview.data,
                            // search: { page, key, status }
                        });
                    }],
                },
            },

            /**
            |--------------------------------------------------
            |                      GROUP/ADMIN
            |--------------------------------------------------
            */
            '/create-group-admin': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/create-group-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        ChildRouter.renderToView(req, res, {
                            keys,
                            infoGroup: undefined
                        });
                    }],
                    post: [async (req, res) => {
                        let { name, description, key } = req.body;

                        let infoGroup = await GROUP_ADMIN_MODEL.insert({ name, description, key });
                        res.json(infoGroup);
                    }]
                },
            },

            '/update-group-admin/:groupID': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/create-group-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        const { groupID } = req.params;
                        if (!OBJECT_ID.isValid(groupID))
                            ChildRouter.redirect(res, '/admin/list-group-admin');

                        let infoGroup = await GROUP_ADMIN_MODEL.getInfo({ groupID });
                        return ChildRouter.renderToView(req, res, {
                            keys,
                            infoGroup: infoGroup.data
                        });
                    }],
                    post: [async (req, res) => {
                        let { name, description, key } = req.body;
                        let { groupID } = req.params;
                        let infoGroupAfterUpdate = await GROUP_ADMIN_MODEL.update({ name, description, key, groupID });
                        res.json(infoGroupAfterUpdate);
                    }]
                },
            },

            '/list-group-admin': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/list-group-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let listGroupAdmins = await GROUP_ADMIN_MODEL.getList();
                        ChildRouter.renderToView(req, res, {
                            keys,
                            groupAdmins: listGroupAdmins.data,
                            perPage: 1
                        });
                    }]
                },
            },

            '/list-admin': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/list-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let listAdmins = await ADMIN_MODEL.getList();
                        ChildRouter.renderToView(req, res, {
                            admins: listAdmins.data,
                            perPage: 1
                        });
                    }]
                },
            },

            '/update-status-admin/:adminID': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        const { adminID } = req.params;
                        const { status } = req.body;
                        let infoAdmin = await ADMIN_MODEL.updateStatus({ adminID, status });
                        res.json(infoAdmin);
                    }]
                },
            },

            '/create-admin': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/create-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let listGroup = await GROUP_ADMIN_MODEL.getList();
                        ChildRouter.renderToView(req, res, {
                            listGroup: listGroup.data,
                            infoAdmin: null
                        });
                    }],
                    post: [async (req, res) => {
                        let { username, password, fullname, groupID } = req.body;
                        let infoAfterCreate = await ADMIN_MODEL.insert({ username, password, fullname, groupID });
                        res.json(infoAfterCreate);
                    }]
                },
            },

            '/update-admin/:adminID': {
                config: {
                    auth: [roles.role.admin.bin],
                    view: 'index-admin',
                    inc: 'inc/admin/create-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        let { adminID } = req.params;
                        let listGroup = await GROUP_ADMIN_MODEL.getList();
                        let infoAdmin = await ADMIN_MODEL.getInfo({ adminID });

                        ChildRouter.renderToView(req, res, {
                            listGroup: listGroup.data,
                            infoAdmin: infoAdmin.data
                        });
                    }],
                    post: [async (req, res) => {
                        let { adminID } = req.params;
                        let { username, password, fullname, groupID } = req.body;
                        let infoAfterCreate = await ADMIN_MODEL.update({ adminID, username, password, fullname, groupID });
                        res.json(infoAfterCreate);
                    }]
                },
            },
            /**
            |--------------------------------------------------
            |                     ADMIN - LOGIN - REGISTER
            |--------------------------------------------------
            */
            '/dang-nhap': {
                config: {
                    auth: [roles.role.all.bin],
                    view: 'pages/login-admin.ejs',
                    title: 'TRX-STOREFRONT AMDIN',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        //  ChildRouter.renderToView(req, res)
                        let checkExistToken = ADMIN_SESSION.isLogin(req.session);
                        if (!checkExistToken)
                            return ChildRouter.renderToView(req, res);
                        let checkUserHasAccess = ADMIN_SESSION.getUser(req.session);
                        if (!checkUserHasAccess) return res.redirect('/admin/dang-nhap');
                        let token = checkUserHasAccess.user.token;
                        if (!token) {
                            ChildRouter.renderToView(req, res);
                        } else {
                            jwt.verify(token, cfJwt.secret, async (err, decoded) => {
                                if (err) {
                                    res.redirect('/admin/dang-nhap');
                                } else {
                                    if (decoded) return res.redirect('/admin');
                                    return res.redirect('/admin/dang-nhap');
                                }
                            });
                        }
                    }],
                    post: [async (req, res) => {
                        let { username, password } = req.body;
                        let infoUserLogin = await ADMIN_MODEL.login(username, password);
                        if (!infoUserLogin.error)
                            ADMIN_SESSION.saveUser(req.session, {
                                token: infoUserLogin.data.token,
                                user: infoUserLogin.data.user
                            });
                        res.json(infoUserLogin);
                    }]
                },
            },

            '/clear-session-admin': {
                config: {
                    auth: [roles.role.all.bin],
                    view: 'pages/detroy-session-admin.ejs',
                    title: 'TRX-STOREFRONT',
                    type: 'view',
                },
                methods: {
                    get: [async (req, res) => {
                        ADMIN_SESSION.destroySession(req.session);
                        ChildRouter.renderToView(req, res);
                    }]
                },
            },
            /**
            |--------------------------------------------------
            |                   UPLOAD AND RETRIEV FILE (ckeditor)
            |--------------------------------------------------
            */
            '/get-imgs': {
                config: {
                    auth: [roles.role.all.bin],
                    type: 'json',
                },
                methods: {
                    get: [async (req, res) => {
                        let pathForRead = path.join(__dirname, '../../../files/blog/');
                        const images = fs.readdirSync(pathForRead);

                        var stored = [];
                        for (let item of images) {
                            if (item.split('.').pop() === 'png' || item.split('.').pop() === 'jpg'
                                || item.split('.').pop() === 'jpeg' || item.split('.').pop() === 'svg') {
                                var abc = {
                                    "image": `/files/blog/${item}`,
                                    "folder": "/"
                                };
                                stored.push(abc);
                            }
                        }
                        res.send(stored);
                    }]
                },
            },

            '/upload-imgs': {
                config: {
                    auth: [roles.role.all.bin],
                    type: 'json',
                },
                methods: {
                    post: [async (req, res) => {
                        if (req.files) {

                            const uploadPathOutput = path.resolve(__dirname, '../../../files/blog/');
                            const updatePathInput = path.resolve(__dirname, '../../../files/temp/blog/');

                            let file = req.files.upload;

                            const filePath = file.name.split('.');
                            // const newFileName = `${stringUtils.md5((new Date()).getTime() + '_' + stringUtils.md5(file.name) + '_' + stringUtils.randomString())}.${filePath[ filePath.length - 1 ]}`;

                            let newNameFinalForSEO = `${filePath[0]}_${`${stringUtils.md5((new Date()).getTime())}`.slice(0, 5)}.${filePath[filePath.length - 1]}`;
                            file.mv(`${uploadPathOutput}/${newNameFinalForSEO}`, function (err) {
                                if (err) return res.json({
                                    "uploaded": 0,
                                    "error": {
                                        "message": "Upload lỗi"
                                    }
                                })
                            });

                            // await COMPRESS_IMAGE(`${updatePathInput}/${newNameFinalForSEO}`, uploadPathOutput);

                            res.json({
                                "uploaded": 1,
                                "fileName": newNameFinalForSEO,
                                "url": `/files/blog/${newNameFinalForSEO}`
                            });
                        }
                    }]
                },
            },

            '/destroy-session': {
                config: {
                    auth: [roles.role.admin.bin],
                    type: 'json',
                },
                methods: {
                    get: [async (req, res) => {
                        ADMIN_SESSION.destroySession(req.session);
                        ChildRouter.redirect(res, '/admin/dang-nhap');
                    }]
                },
            },

        }
    }
};