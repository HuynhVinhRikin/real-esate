"use strict";

const roles 				= require('../../config/cf_role');
const ChildRouter 			= require('../child_routing');
const OBJECT_ID 			= require('mongoose').Types.ObjectId;
/**
 * MODEL IMPORT INTERNAL
 */
const BLOG_MODEL 			= require('../../models/blog').MODEL;
const CATEGORY_MODEL 		= require('../../models/category').MODEL;
const TAG_MODEL 			= require('../../models/tags').MODEL;
const ADMIN_MODEL 			= require('../../models/admin').MODEL;
const { redirectNewLink } 	= require('../../config/cf_redirect');
const CONSTANT 				= require('../../config/cf_constants');

module.exports = class Auth extends ChildRouter {
	constructor() {
		super('/blog');
	}

	registerRouting(io) {
		return {
			'/:slugBlog?/:tagSlug?': {
				config: {
					auth: [roles.role.all.bin],
					view: 'index-blog',
					inc: 'inc/blog/index',
					title: 'TRX-STOREFRONT',
					type: 'view',
				},
				methods: {
					get: [async (req, res) => {
						const { slugBlog, tagSlug } = req.params;
						let { page: pageCurrent } = req.query;

						if (!slugBlog) {
							let { search } = req.query;
							if (search) {
								console.log(`------------->>>>2222------------>>>`);
								console.log({ search })
								console.log(`------------->>>>2222------------>>>`);

								//http://localhost:5000/blog?search=hello
								let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandomWithoutInfo({ amountRandom: 6 });
								let blogsMostView = await BLOG_MODEL.getMostViewItem();
								let listBlogs = await BLOG_MODEL.getListBlogWithKeySearch({ pageCurrent, key: search });

								let linkpage = `/blog?search=${search}`;

								res.bindingRole.config.inc = `inc/blog/category.ejs`;
								return ChildRouter.renderToView(req, res, {
									blogsRef: blogsRef.data,
									blogsMostView: blogsMostView.data,
									infoContent: { title: search },
									listBlogs: listBlogs.data.blogs,
									//pagging
									current: listBlogs.data.current,
									pages: listBlogs.data.pages,
									linkpage,
									blogInfo: undefined,
								});
							}
							// INDEX BLOG PAGE
							let signalOverview = await BLOG_MODEL.getOverviewBlogIndex();
							let { listBlogCategory1, listBlogCategory2,
								listBlogCategory3, listBlogCategory4,
								listBlogMostViews } = signalOverview.data;

							return ChildRouter.renderToView(req, res, {
								listBlogCategory1, listBlogCategory2,
								listBlogCategory3, listBlogCategory4,
								listBlogMostViews,
								infoContent: undefined,
								blogInfo: undefined,
								infoIndexBlog: 'Waodate Blog',
							});
						} else {
							// console.log({ REQ_PARARMS: req.params.tagSlug })
							// trường hợp vẫn tồn tại slugBlog và tagBlog -> chuyển bỏ tagBlog
							if (tagSlug) {
								const pageCurrent = parseFloat(tagSlug)
								if (!pageCurrent) {
									return res.redirect(301, '/')
								}
								let infoContent = await CATEGORY_MODEL.getCategoryBySlug({ categorySlug: slugBlog });

								if (!OBJECT_ID.isValid(infoContent.data.parent)) {
									// CATEGORY PARENT
									let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoContent.data._id, amountRandom: 6 });
									let blogsMostView = await BLOG_MODEL.getMostViewItem();
									let listBlogs = await BLOG_MODEL.getListPostWithCategoryParent({ categoryID: infoContent.data._id });

									if (listBlogs.error) {
										// res.bindingRole.config.inc  = `inc/blog/category.ejs`;
										// CATEGORY CHILD
										listBlogs = await BLOG_MODEL.getListPostLatestCreateDescWithCategory({ item: 9, categoryID: infoContent.data._id, pageCurrent });
										let linkpage = `/blog/${slugBlog}`;
										res.bindingRole.config.inc = `inc/blog/category.ejs`;
										// console.log({ current: listBlogs.data.current });
										return ChildRouter.renderToView(req, res, {
											blogsRef: blogsRef.data,
											blogsMostView: blogsMostView.data,
											infoContent: infoContent.data,
											listBlogs: listBlogs.data.listPost,
											//pagging
											current: listBlogs.data.current,
											pages: listBlogs.data.pages,
											linkpage,
											blogInfo: undefined,
										});
									}

									let linkpage = `/blog/${slugBlog}`;
									res.bindingRole.config.inc = `inc/blog/category-parent.ejs`;
									return ChildRouter.renderToView(req, res, {
										blogsRef: blogsRef.data,
										blogsMostView: blogsMostView.data,
										infoContent: infoContent.data,
										listBlogs: listBlogs.data.listPost.length > 0 ? listBlogs.data.listPost[0] : {},
										categoryChilds: listBlogs.data.arrChildCategory,
										//pagging
										// current: listBlogs.data.current,
										// pages: listBlogs.data.pages,
										linkpage,
										blogInfo: undefined,
									});
								} else {
									// CATEGORY CHILD
									let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoContent.data._id, amountRandom: 6 });
									let blogsMostView = await BLOG_MODEL.getMostViewItem();
									let listBlogs = await BLOG_MODEL.getListPostLatestCreateDescWithCategory({ item: 9, categoryID: infoContent.data._id, pageCurrent });

									let linkpage = `/blog/${slugBlog}`;

									res.bindingRole.config.inc = `inc/blog/category.ejs`;
									// console.log({ current: listBlogs.data.current });
									return ChildRouter.renderToView(req, res, {
										blogsRef: blogsRef.data,
										blogsMostView: blogsMostView.data,
										infoContent: infoContent.data,
										listBlogs: listBlogs.data.listPost,
										//pagging
										current: listBlogs.data.current,
										pages: listBlogs.data.pages,
										linkpage,
										blogInfo: undefined,
									});
								}
								// console.log({ infoTag })
								return res.json({ ...req.params, infoTag })
								if (infoTag.error)
									return res.json({ message: 'fuck you bitch' })

							}
							if (Object.is(slugBlog, 'tag')) {
								// console.log(`----------xxx333s-------------`)

								// TAGS workplaces
								let { tagSlug } = req.params;
								let infoContent = await TAG_MODEL.getTagsbySlug({ slug: tagSlug });
								let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoContent.data._id, amountRandom: 6 });
								let blogsMostView = await BLOG_MODEL.getMostViewItem();
								let listBlogs = await BLOG_MODEL.getAllPostWithTag({ pageCurrent, tagSlug, item: 8 });

								let linkpage = `/blog/tag/${tagSlug}`;

								res.bindingRole.config.inc = `inc/blog/category.ejs`;
								return ChildRouter.renderToView(req, res, {

									blogsRef: blogsRef.data,
									blogsMostView: blogsMostView.data,
									infoContent: infoContent.data,
									listBlogs: listBlogs.data.listBlogs,
									//pagging
									current: listBlogs.data.current,
									pages: listBlogs.data.pages,
									linkpage,
									blogInfo: undefined,
								});
							}
								
							// ======================== start: redirect 301 ===============================
							if (slugBlog == 'de-co-mot-cai-ket-dep-khi-tim-nguoi-yeu-tren-mang') {
								return res.redirect(301, 'de-co-mot-cai-ket-dep-khi-tim-nguoi-yeu-qua-mang')
							}
							
							if (slugBlog == 'hay-lua-chon-ung-dung-hen-ho-voi-nguoi-nuoc-ngoai-giup-ban-nhanh-chong-gap-go-nguoi-ay') {
								return res.redirect(301, 'ung-dung-app-hen-ho-ket-ban-voi-nguoi-nuoc-ngoai-giup-ban-nhanh-chong-gap-go-nguoi-ay')
							}

							// ======================== end: redirect 301 ================================

							let infoBlog = await BLOG_MODEL.getInfoPost(slugBlog);
							if (!infoBlog.error) {
								console.log({ ___: slugBlog.lastIndexOf('/') })
                                /**
                                 * DETAIL BLOG
                                */
								if (infoBlog.message === `blog_inactive`)
									return res.redirect(301, res, '/blog')

								let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoBlog.data.category._id, amountRandom: 6 });
								let blogsRefCategories = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoBlog.data.category._id, amountRandom: 8 });

								// console.log(blogsRef);
								let blogsMostView = await BLOG_MODEL.getMostViewItem();

								let blogsRefTags = await BLOG_MODEL.getListBlogRefSameTagsRandom({ tags: infoBlog.data.tags, blogID: infoBlog.data._id })

								res.bindingRole.config.inc = `inc/blog/blog-detail.ejs`;
								let originAuthor = await ADMIN_MODEL.getOriginAuthor(infoBlog.data.authorOrigin);

								return ChildRouter.renderToView(req, res,
									{
										originAuthor: originAuthor.data,
										blogInfo: infoBlog.data,
										blogsRef: blogsRef.data,
										blogsMostView: blogsMostView.data,
										blogsRefTags: blogsRefTags.data,
										blogsRefCategories: blogsRefCategories.data,
										infoContent: undefined,
									});

							} else {
								let newUrl = await redirectNewLink(slugBlog, CONSTANT);
								// tìm link cũ và thay vào link mới
								if (newUrl.data) {
									return res.redirect(301, '/blog/' + newUrl.data);
								} else {
									// CATEGORY - NEW PLACE
									let infoContent = await CATEGORY_MODEL.getCategoryBySlug({ categorySlug: slugBlog });

									if (!OBJECT_ID.isValid(infoContent.data.parent)) {
										// CATEGORY PARENT
										let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoContent.data._id, amountRandom: 6 });
										let blogsMostView = await BLOG_MODEL.getMostViewItem();
										let listBlogs = await BLOG_MODEL.getListPostWithCategoryParent({ categoryID: infoContent.data._id });

										if (listBlogs.error) {
											// res.bindingRole.config.inc  = `inc/blog/category.ejs`;
											// CATEGORY CHILD
											listBlogs = await BLOG_MODEL.getListPostLatestCreateDescWithCategory({ item: 9, categoryID: infoContent.data._id, pageCurrent });
											let linkpage = `/blog/${slugBlog}`;
											res.bindingRole.config.inc = `inc/blog/category.ejs`;
											// console.log({ current: listBlogs.data.current });
											return ChildRouter.renderToView(req, res, {
												blogsRef: blogsRef.data,
												blogsMostView: blogsMostView.data,
												infoContent: infoContent.data,
												listBlogs: listBlogs.data.listPost,
												//pagging
												current: listBlogs.data.current,
												pages: listBlogs.data.pages,
												linkpage,
												blogInfo: undefined,
											});
										}

										let linkpage = `/blog/${slugBlog}`;
										res.bindingRole.config.inc = `inc/blog/category-parent.ejs`;
										return ChildRouter.renderToView(req, res, {
											blogsRef: blogsRef.data,
											blogsMostView: blogsMostView.data,
											infoContent: infoContent.data,
											listBlogs: listBlogs.data.listPost.length > 0 ? listBlogs.data.listPost[0] : {},
											categoryChilds: listBlogs.data.arrChildCategory,
											//pagging
											// current: listBlogs.data.current,
											// pages: listBlogs.data.pages,
											linkpage,
											blogInfo: undefined,
										});
									} else {
										// CATEGORY CHILD]
										let blogsRef = await BLOG_MODEL.getListBlogRefSameCategoryRandom2({ category: infoContent.data._id, amountRandom: 6 });
										let blogsMostView = await BLOG_MODEL.getMostViewItem();
										let listBlogs = await BLOG_MODEL.getListPostLatestCreateDescWithCategory({ item: 9, categoryID: infoContent.data._id, pageCurrent });

										let linkpage = `/blog/${slugBlog}`;

										res.bindingRole.config.inc = `inc/blog/category.ejs`;
										// console.log({ current: listBlogs.data.current });
										return ChildRouter.renderToView(req, res, {
											blogsRef: blogsRef.data,
											blogsMostView: blogsMostView.data,
											infoContent: infoContent.data,
											listBlogs: listBlogs.data.listPost,
											//pagging
											current: listBlogs.data.current,
											pages: listBlogs.data.pages,
											linkpage,
											blogInfo: undefined,
										});
									}
								}

							}
						}
					}]
				},
			},
		}
	}
};
