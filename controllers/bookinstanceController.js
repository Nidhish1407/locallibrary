var BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
var {body,validationResult} = require('express-validator');
const book = require('../models/book');
const { book_list } = require('./bookController');

var async = require('async');
var debug = require('debug')('bookinstance');


// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {

    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });

};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {

    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            if (bookinstance == null) { // No results.
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance });
        })
    };

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {

    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) { return next(err); }
            // Successful, so render.
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });

};


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
                });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res) {
    //res.send('NOT IMPLEMENTED: BookInstance delete GET');
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err,bookinstance)=>{
        if(err)return next(err);
        //if success then render
        //res.send('NOT IMPLEMENTED: BookInstance delete GET')
        res.render('bookinstance_delete',{title:'Delete Book Instance',bookinstance:bookinstance});
    });
}

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res) {
   // res.send('NOT IMPLEMENTED: BookInstance delete POST');
    BookInstance.findByIdAndRemove(req.body.bookinstance_id,(err)=>{
        if(err){return next(err);}
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
    async.parallel({
        bookinstance: (callback) => {
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback)
        },
        books: (callback) => {
            Book.find({}, 'title')
                .exec(callback);
        }
    }, function (err, results) {
        if (err) return next(err);
        //if success then render
        res.render('bookinstance_form_update', { title: 'Update Book Instance',book:results.bookinstance.book, book_list: results.books, bookinstance: results.bookinstance });
    }
    )
    return;
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) return next(err);
            //if success then render
            let book_list = null
            res.render('bookinstance_form_update', { title: 'Update Book Instance', book_list:book_list ,book: bookinstance.book, bookinstance: bookinstance });
        });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.

            async.parallel({
                bookinstance:(callback)=>{
                    BookInstance.findById(req.params.id)
                        .populate('book')
                        .exec(callback)
                },
                books:(callback)=>{
                    Book.find({}, 'title')
                        .exec(callback);
                }
            },function(err,results){
                if (err) return next(err);
                //if success then render
                res.render('bookinstance_form_update', { title: 'Update Book Instance',book:results.bookinstance.book, book_list: results.books, bookinstance: results.bookinstance });
            }
            )
            return;
        }
        else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(req.params.id,bookinstance,{},(err,the_bookinstance)=>{
                if(err){return next(err);}
                if (the_bookinstance.status != 'Available' && the_bookinstance.due_back == null)
                {
                    let err = new Error('Due back date is required if status is not available');
                    err.status = 404;
                    debug('update error:' + err);
                    res.send('Due back date is required if status is not available');
                    return; 
                    //return next(err);
                }
                //Successfull - redirect to bookinstance detail
                res.redirect(the_bookinstance.url);
            });
        }
    }
];
