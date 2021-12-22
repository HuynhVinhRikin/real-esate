
"use strict";

var utils = require('../../utils/utils');
var sessionConfUserHide = require('../../config/cf_session');

class Session {

    constructor(session_key) {
        this.session_key = session_key;
    }

    saveSession(session, data) {
        session[sessionConfUserHide.getSessionKey(this.session_key)] = data;
    }

    getSession(session) {
        if (!utils.isEmptyObject(session[sessionConfUserHide.getSessionKey(this.session_key)])) {
            return session[sessionConfUserHide.getSessionKey(this.session_key)];
        } else {
            return null;
        }
    }

    updateSession(session, data) {
        session[sessionConfUserHide.getSessionKey(this.session_key)] = data;
    }
    detroySession(session) {
        if (!utils.isEmptyObject(session[sessionConfUserHide.getSessionKey(this.session_key)])) {
            session[sessionConfUserHide.getSessionKey(this.session_key)] = null;
        } else {
            return null;
        }
    }

}

module.exports = Session;