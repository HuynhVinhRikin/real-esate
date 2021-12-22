"use strict";

module.exports = {
    supportMail: "no-reply@trixgo.com",

    email: process.env.MAILER_SENDER || '...',
    pass:  process.env.MAILER_PWD    || '...',
    siteName: 'https://trixgo.com/',
    password: process.env.MAILER_PWD || '...',

    host: process.env.MAILER_HOST || 'smtp.gmail.com',
    port: process.env.MAILER_PORT || '587',
    service: 'Gmail',
};