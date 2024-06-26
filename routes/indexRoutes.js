const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Booking = require('../models/Booking');
const Testimony = require('../models/Testimony');


// if not admin, redirect to login
function checkAuthenticatedAdmin(req,res,next){
    if(req.isAuthenticated() && req.user.admin === true){
        return next();
    }
    res.redirect('/login');
};

// if not authenticated user, redirect to login (buy ticket page)
function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
};

// if authenticated, redirect to home
function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect('/home');
    }
    next();
};

// Home
router.get('/home', async function(req, res) {
    try {
        let perPage = 3;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ {$sort: {updatedAt: -1}}])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();
        const testimonies = await Testimony.find({ status: true }); 

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        const locals = {
            title: 'Gardens by the Bay',
            description: 'Page Description',
            header: 'Page Header',
            layout: 'mainlayout.ejs',
            name: req.user ? req.user.name : 'Guest', 
            data: data,  
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            testimonies: testimonies
        };

        res.render('index', locals);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});

// Posts
router.get('/post/:id', async function(req, res) {
    try {
        const post = await Post.findById(req.params.id);
        const locals = {
            title: 'Posts',
            description: 'Page Description',
            header: 'Page Header',
            layout: 'mainlayout.ejs',
            post: post
        };
        res.render('post', locals);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

//Search
router.post('/search', async function(req, res) {
    try {
        let searchTerm = req.body.searchTerm;
        let searchNoSpecialChar = '';

        if (searchTerm) {
            searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "");
        }

        let sortBy = req.body.sortBy || 'createdAt'; 
        let sortOrder = -1; 

        let minPrice = parseInt(req.body.minPrice);
        let maxPrice = parseInt(req.body.maxPrice);

        let filter = {}; 

        if (!isNaN(minPrice) && !isNaN(maxPrice)) {
            filter.ticketPrice = { $gte: minPrice, $lte: maxPrice };
        }

        const query = {};

        if (searchNoSpecialChar) {
            query.$or = [
                { title: { $regex: new RegExp(searchNoSpecialChar, 'i') } },
                { body: { $regex: new RegExp(searchNoSpecialChar, 'i') } }
            ];
        }

        Object.assign(query, filter);

        if (sortBy === "-createdAt") {
            sortOrder = 1; 
        }
        
        let data;
        if (sortBy === "-createdAt") {
            data = await Post.find(query).sort({ createdAt: sortOrder, '_id': sortOrder });
        } else {
            data = await Post.find(query).sort({ [sortBy]: sortOrder, '_id': sortOrder });
        }

        const locals = {
            title: 'Search',
            description: 'Page Description',
            layout: 'mainlayout.ejs',
            data: data
        };

        res.render("search", locals);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});





// Profile
router.get('/profile', checkAuthenticated, async function(req, res) {
    const bookings = await Booking.find({ userID: req.user.id });
    console.log(bookings);
    var locals = {
        title: 'Profile',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs',
        bookings: bookings
    };
    res.render('profile.ejs', locals);
});

// Edit Booking
router.get('/editbooking/:id', async function(req, res) {
    const booking = await Booking.findById(req.params.id);
    var locals = {
        title: 'Edit User',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs',
        booking: booking
    };
    res.render('editbooking.ejs', locals);
});

// Login Page
router.get('/login', checkNotAuthenticated ,function(req, res) {
var locals = {
    title: 'Log In',
    description: 'Page Description',
    header: 'Page Header',
    layout:'mainlayout.ejs'
    };
res.render('login.ejs', locals);
});

// SignUp Page
router.get('/signup', checkNotAuthenticated, function(req, res) {
var locals = {
    title: 'Sign Up',
    description: 'Page Description',
    header: 'Page Header',
    layout:'mainlayout.ejs'
    };
res.render('signup.ejs', locals);
});

// About Page
router.get('/about', function(req, res) {
    var locals = {
        title: 'About',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs'
    };
    res.render('about.ejs', locals);
});

// Buy Tickets Page
router.get('/buytickets', checkAuthenticated, async function(req, res) {
    try {
        const data = await Post.find();
        const locals = {
            title: 'Buy Tickets',
            description: 'Page Description',
            header: 'Page Header',
            layout: 'mainlayout.ejs',
            data: data, 
            success: req.flash('success')[0],  
            error: req.flash('error')[0]
        };

        res.render('buytickets.ejs', locals);
    } catch (error) {
        console.error("Error fetching post data:", error);
        res.status(500).send("An error occurred while fetching post data. Please try again later.");
    }
});

// Contact Page
router.get('/contact', function(req, res) {
    var locals = {
        title: 'Contact',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs'
    };
    res.render('contact.ejs', locals);
});

// Our History Page
router.get('/ourhistory', function(req, res) {
    var locals = {
        title: 'Our History',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs'
    };
    res.render('ourhistory.ejs', locals);
});

// Our Story Page
router.get('/ourstory', function(req, res) {
    var locals = {
        title: 'Our Story',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs'
    };
    res.render('ourstory.ejs', locals);
});

// Sustainability Efforts Page
router.get('/sustainabilityefforts', function(req, res) {
    var locals = {
        title: 'Sustainability Efforts',
        description: 'Page Description',
        header: 'Page Header',
        layout:'mainlayout.ejs'
    };
    res.render('sustainabilityefforts.ejs', locals);
});

// ADMIN ROUTES

// Admin dashboard
router.get('/adminDashboard', checkAuthenticatedAdmin, function(req, res) {
    const user = req.user;
    var locals = {
        title: 'Admin Dashboard',
        description: 'Page Description',
        header: 'Page Header',
        user: user,
        layout:'adminlayout.ejs'
    };
    res.render('admin/adminDashboard.ejs', locals);
});

// User accounts
router.get('/useraccount', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    const users = await User.find();
    var locals = {
        title: 'User Account',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        users: users,
        user: user
    };
    res.render('admin/useraccount.ejs', locals);
});

// Edit User
router.get('/edituser/:id', checkAuthenticatedAdmin, async function(req, res) {
    const user = await User.findById(req.params.id);
    var locals = {
        title: 'Edit User',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        user: user
    };
    res.render('admin/edituser.ejs', locals);
});

// Ticket Booking
router.get('/ticketbooking', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    const bookings = await Booking.find();
    var locals = {
        title: 'Ticket Booking',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        bookings: bookings,
        user: user
    };
    res.render('admin/ticketbooking.ejs', locals);
});

// Ticket Availability
router.get('/ticketavailability', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    const data = await Post.find();
    var locals = {
        title: 'Ticket Availability',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        data: data,
        user: user
    };
    res.render('admin/ticketavailability.ejs', locals);
});

