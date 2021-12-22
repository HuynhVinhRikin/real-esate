"use strict";

const sessionConfUserHide = new (require('./intalize/session2'))('user_hidden_session');

module.exports = {
    saveUser(session, { user, lang}) {
        sessionConfUserHide.saveSession(session, {
            user, lang
        });
    },
    getUser(session) {
        return sessionConfUserHide.getSession(session);
    },
    isLogin(session) {
        return this.getUser(session) !== null;
    },
    destroySession (session) {
        return sessionConfUserHide.detroySession(session);
    },
    
    updateUserHidden (session, { user, lang }) {
        return sessionConfUserHide.updateSession(session, {
            user, lang
        });

    }
    
};