"use strict";
const jwt = require('jsonwebtoken');
const cfJwt = require('./cf_jws');
const ADMIN_SESSION = require('../session/admin-session');
const USERHIDEN = require('../session/user-hidden');

const ADMIN_MODEL   = require('../models/admin').MODEL;


module.exports = {
    role: {
        all: {
            
            bin: 1,
            auth:   function (req, res, next) {
                let lang = 'vn'
                if(req.query && req.query.lang){
                    lang = req.query.lang;
                }
                let user  = new Date();
                let session = USERHIDEN.getUser(req.session);
                if(!session){
                    USERHIDEN.saveUser(req.session,{ user, lang } );
                }
                next();
            }
        },
        user: {
            bin: 2,
            auth: function (req, res, next) {
                var token = req.params.token || req.body.token || req.query.token || req.headers[ 'x-access-token' ] || req.headers.token;
                if (token) {
                    jwt.verify(token, cfJwt.secret, function (err, decoded) {
                        if (err) {
                            return res.json({error: true, message: 'Failed to authenticate token.'});
                        } else {
                            if (Number(decoded.role) === 1) {
                                req.user = decoded;
                                next();
                            } else {
                                return res.json({success: false, message: 'Error: Permission denied.'});
                            }
                        }
                    });
                } else {
                    return res.status(403).send({
                        success: false,
                        message: 'No token provided.'
                    });
                }
            }
        },
        
        admin: {
            bin: 3,
            auth: function (req, res, next) {
                let token;
                let session = ADMIN_SESSION.getUser(req.session);
                session ? 
                    token = session.token :
                    token = req.params.token || req.body.token || req.query.token || req.headers[ 'x-access-token' ] || req.headers.token ;
                
                if (token) {
                    jwt.verify(token, cfJwt.secret,async function (err, decoded) {
                        if (err) {
                            res.redirect('/admin');
                        } else {
                            if (!decoded.checkExist._id) {
                                return res.rediret('/admin/clear-session-admin');
                            }
                            let infoAdmin = await ADMIN_MODEL.getInfoActive({ userID: decoded.checkExist._id });
                            /**
                             * CHECK_EDITOR_PERMISSION
                             */
                            if (!infoAdmin.error) {
                                let keyAdmin = 1;
                                let keySuperAdmin = 0;
                                let { group: { key } } = infoAdmin.data;
                                if (Object.is(Number(key), keySuperAdmin) || Object.is(Number(key), keyAdmin)) 
                                {
                                    req.user = decoded.checkExist;
                                    return next();
                                }
                                return res.redirect('/admin/clear-session-admin');
                                
                            } else {
                                return res.redirect('/admin/clear-session-admin');
                            }
                            /**
                             * END_CHECK_EDITOR_PERMISSION
                             */
                        }
                    });
                } else {
                    return res.status(403).send({
                        success: false,
                        message: 'No token provided.'
                    });
                }
            }
        },
    },

    authorization: function (req, res, next) {
        var hasRole = false;
        var currentRole = null;

        for (var itemRole in this.role) {
            if (!hasRole) {
                if (res.bindingRole.config.auth.includes(this.role[ itemRole ].bin)) {
                    hasRole = true;
                    currentRole = this.role[ itemRole ];
                }
            }
        }
        currentRole.auth(req, res, next);
    }
};