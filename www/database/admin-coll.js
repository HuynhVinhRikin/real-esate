"use strict";

const BASE_COLL = require('./intalize/base-coll');
const Schema    = require('mongoose').Schema;

module.exports  = BASE_COLL("admin", {
    username: { type: String, trim: true, require: true, unique: true },
    password: { type: String, require: true },
    fullname: String,
    group: {
        type: Schema.Types.ObjectId,
        ref: 'group_admin'
    },
    /**
     * 1. active
     * 0. inactive
     */
    status: { type: Number, default: 1 }
});