// Edit Availability
router.get('/editavailability/:id', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    const data = await Post.findById(req.params.id);
    var locals = {
        title: 'Edit Availability',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        data: data,
        user: user
    };
    res.render('admin/editavailability.ejs', locals);
});

// Testimony
router.get('/testimony', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    const testimonies = await Testimony.find();
    var locals = {
        title: 'Testimony',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        testimonies: testimonies,
        user: user
    };
    res.render('admin/testimony.ejs', locals);
});

// NewsLetter
router.get('/newsletter', checkAuthenticatedAdmin, function(req, res) {
    const user = req.user;
    var locals = {
        title: 'Newsletter',
        description: 'Page Description',
        header: 'Page Header',
        layout:'adminlayout.ejs',
        user: user
    };
    res.render('admin/newsletter.ejs', locals);
});

// Admin Posts
router.get('/blog', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    try {
        const data = await Post.find();
        var locals = {
            title: 'Blog',
            description: 'Page Description',
            header: 'Page Header',
            layout:'adminlayout.ejs',
            data: data,
            user: user,
            success: req.query.success,
            error: req.query.error,
            
        };
        res.render('admin/blog.ejs', locals);
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        res.status(500).send("An error occurred while fetching blog posts. Please try again later.");
    };
});

// Add Get
router.get('/add-post', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    try {
        const data = await Post.find();
        const locals = {
            title: 'Add Blog',
            description: 'Page Description',
            header: 'Page Header',
            layout:'adminlayout.ejs',
            data: data,
            user: user,
            success: req.query.success === 'true',
            error: req.query.error 
        };
        res.render('admin/add-post.ejs', locals);
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        res.status(500).send("An error occurred while fetching blog posts. Please try again later.");
    };
});

// Add Post
router.post('/add-post', async function(req, res) {
    const user = req.user;
    try {
        const { title, body, imageUrl, ticketPrice, ticketQuantity } = req.body;

        if (!title || !body || !imageUrl || !ticketPrice || !ticketQuantity) {
            throw new Error("All fields are required.");
        }

        const newPost = new Post({
            title,
            body,
            imageUrl,
            ticketPrice,
            user:user
        });

        await Post.create(newPost);
        return res.redirect('/blog?success=true');
    } catch (error) {
        console.error("Error adding blog post:", error);
        res.redirect(`/add-post?error=${encodeURIComponent(error.message)}`);
    }
});


// Edit Get
router.get('/edit-post/:id', checkAuthenticatedAdmin, async function(req, res) {
    const user = req.user;
    try {
        const data = await Post.findOne({ _id: req.params.id });
        const locals = {
            title: 'Edit Blog',
            description: 'Page Description',
            header: 'Page Header',
            layout:'adminlayout.ejs',
            data: data,
            user: user,
            success: req.query.success === 'true',
            error: req.query.error
        };
        res.render('admin/edit-post.ejs', locals);
    } catch (error) {
        console.error("Error fetching blog post:", error);
    }
});

module.exports = router;