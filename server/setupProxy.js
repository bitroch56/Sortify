module.exports = function (app) {
    app.use(proxy(`/auth/**`, { 
        target: 'http://127.0.0.1:5000'
    }));
};
