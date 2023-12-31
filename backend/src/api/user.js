const express = require('express')
const User = require('../models/user.js')
const auth = require('../middleware/auth.js')
const router = new express.Router()



router.post('',async(req,res)=>{
    const user = new User(req.body)

    try{
        await user.save()
        const token = await user.generateAuthToken()

        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send()
    }
})


router.get('/me',auth,async(req,res)=>{
    res.send(req.user)
})
router.patch('/me',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password']
    const isValidOperator = updates.every((update)=> allowedUpdates.includes(update))

    if(!isValidOperator){
        return res.status(400).send({error:'invalid updates'})
    }
    try{
        updates.forEach((update)=>{
            req.user[update]= req.body[update]
        })
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(404).send('error')
    }
})

router.delete('/me',auth,async(req,res)=>{
    try{
        await req.user.deleteOne()
        res.send(req.user)
    }
    catch(e){
        res.status(400).send('error')
    }
})


router.post('/login', async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    }
    catch(e){
        res.status(400).send()
    }
})

router.post('/logout',auth, async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }
    catch(e){
        res.status(500).send()
    }
})

module.exports=router