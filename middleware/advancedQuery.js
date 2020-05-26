module.exports = (model, populate) => async (req, res, next) => {
    let reqQuery = { ...req.query };
    let query;

    const removeFields = ['page', 'populate', 'limit', 'select', 'sort']
        .forEach(field => delete reqQuery[field]);

    // Pagination 
    // Usage: works automatically
    const lim = req.query.limit || 30;
    const skipped = (parseInt(req.query.page) * lim) - lim;

    // Ability to find a store by a keyword
    // Usage: ?keywords=castro,pullandbear,adika
    if (req.query.favs) {
        const words = req.query.favs.split(/[+, ]/gmi);
        console.log(words);
        query = model.find({ alias: { $in: words } });
    }
    else if (req.query.keywords) {
        const store = req.query.keywords.replace(/[+, ]/gm, match => ' ');
        console.log(store);
        query = model.find({ alias: { $regex: `\W*(${store})\W*`, $options: 'mgi' } });
    }
    else {
        query = model.find(reqQuery).limit(lim).skip(skipped);
    }

    // Ability to sort
    // Usage: ?sort=storeName
    if (req.query.sort) {
        const sortStr = req.query.sort.replace(/,/gm, match => ' ');
        query = query.sort(sortStr);
    }

    // Populating possibility if needed
    if (populate) {
        query = query.populate(populate)
    }

    // Possibility to select certain fields
    // Usage example: ?select=storeName,expiresAt,storeColor
    if (req.query.select) {
        const selector = req.query.select.replace(/,/gi, ' ');
        query = query.select(selector);
    }

    const result = await query;

    // Saves the result and passes it to the route inside 'res.advancedResult'
    res.advancedResult = result;
    next();
}


// All of the queries are usable like this:
// ?select=storeName,expiresAt,storeColor&?keywords=castro+pullandbear+adika&?sort=storeName