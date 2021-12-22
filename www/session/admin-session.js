"use strict";

const adminSession = new (require('./intalize/session'))('admin_session');

module.exports = {
    saveUser(session, { user, token}) {
        adminSession.saveSession(session, {
            user, token
        });
    },
    getUser(session) {
        return adminSession.getSession(session);
    },
    isLogin(session) {
        return this.getUser(session) !== null;
    },
    destroySession (session) {
        return adminSession.detroySession(session);
    }
};