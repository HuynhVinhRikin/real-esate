"use strict";

const BaseModel                     = require('./intalize/base_model');
const GROUP_ADMIN_COLL              = require('../database/group-admin-coll');
const ADMIN_COLL                    = require('../database/admin-coll');
const ObjectID                      = require('mongoose').Types.ObjectId;

class Model extends BaseModel {

    constructor() {
        super(require('../database/group-admin-coll'))
    }

    insert({ name, description, key }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                let infoGroup = await that.insertData({ name, description, key });
                if (!infoGroup) return resolve({ error: true, message: 'cannot_inserted' });
                resolve({ error: false, data: infoGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    update({ groupID, name, description, key }) {
        return new Promise(async resolve => {
            try {   
                if (!ObjectID.isValid(groupID))
                    return resolve({ error: true, message: 'group_id_not_valid' });
                let infoUpdated = await GROUP_ADMIN_COLL.findByIdAndUpdate(groupID, {
                    name, description, key
                }, { new: true });
                if (!infoUpdated)
                    return resolve({ error: true, message: 'cannot_update_info' });
                return resolve({ error: false, data: infoUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateUserIntoGroup({ groupID, userID }) {
        return new Promise(async resolve => {
            try {
                if (!ObjectID.isValid(groupID) || !ObjectID.isValid(userID))
                    return resolve({ error: true, message: 'params_not_valid' });

                let infoUser = await ADMIN_COLL.findById(userID);
                if (!infoUser)
                    return resolve({ error: true, message: 'cannot_get_info' });
                
                const { group: groupIdOfUser } = infoUser;
                let infoUserPulled = await GROUP_ADMIN_COLL.findByIdAndUpdate(groupIdOfUser, {
                    $pull: {
                        members: userID
                    },
                    modifyAt: Date.now()
                }, { new: true });
                // if (!infoUserPulled) return resolve({ error: false, message: 'cannot_pull_member_old' });

                let infoUserPushed = await GROUP_ADMIN_COLL.findByIdAndUpdate(groupID, {
                    $addToSet: {
                        members: userID
                    },
                    modifyAt: Date.now()
                }, { new: true });
                if (!infoUserPushed || !infoUserPulled) return resolve({ error: true, message: 'cannot_push_member_new' });

                return resolve({ error: false, message: 'update_successed' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    getList() {
        return new Promise(async resolve => {
            try {
                let listGroup = await GROUP_ADMIN_COLL.find({});
                if (!listGroup) return resolve({ error: true, message: 'cannot_get_list' });

                return resolve({ error: false, data: listGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getInfo({ groupID }) {
        return new Promise(async resolve => {
            try {
                let infoGroup = await GROUP_ADMIN_COLL.findById(groupID);
                if (!infoGroup) return resolve({ error: true, message: 'cannot_get_list' });

                return resolve({ error: false, data: infoGroup });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    
}

exports.MODEL = new Model;