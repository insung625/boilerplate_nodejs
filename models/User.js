const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10
const jwt = require('jsonwebtoken')


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        mixlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
    },
    token: {
        type: String
    },
    toeknExp: {
        type: Number
    }
})

//반드시 모델로 감싸주기전에 아래 작업을 해야한다!! 아니면 동작안함
//비밀번호 암호화
userSchema.pre('save', function(next){
    //this로 유저정보 불러옴
    var user = this;
    console.log('user info')
    //저장전에 비밀번호를 암호화 시킨다.
    if(user.isModified('password')){
        console.log('try....')
        bcrypt.genSalt(saltRounds, function(err,salt){
            if(err) return next(err)
            bcrypt.hash(user.password, salt, function(err, hash){
                if(err) return next(err)
                user.password = hash
                console.log('goood')
                next()
            })
        })
    } else {
        next()
    }
})

//비밀번호 비교
userSchema.methods.comparePassword = function (plainPassword, cb) {

    //데이터베이스에 암호화된 비밀번호와 비교
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err);
        cb(null, isMatch);
    })
}

//토큰 생성하기
userSchema.methods.generateToken = function(cb) {

    var user = this;
    //jsonwebtoken을 이용해서 token을 생성하기
    var token = jwt.sign(user._id.toHexString(),'secretToken')
    //user._id + 'secretToken' = token
    // 'secretToken을 이용해 decode하면 -> user._id
    user.token = token
    user.save(function(err, user){
        if(err) return cb(err)
        cb(null, user)
    })
}

userSchema.statics.findByToken = function(token, cb){
    var user = this;

    
    jwt.verify(token, 'secretToken', function(err, decoded) {
        //유저 아이디를 이용해서 유저를 찾은 다음에
        //클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인

        user.findOne({"_id": decoded, "token": token}, function(err, user) {
            if(err) return cb(err);
            cb(null, user);
        })
    })
}

const User = mongoose.model('User', userSchema)

module.exports = { User }