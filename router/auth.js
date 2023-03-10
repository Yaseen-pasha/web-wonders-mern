const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authenticate = require("../middleware/authenticate");

require('../db/conn');
const User = require("../model/userSchema");

router.post("/register", async (req, res)=>{
    try {
        const { name, email, phone, work, password, cpassword} = req.body;
        if (!name || !email || !phone || !work || !password || !cpassword) {
            return res.status(422).json({ error: "Plz filled the field properly" });
        }
        const userExist = await User.findOne({email:email});
        if(userExist){
        res.status(422).json({"message":"User Already Exist"});
        }else if (password != cpassword) {
        return res.status(422).json({ error: "password are not matching" });
        } else{
            const userData = new User(req.body);
            await userData.save()
            res.status(201).json({"message":"user registered Successfully"});
        }
    } catch (error) {
    res.status(400).json({"message":"Plz Fill the form properly"});
    console.log(error)
    }
});

// login route 
router.post('/signin', async (req, res) => {
    try {
        let token;
        const { email, password } = req.body;
        const userLogin = await User.findOne({ email: email });
        if (userLogin) {
            const isMatch = await bcrypt.compare(password, userLogin.password);
            if (isMatch) {
                token = await userLogin.generateAuthToken();
                console.log(token);
                res.cookie('jwtoken', token, {
                    expires: new Date(Date.now() + 25892000000),
                    httpOnly:true
                });
                res.json({ message: "user Signin Successfully" });
            } else {
                res.status(400).json({ error: "Invalid Password " });
            }
        } else {
             res.status(400).json({ error: "Invalid Email " });
        }
    } catch (err) {
        console.log(err);
    }
});


// blog ka page 
router.get('/blog', authenticate ,(req, res) => {
    // console.log(`Hello my About`);
    res.send(req.rootUser);
});

// get user data for contact us and home page 
router.get('/getdata', authenticate, (req, res) => {
    // console.log(`Hello my About`);
    res.send(req.rootUser);
});

// contact us page 
router.post('/contact', authenticate, async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (!name || !email || !phone || !message) {
            console.log("error in contact form");
            return res.json({ error: "plzz filled the contact form " });
        }
        
        const userContact = await User.findOne({ _id: req.userID });
        if (userContact) {
            const userMessage = await userContact.addMessage(name, email, phone, message);
            await userMessage.save();
            res.status(201).json({ message: "user Contact successfully" });
        }   
    } catch (error) {
        console.log(error);
    }
});

// Logout  ka page 
router.get('/logout', (req, res) => {
    console.log(`Hello my Logout Page`);
    res.clearCookie('jwtoken', { path: '/' });
    res.status(200).send('User logout');
});

module.exports = router;