"use strict";

const path                                  = require('path');
const promise = require('bluebird');
const roles = require('../../config/cf_role');
const ChildRouter = require('../child_routing');
const BLOG_MODEL        = require('../../models/blog').MODEL;
const CONTACT_MODEL        = require('../../models/contact').MODEL;
const CATEGORY_COLL        = require('../../database/category-coll');
const USERHIDEN = require('../../session/user-hidden');


let listSlugDef = {
    'product' : ['', '', ''],
    'solution' : ['', '', '']
}
module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting(io) {
        return {
            '/': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/home/index.ejs',
                    view: 'index.ejs',
                    code : 'HOME'
                },
                methods: {
                    get: [ async function (req, res) {
                        let listBlogProduct1, listBlogProduct2, listBlogProduct3;
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                        //các blog  câu chuyện giải pháp
                        listBlogProduct1 = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'san-pham-cong-ty', lang })
                        // các blog về nhu cầu khách hàng
                        listBlogProduct2 = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'khach-hang-cong-ty', lang })

                        listBlogProduct3 = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'giai-phap-trong-trang-chu', lang })
                        
                        ChildRouter.renderToView(req, res, { listBlogProductTrix : listBlogProduct1.data , 
                            listBlogCustomerTrix :  listBlogProduct2.data ,
                            listBlogSolutionHome : listBlogProduct3.data
                        });
                    }]
                },
            },
            '/products': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : path.resolve(__dirname, '../../views/inc/product/index.ejs'),
                    view: 'index.ejs',
                    code : 'INTRO_PRODUCTS'

                },
                methods: {
                    get: [ async function (req, res) {
                        let  { productID } = req.query;
                        let listBlogProduct1, listBlogProduct2, listBlogProduct3;
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';

                        // Vào chi tiết một đối tượng
                        if(productID){
                            //các blog  nhà đầu tư quản lý dự án
                            listBlogProduct1= await  BLOG_MODEL.getAllPostWithCategoryAndParentID({ categorySlug :'san-pham-nha-dau-tu-quan-ly-du-an', parent : productID, lang })
                            // các blog nhà thầu công trình xây dựng
                            listBlogProduct2 = await  BLOG_MODEL.getAllPostWithCategoryAndParentID({ categorySlug :'san-pham-nha-thau-cong-trinh-xay-dung', parent : productID, lang})
                            // các blog nhà thầu công tư vấn
                            listBlogProduct3 = await  BLOG_MODEL.getAllPostWithCategoryAndParentID({ categorySlug :'san-pham-don-vi-tu-van', parent : productID, lang })
                        
                        }else{
                        //vào trang /product
                            //các blog  câu chuyện giải pháp
                            listBlogProduct1 = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'san-pham-nha-dau-tu-quan-ly-du-an', lang })
                            // các blog về nhu cầu khách hàng
                            listBlogProduct2 = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'san-pham-nha-thau-cong-trinh-xay-dung', lang })
                      
                            listBlogProduct3 = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'san-pham-don-vi-tu-van' , lang})
                        }
                        ChildRouter.renderToView(req, res, { listBlogProduct1 : listBlogProduct1.data , listBlogProduct2 :  listBlogProduct2.data, listBlogProduct3 : listBlogProduct3.data });
                    }]
                },
            },
            '/experience': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/experience/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_EXPERIENCE'

                },
                methods: {
                    get: [ function (req, res) {
                        ChildRouter.renderToView(req, res);
                    }]
                },
            },
            '/event': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/event/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_EVENT'

                },
                methods: {
                    get: [ async function (req, res) {
                        let listBlogProduct1, listBlogProduct2, listBlogProduct3;
                        //eventID
                        let  { eventID, page } = req.query
                        if(!page){
                            page = 1;
                        }
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                        //các blog  câu chuyện giải pháp
                        if(eventID){
                            listBlogProduct1= await  BLOG_MODEL.getAllPostWithCategoryID({ categoryID : eventID , lang, page })
                        }else{
                            let eventInfo = await CATEGORY_COLL.findOne({ slug : 'su-kien' });
                            if(eventInfo){
                                //các blog  câu chuyện giải pháp
                                listBlogProduct1= await  BLOG_MODEL.getAllPostWithCategoryID({ categoryID : eventInfo._id , lang, page })
                            }
                        }
                        let listBlog = listBlogProduct1 && listBlogProduct1.data || [];
                        ChildRouter.renderToView(req, res, { listBlogEvent1: listBlog });
                    }]
                },
            },
            '/event/details-blog-event': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/event/blog-event-detail.ejs',
                    view: 'index.ejs',
                    code : 'DETAILS_EVENT'

                },
                methods: {
                    get: [ async function (req, res) {
                        let { slug, category } = req.query;
                        let infoBlog, listBothCategory = [];
                        if(slug){
                            let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                            infoBlog = await  BLOG_MODEL.getInfoPostWithParent({slug, lang});
                            infoBlog =  infoBlog.data;
                            // let eventID = await CATEGORY_COLL.findOne({ slug : 'su-kien' });
                            // listBothCategory  = await  BLOG_MODEL.getAllPostWithCategoryID({ categoryID : eventID._id , lang })
                            // listBothCategory =listBothCategory.data || []
                            listBothCategory  = await BLOG_MODEL.getPostWithPagingCategory(1, category, lang);
                            listBothCategory = listBothCategory.data && listBothCategory.data.listProduct
                        }
                        ChildRouter.renderToView(req, res, {
                            infoBlog,
                            listBothCategoryEvent : listBothCategory || []
                        });
                    }]
                },
            },
            '/get-more-blog-event': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'json',
                    view: 'index.ejs',
                    code : 'INTRO_EVENT'

                },
                methods: {
                    post: [ async function (req, res) {
                        let listBlogProduct1, listBlogProduct2, listBlogProduct3;
                        //eventID
                        let  { eventID, page } = req.body;
                        if(!page){
                            page = 1;
                        }
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                        //các blog  câu chuyện giải pháp
                        if(eventID){
                            listBlogProduct1= await  BLOG_MODEL.getAllPostWithCategoryID({ categoryID : eventID , lang, page })
                        }else{
                            let eventInfo = await CATEGORY_COLL.findOne({ slug : 'su-kien' });
                            //các blog  câu chuyện giải pháp
                            if(eventInfo){
                                listBlogProduct1= await  BLOG_MODEL.getAllPostWithCategoryID({ categoryID : eventInfo._id , lang, page})
                            }
                        }
                    //    let listBlog = listBlogProduct1.data || [];
                       return res.json(listBlogProduct1);
                    }]
                },
            },
            '/contact': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/contact/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_CONTACT'

                },
                methods: {
                    get: [ function (req, res) {
                        ChildRouter.renderToView(req, res);
                    }]
                },
            },
            '/solution': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/solution/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_SOLUTION'

                },
                methods: {
                    get: [ async function (req, res) {
                        let { solutionID, slug } = req.query;
                        let listBlogSolution, listBlogReqSolution;
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                        if(solutionID){
                            //các blog  câu chuyện giải pháp
                            listBlogSolution    = await  BLOG_MODEL.getAllPostWithCategoryAndParentID({ categorySlug :'cau-chuyen-doanh-nghiep', parent : solutionID, lang })
                            // các blog về nhu cầu khách hàng
                            listBlogReqSolution = await  BLOG_MODEL.getAllPostWithCategoryAndParentID({ categorySlug :'nhu-cau-khach-hang', parent : solutionID, lang })
                        }else{
                            //các blog  câu chuyện giải pháp
                            listBlogSolution    = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'cau-chuyen-doanh-nghiep', lang })
                            // các blog về nhu cầu khách hàng
                            listBlogReqSolution = await  BLOG_MODEL.getAllPostWithCategory({ categorySlug :'nhu-cau-khach-hang', lang })
                        }
                       ChildRouter.renderToView(req, res, 
                        {
                            listBlogSolution : listBlogSolution && listBlogSolution.data || [] ,
                            listBlogReqSolution :listBlogReqSolution && listBlogReqSolution.data || [],
                            slug 
                        });
                    }]
                },
            },
            '/about': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/about/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_ABOUT'

                },
                methods: {
                    get: [ function (req, res) {
                        ChildRouter.renderToView(req, res);
                    }]
                },
            },
            '/privacy-policy': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/privacy_policy/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_PRIVACY'

                },
                methods: {
                    get: [ function (req, res) {
                        ChildRouter.renderToView(req, res);
                    }]
                },
            },
            '/terms-use': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/terms_use/index.ejs',
                    view: 'index.ejs',
                    code : 'INTRO_TERMS'

                },
                methods: {
                    get: [ function (req, res) {
                        ChildRouter.renderToView(req, res);
                    }]
                },
            },
            '/solution-details-blog-solution': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/solution/detail-blog.ejs',
                    view: 'index.ejs',
                    code : 'DETAIL_BLOG'
                },
                methods: {
                    get: [ async function (req, res) {
                        let { slug, category } = req.query;
                        let infoBlog, listBothCategory;
                        if(slug){
                            let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                            infoBlog = await  BLOG_MODEL.getInfoPostWithParent({slug, lang});
                            infoBlog =  infoBlog.data;
                            listBothCategory  = await BLOG_MODEL.getPostWithPagingCategory(1, category);
                            listBothCategory = listBothCategory.data && listBothCategory.data.listProduct
                        }
                        ChildRouter.renderToView(req, res, {
                            infoBlog,
                            listBothCategory : listBothCategory || []
                        });
                    }]
                },
            },
            '/product/details-blog-product': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/product/blog-product_detail.ejs',
                    view: 'index.ejs',
                    code : 'DETAIL_PRODUCT_BLOG'
                },
                methods: {
                    get: [ async function (req, res) {
                        let { slug, category } = req.query;
                        let infoBlog, listBothCategory;
                        if(slug){
                            let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                            infoBlog            = await  BLOG_MODEL.getInfoPostWithParent({slug, lang});
                            infoBlog            = infoBlog.data;
                            listBothCategory    = await BLOG_MODEL.getPostWithPagingCategory(1, category);
                            listBothCategory    = listBothCategory.data && listBothCategory.data.listProduct
                        }
                        ChildRouter.renderToView(req, res, {
                            infoBlog,
                            listBothCategory
                        });
                    }]
                },
            },
            //CONTACT_MODEL
            '/add-contact': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'json',
                    code : 'INTRO_TERMS'

                },
                methods: {
                    post: [ async function (req, res) {
                        let { companyType, name, phone, email, companyName } = req.body;
                        let resultInsert = await CONTACT_MODEL.insert({ companyType, name, phone, email, companyName });
                        res.json(resultInsert)
                    }]
                },
            },

            '/search-blog': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/result-search.ejs',
                    view: 'index.ejs',
                    code : 'RESULT_SEARCH'
                },
                methods: {
                    get: [ async function (req, res) {
                        let { key, pageCurrent } = req.query;
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                        let resultInsert = await BLOG_MODEL.getListBlogWithKeySearchV2({ key, pageCurrent , lang  });
                        ChildRouter.renderToView(req, res, {
                            listBlogSearch : resultInsert.data, 
                            allPage : resultInsert.allPage || 0,
                            key
                        });
                    }],
                    post: [ async function (req, res) {
                        let { key, pageCurrent } = req.body;
                        res.bindingRole.config.type = 'json';
                        let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                        let resultInsert = await BLOG_MODEL.getListBlogWithKeySearchV2({ key, pageCurrent , lang  });
                        return res.json({error : false, data  : resultInsert });
                    }]
                },
            },
            '/details-blog': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'view',
                    inc : 'inc/detail-blog.ejs',
                    view: 'index.ejs',
                    code : 'DETAIL_BLOG'
                },
                methods: {
                    get: [ async function (req, res) {
                        let { slug, category } = req.query;
                        let infoBlog, listBothCategory;
                        if(slug){
                            let lang =  USERHIDEN.getUser(req.session) && USERHIDEN.getUser(req.session).lang || 'vn';
                            infoBlog            = await  BLOG_MODEL.getInfoPostWithParent({slug, lang});
                            infoBlog            = infoBlog.data;
                            listBothCategory    = await BLOG_MODEL.getPostWithPagingCategory(1, category);
                            listBothCategory    = listBothCategory.data && listBothCategory.data.listProduct
                        }
                        ChildRouter.renderToView(req, res, {
                            infoBlog,
                            listBothCategory
                        });
                    }]
                },
            },
            '/setting-lang': {
                config: {
                    auth: [ roles.role.all.bin ],
                    type: 'json',
                },
                methods: {
                    post: [ async function (req, res) {
                        let { lang } = req.body;
                        let  { user } =  USERHIDEN.getUser(req.session)
                        // USERHIDEN.destroySession(req.session );
                        USERHIDEN.saveUser(req.session,{ user, lang } );
                        console.log({__ : USERHIDEN.getUser(req.session)});
                        res.json({ error : false , message : 'updateLangSucces'})
                    }]
                },
            },


        }
    }
};
