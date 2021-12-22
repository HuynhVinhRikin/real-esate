"use strict";

const BASE_COLL = require('./intalize/base-coll');
const Schema    = require('mongoose').Schema;

/**
 * admin có 3 quyền: EDITOR, ADMIN, SUPER ADMIN
 * 1. Editor: Quyền chỉnh sửa BLOG
 * 2. Admin: Quản lý tất cả
 * 0. Super Admin: Tạo được Admin
 */
module.exports  = BASE_COLL("group_admin", {
    name: String,
    description: String,
    members: [
        { 
            type: Schema.Types.ObjectId,
            ref: 'admin'
        }
    ],
    /**
     * 1. editor
     * 2. admin
     * 0. super admin
     */
    key: Number
});