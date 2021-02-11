const express = require('express');
const app = express();
const port = 5001;

const {User} = require('./models/User');

const cors = require('cors') //포스트맨 사용시 에러 해결
app.use(cors());

const config = require('./config/key');

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const {auth} = require('./middleware/auth');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI,{
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log("MongoDB connected..."))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World! wowowowowowow.')
})

app.post('/api/users/register',(req, res) => {
    //회원 가입 할때 필요한 정보들을 client에서 가져오면
    //그것들을 데이터 베이스에 넣어준다.
    const user = new User(req.body)
    user.save((err,doc) => {
        if(err) return res.json({registerSuccess: false, err})
        return res.status(200).json({
            registerSuccess: true
        })
    })
})

app.post('/api/users/login', (req,res) => {

    console.log('loing post executed')
    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({email:req.body.email},(err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }

        //요청한 이메일이 있다면 비밀번호가 맞는지 확인하다. 
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({loginSuccess: false, message: '비밀번호가 틀렸습니다.'})
            //비밀번호까지 같다면 token을 생성한다. 
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                //토큰을 저장한다. 어디에? 쿠키에
                res.cookie("x_auth", user.token)
                .status(200)
                .json({loginSuccess: true, userId: user._id})
            })
        })
    })
})


app.get('/api/users/auth', auth, (req,res)=>{
    //여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 true라는 말
    res.status(200).json({
        _id: req.user._id,
        // 1이면 admin, 2면 특정부서 admin, 0이면 일반유저임으로 false
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image,
    })
})

app.get('/api/users/logout', auth, (req,res) => {
    console.log("start logout.")
    User.findOneAndUpdate(
        { _id: req.user._id },
        { token: ""},
        (err,user) => {
            if(err) return res.json({ logoutSuccess: false, err });
            return res.status(200).json({
                logoutSuccess: true,
                content: "goood"
            });
        })
})

app.get('/api/hello',(req, res) => {
    res.send("안녕하세요.")
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})