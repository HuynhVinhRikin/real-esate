"use strict";

const BASE_COLL = require('./intalize/base-coll');
module.exports  = BASE_COLL("tag", {
    title        : { type: String, require: true, trim: true },
    slug         : { type: String,  require: true, trim: true },
    /**
     * 1. hoạt động
     * 0. khóa
     */
    status       : { type: Number, default: 1 },
    description  : { type: String },
    image        : { type: String }
});