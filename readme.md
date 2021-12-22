# Base KOF - BACKEND

[![Build Status](https://api.travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

## Session Destroy
Custom file /intalize/session.js
```js
    "use strict";

    const utils = require('../../utils/utils');
    const sessionConf = require('../../config/cf_session');
    
    class Session {
    
        constructor(session_key) {
            this.session_key = session_key;
        }
    
        saveSession(session, data) {
            session[sessionConf.getSessionKey(this.session_key)] = data;
        }
    
        getSession(session) {
            if (!utils.isEmptyObject(session[sessionConf.getSessionKey(this.session_key)])) {
                return session[sessionConf.getSessionKey(this.session_key)];
            } else {
                return null;
            }
        }
    
        detroySession(session) {
            if (!utils.isEmptyObject(session[sessionConf.getSessionKey(this.session_key)])) {
                session[sessionConf.getSessionKey(this.session_key)] = null;
            } else {
                return null;
            }
        }
    }
    
    module.exports = Session;
```
## Sử Dụng _lodash
sử dụng các phương thức _lodash.get(objUser, 'avatar.name', 'image-default.jpg')

## Middleware Socket
```js
io
        .use(async (socket, next) => {
            socket.auth    = false;
            if (socket.handshake.query && socket.handshake.query.token) {
                let signalVerifyToken = await checkAuth({ token: socket.handshake.query.token });
                if (signalVerifyToken.error)
                    return next(new Error('Authentication error'));
                const { data : { infoUser } } = signalVerifyToken;
                socket.decoded = infoUser;
                socket.auth    = true;
                /**
                 * ADD USER INTO usersConnected
                 * usersConnected
                 */
                const { id: socketID } = socket;
                const { _id: userID, username }  = infoUser;
                usersConnected = replaceExist(usersConnected, userID, socketID, username);
                let listUserConnectedWithInfo = await mapInfoUser(usersConnected, username);
                await USER_COLL.findOneAndUpdate({
                    username
                }, { isOnline: 1 },
                { new: true });
                console.log({ listUserConnectedWithInfo });
                socket.broadcast.emit(LIST_USER_ONLINE_SSC, listUserConnectedWithInfo);
                next();
            }
        })
        .on('connection', function (socket) {
```
## Multiple Language
    - Folder Locals (sử dụng set function getLang [lang] cho file ejs sử dụng  tất cả  route)
    - Folder Session
    - Folder Language
    - File ChildRouting.js (xử lý lấy language của user từ  session khi user đăng nhập với 1 field của user  [User-coll])

### Tech

Một Vài Package hữu ích

* [compress-images] - Compress Image!
* [jimp] - Blur Image
* [html-pdf] - HTML -> EJS -> PDF
* [lodash] - Utils Function
* [uuidv1] - Generate key
* [zip-dir] - Zipfolder

### Cài Đặt DEVELOPMENT
```sh
yarn install || npm install
```
### Cài Đặt PRODUCTION
```sh
sudo apt-get install build-essential
yarn install || npm install
pm2 start app.js
```
