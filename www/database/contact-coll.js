"use strict";

const BASE_COLL = require('./intalize/base-coll');
const Schema    = require('mongoose').Schema;

// lưu thông tin người dùng/doanh nghiệp đăng ký, gửi về hệ thống
module.exports  = BASE_COLL("contact", {
    name : { type: String },
    companyName : { type: String },
    email : { type: String },
    companyType : { type: String },
    phone : { type: String },
});