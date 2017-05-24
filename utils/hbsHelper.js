var hbs = require('hbs');  
hbs.registerHelper('lastPage', function(page) {
    var lastPage;
    if(page > 0){
        lastPage = page - 1;
    }else{
        lastPage = page;
    }
    return lastPage;
});
hbs.registerHelper('nextPage', function(page) {
    var nextPage;
    nextPage = page + 1;
    return nextPage;
});

module.exports = hbs;