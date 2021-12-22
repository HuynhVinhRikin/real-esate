"use strict";

const BASE_COLL = require('./intalize/base-coll');
const Schema    = require('mongoose').Schema;

module.exports  = BASE_COLL("category", {
    title        : { type: String, require: true, trim: true },
    slug         : { type: String },
    /**
     * 1. hoạt động
     * 0. khóa
     */
    status       : { type: Number, default: 1 },
    description  : { type: String },
    parent       : { 
                    type: Schema.Types.ObjectId, 
                    ref :'category' 
    },
    image        : { type: String }
});