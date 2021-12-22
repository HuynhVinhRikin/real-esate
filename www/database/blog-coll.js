"use strict";

const BASE_COLL     = require('./intalize/base-coll');
const Schema        = require('mongoose').Schema;
const ObjectID      = Schema.Types.ObjectId;

module.exports = BASE_COLL("blog", {
    title   : { type: String, require: true }, 
    slug    : { type: String, unique: true, require: true},
    content : { type: String },
    description : { type: String }, //EXCERPT
    image   : { type: String, trim: true },
    lang : { type : String },
    /**
     * 0. inactive
     * 1. active
     */
    status  : { type: Number, default: 1 },
    tags    : [
        { 
            type: ObjectID,
            ref : 'tag'
        }
    ],
    category : { 
        type: ObjectID,
        ref : 'category'
    },
    author   : {
        type: ObjectID,
        ref : 'admin'
    },
    amountView : {
        type: Number,
        default: 1
    },
    isFeature: { type: Number, default: 1 },
    yoastTitle: String,
    yoastDescription: String,
    yoastFocus: String,
    /**
     * tác giả được chỉnh sửa trong input
     */
    authorOrigin: {
        type: ObjectID,
        ref : 'admin'
    },

    /**
     *  0. index
     *  1. noIndex
     */
    seo: {
      type: Number,
        default: 0
    }
});