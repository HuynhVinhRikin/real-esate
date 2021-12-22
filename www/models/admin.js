"use strict";

const BaseModel                     = require('./intalize/base_model');
const ADMIN_COLL                    = require('../database/admin-coll');
const jwt                           = require('jsonwebtoken');
const cfJws                         = require('../config/cf_jws');
const { hash, compare }             = require('bcryptjs');
const GROUP_ADMIN_MODEL             = require('../models/group-admin').MODEL;
const ObjectID                      = require('mongoose').Types.ObjectId;

class Model extends BaseModel {

    constructor() {
        super(require('../database/admin-coll'))
    }

    insert({ username, password, fullname, groupID }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let isExistUsername = await ADMIN_COLL.findOne({ username });
                if (isExistUsername) resolve({ error: true, message: 'username_exist' });

                let hashPassword = await hash(password, 8);
                let infoUserCreated = await that.insertData({
                    username, password: hashPassword, fullname, group: groupID
                });
                if (!infoUserCreated) return resolve({ error: true, message: 'cannot_create_user' });

                let infoAfterPushIntoGroup = await GROUP_ADMIN_MODEL.updateUserIntoGroup({ groupID, userID: infoUserCreated._id })
                if (infoAfterPushIntoGroup.error) return resolve({ error: true, message: 'cannot_push_user_into_group' });

                return resolve({ error: false, data: infoUserCreated });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    update({ adminID, username, password, fullname, groupID }) {
        return new Promise(async resolve => {
            try {
                let newHashPass = await hash(password, 8);
                let infoAdminAfterUpdated = await ADMIN_COLL.findByIdAndUpdate(adminID, { username, password: newHashPass, fullname, group: groupID, modifyAt: Date.now() }, { new: true });
                if (!infoAdminAfterUpdated) return resolve({ error: true, message: 'cannot_update_info_user' });
                return resolve({ error: false, data: infoAdminAfterUpdated })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // updateInfoByID({ adminID, username, password, fullname, groupID }) {
    //     return new Promise(async resolve => {
    //         try {
    //             let infoAdminAfterUpdated = await ADMIN_COLL.findByIdAndUpdate(adminID, { username, password, fullname, group: groupID, modifyAt: Date.now() }, { new: true });
    //             if (!infoAdminAfterUpdated) return resolve({ error: true, message: 'cannot_update_info_user' });
    //             return resolve({ error: false, data: infoAdminAfterUpdated })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    setPasswordWithRootPermission({ userID, newPass }) {
        return new Promise(async resolve => {
            try {
                let newHashPass = hash(newPass, 8);
                let infoAfterUpdatePass = await ADMIN_COLL.findByIdAndUpdate(userID, {
                    password: newHashPass, modifyAt: Date.now()
                }, { new: true });
                if (!infoAfterUpdatePass) return resolve({ error: true, message: 'cannot_update_password' });
                return resolve({ error: false, data: infoAfterUpdatePass })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfo({ adminID }) {
        return new Promise(async resolve => {
            try {
                if (!ObjectID.isValid(adminID)) return resolve({ error: true, message: 'params_not_valid' });
                let infoAdmin = await ADMIN_COLL.findById(adminID)
                    .populate('group');
                if (!infoAdmin) return resolve({ error: true, message: 'cannot_get_info' });
                return resolve({ error: false, data: infoAdmin });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfoActive({ userID }) {
        return new Promise(async resolve => {
            try {
                if (!ObjectID.isValid(userID)) return resolve({ error: true, message: 'params_not_valid' });
                let infoUser = await ADMIN_COLL.findOne({
                    _id: userID, status: 1
                })
                    .populate('group');
                if (!infoUser) return resolve({ error: true, message: 'cannot_get_info' });
                return resolve({ error: false, data: infoUser });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    // updateGroupUser => GROUP_ADMIN_MODEL.updateUserIntoGroup (GROUP ADMIN MODEL)

    login(username, password) {
        return new Promise(async resolve => {
            try {
                let checkExist = await ADMIN_COLL.findOne({ username: username, status: 1 });
                if (!checkExist) return resolve({ error: true, message: 'username_not_exist' });
                let isMatchPass = await compare(password, checkExist.password);

                if (!isMatchPass) return resolve({ error: true, message: 'password_not_match' });

                delete isMatchPass.password;
                let token = jwt.sign({checkExist}, cfJws.secret, {});
                let infoAdmin = await ADMIN_COLL.findOne({ username })
                    .populate({
                        path: 'group',
                    });
                const { group: { key } } = infoAdmin;
                // console.log({ ___key: key });
                return resolve({ error: false, message: 'signin_success', data: { token: token, user: checkExist, key } });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getList() {
        return new Promise(async resolve => {
            try {
                let listAdmin = await ADMIN_COLL.find({})
                    .populate('group');
                if (!listAdmin) return resolve({ error: true, message: 'cannot_get_list' });

                return resolve({ error: false, data: listAdmin });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    getOriginAuthor(id){
        return new Promise(async resolve => {
            try {
                let listAdmin = await ADMIN_COLL.findOne({ _id:id});
                return resolve({ error: false, data: listAdmin });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    updateStatus({ adminID, status }) {
        return new Promise(async resolve => {
            try {
                let infoAfterUpdate = await ADMIN_COLL.findByIdAndUpdate(adminID, {
                    status, modifyAt: Date.now()
                }, { new: true });
                if (!infoAfterUpdate) return resolve({ error: true, message: 'cannot_update_info' });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;